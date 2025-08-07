import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Instances, Instance } from "@react-three/drei";
import * as THREE from "three";

interface FileSnapshot {
  path: string;
  churn: number;
  hotspot_score: number;
}

interface SceneProps {
  files: FileSnapshot[];
  onFileClick: (filePath: string) => void;
}

// Color interpolation function
function interpolateColor(
  color1: string,
  color2: string,
  factor: number,
): string {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);
  const result = c1.clone().lerp(c2, factor);
  return `#${result.getHexString()}`;
}

export default function Scene({ files, onFileClick }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  // Group files by directory
  const directoryMap = useMemo(() => {
    const map = new Map<string, FileSnapshot[]>();

    files.forEach((file) => {
      const pathParts = file.path.split("/");
      const dirName = pathParts.length > 1 ? pathParts[0] : "root";

      if (!map.has(dirName)) {
        map.set(dirName, []);
      }
      map.get(dirName)!.push(file);
    });

    return map;
  }, [files]);

  // Calculate positions for all files
  const filePositions = useMemo(() => {
    const positions: Array<{
      position: [number, number, number];
      color: string;
      emissiveColor: string | null;
      file: FileSnapshot;
    }> = [];

    const maxChurn = Math.max(...files.map((f) => f.churn), 1);
    const totalFiles = files.length;

    files.forEach((file, fileIndex) => {
      // Spiral distribution around the origin
      const spiralAngle = (fileIndex / Math.max(totalFiles, 1)) * 6 * Math.PI;
      const spiralRadius = 4 + (fileIndex / Math.max(totalFiles, 1)) * 18;

      const x = Math.cos(spiralAngle) * spiralRadius + (Math.random() - 0.5) * 2;
      const y = Math.sin(spiralAngle) * spiralRadius + (Math.random() - 0.5) * 2;
      const z = (Math.random() - 0.5) * 8;

      const churnFactor = Math.min(file.churn / maxChurn, 1);
      const color = interpolateColor("#87cefa", "#ff0000", churnFactor);
      const emissiveColor = file.hotspot_score > 0.8 ? "#ff69b4" : null;

      positions.push({ position: [x, y, z], color, emissiveColor, file });
    });

    return positions;
  }, [directoryMap, files]);

  // Subtle, slower rotation for visual interest
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0015;
    }
  });

  // Fit camera to content whenever files change
  useEffect(() => {
    if (!filePositions.length) return;

    const points: THREE.Vector3[] = filePositions.map(
      (p) => new THREE.Vector3(...p.position),
    );
    const bounds = new THREE.Box3().setFromPoints(points);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov);
    const fitDistance = maxDim / (2 * Math.tan(fov / 2)) + 5; // margin

    (camera as THREE.PerspectiveCamera).position.set(
      center.x,
      center.y,
      center.z + fitDistance,
    );
    (camera as THREE.PerspectiveCamera).near = Math.max(0.1, fitDistance / 100);
    (camera as THREE.PerspectiveCamera).far = fitDistance * 100;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    if (controlsRef.current) {
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    }
  }, [filePositions, camera]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      {/* Title */}
      <Text
        position={[0, 25, 0]}
        fontSize={2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Git Repository Files
      </Text>

      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={200}
        maxPolarAngle={Math.PI / 2}
      />

      <group ref={groupRef}>
        <Instances limit={Math.max(1, filePositions.length)}>
          <boxGeometry args={[2.2, 2.2, 2.2]} />
          <meshStandardMaterial color="#87cefa" />
          {filePositions.map((item, index) => (
            <Instance
              key={index}
              position={item.position}
              color={item.color as any}
              onClick={() => onFileClick(item.file.path)}
            />
          ))}
        </Instances>
      </group>
    </>
  );
}
