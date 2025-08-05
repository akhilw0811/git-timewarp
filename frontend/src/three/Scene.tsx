import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box } from '@react-three/drei'
import * as THREE from 'three'

interface FileData {
  path: string
  churn: number
  hotspot: number
}

interface SceneProps {
  snapshot?: {
    timestamp: string
    hash: string
    files: FileData[]
  }
  showHotspots: boolean
  onFileClick: (filePath: string) => void
}

export default function Scene({ snapshot, showHotspots, onFileClick }: SceneProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005
    }
  })

  if (!snapshot) {
    return null
  }

  const maxChurn = Math.max(...snapshot.files.map(f => f.churn), 1)
  const gridSize = Math.ceil(Math.sqrt(snapshot.files.length))
  const spacing = 2

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      <group ref={groupRef}>
        {snapshot.files.map((file, index) => {
          const row = Math.floor(index / gridSize)
          const col = index % gridSize
          const x = (col - gridSize / 2) * spacing
          const z = (row - gridSize / 2) * spacing
          const size = Math.max(0.1, (file.churn / maxChurn) * 2)
          
          const color = file.hotspot > 0.8 && showHotspots 
            ? '#ff6b6b' 
            : `hsl(${(file.churn / maxChurn) * 240}, 70%, 50%)`

          return (
            <Box
              key={file.path}
              position={[x, 0, z]}
              args={[size, size, size]}
              onClick={() => onFileClick(file.path)}
            >
              <meshStandardMaterial 
                color={color}
                emissive={file.hotspot > 0.8 && showHotspots ? color : '#000000'}
                emissiveIntensity={file.hotspot > 0.8 && showHotspots ? 0.3 : 0}
              />
            </Box>
          )
        })}
      </group>
    </>
  )
} 