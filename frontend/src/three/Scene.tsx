import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Instances, Instance } from "@react-three/drei";
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

    const directories = Array.from(directoryMap.keys());
    const maxChurn = Math.max(...files.map((f) => f.churn), 1);

    directories.forEach((dirName, dirIndex) => {
      const dirFiles = directoryMap.get(dirName)!;

      dirFiles.forEach((file, fileIndex) => {
        const x = (dirIndex - directories.length / 2) * 3; // Directory spacing
        const y = fileIndex * 1.2; // File spacing within directory
        const z = 0;

        const churnFactor = Math.min(file.churn / maxChurn, 1);
        const color = interpolateColor("#87cefa", "#ff0000", churnFactor);
        const emissiveColor = file.hotspot_score > 0.8 ? "hotpink" : null;

        positions.push({
          position: [x, y, z],
          color,
          emissiveColor,
          file,
        });
      });
    });

    return positions;
  }, [directoryMap, files]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
      />

      <group ref={groupRef}>
        {filePositions.map((item, index) => (
          <mesh
            key={index}
            position={item.position}
            onClick={() => onFileClick(item.file.path)}
          >
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial
              color={item.color}
              emissive={item.emissiveColor || "#000000"}
              emissiveIntensity={item.emissiveColor ? 0.3 : 0}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}
