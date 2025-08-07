import React, { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

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

  // Deterministic small jitter based on path
  function hash01(input: string): number {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    // map to [0,1)
    return ((h >>> 0) % 100000) / 100000;
  }

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

      const jx = hash01(file.path + "x") - 0.5;
      const jy = hash01(file.path + "y") - 0.5;
      const jz = hash01(file.path + "z") - 0.5;

      const x = Math.cos(spiralAngle) * spiralRadius + jx * 2;
      const y = Math.sin(spiralAngle) * spiralRadius + jy * 2;
      const z = jz * 8;

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
      groupRef.current.rotation.y += 0.001;
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
        {filePositions.map((item, index) => (
          <mesh
            key={index}
            position={item.position}
            onClick={() => onFileClick(item.file.path)}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredIndex(index);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={(e) => {
              e.stopPropagation();
              setHoveredIndex((prev) => (prev === index ? null : prev));
              document.body.style.cursor = "auto";
            }}
          >
            <boxGeometry args={[2.2, 2.2, 2.2]} />
            <meshStandardMaterial
              color={item.color}
              emissive={item.emissiveColor || "#000000"}
              emissiveIntensity={item.emissiveColor ? 0.35 : 0}
            />
            {hoveredIndex === index && (
              <Html center distanceFactor={8} position={[0, 2.2, 0]}>
                <div className="px-2 py-1 text-xs rounded bg-gray-900/90 text-white shadow">
                  <div className="font-semibold truncate max-w-[320px]" title={item.file.path}>
                    {item.file.path}
                  </div>
                  <div className="text-gray-300">churn: {item.file.churn}</div>
                  <div className="text-gray-300">
                    hotspot: {item.file.hotspot_score.toFixed(2)}
                  </div>
                </div>
              </Html>
            )}
          </mesh>
        ))}
      </group>
    </>
  );
}
