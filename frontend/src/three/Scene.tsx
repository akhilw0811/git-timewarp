import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Instances, Instance, Text } from "@react-three/drei";
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

    // Force spread across entire viewport
    const totalFiles = files.length;
    const screenWidth = 60; // Very wide spread
    const screenHeight = 50; // Very tall spread

    files.forEach((file, fileIndex) => {
      // Use a spiral pattern to ensure full coverage
      const spiralAngle = (fileIndex / totalFiles) * 8 * Math.PI; // Multiple rotations
      const spiralRadius = 5 + (fileIndex / totalFiles) * 25; // Growing radius
      
      const x = Math.cos(spiralAngle) * spiralRadius + (Math.random() - 0.5) * 8;
      const y = Math.sin(spiralAngle) * spiralRadius + (Math.random() - 0.5) * 8;
      const z = (Math.random() - 0.5) * 15; // More depth variation

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
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={50}
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI / 2}
      />

      <group ref={groupRef}>
        {filePositions.map((item, index) => (
          <mesh
            key={index}
            position={item.position}
            onClick={() => onFileClick(item.file.path)}
          >
            <boxGeometry args={[3, 3, 3]} />
            <meshStandardMaterial
              color={item.color}
              emissive={item.emissiveColor || "#000000"}
              emissiveIntensity={item.emissiveColor ? 0.5 : 0}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}
