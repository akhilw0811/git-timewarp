import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './three/Scene'
import TimelineSlider from './components/TimelineSlider'
import DiffModal from './components/DiffModal'
import HotspotToggle from './components/HotspotToggle'
import { useSnapshots } from './hooks/useSnapshots'

function App() {
  const [currentSnapshot, setCurrentSnapshot] = useState(0)
  const [showHotspots, setShowHotspots] = useState(true)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  
  const { snapshots, loading } = useSnapshots(1)

  const handleFileClick = (filePath: string) => {
    setSelectedFile(filePath)
  }

  const handleCloseDiff = () => {
    setSelectedFile(null)
  }

  return (
    <div className="w-screen h-screen bg-black relative">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <Scene 
          snapshot={snapshots[currentSnapshot]}
          showHotspots={showHotspots}
          onFileClick={handleFileClick}
        />
      </Canvas>
      
      <div className="absolute bottom-4 left-4 right-4">
        <TimelineSlider 
          current={currentSnapshot}
          total={snapshots.length}
          onChange={setCurrentSnapshot}
          disabled={loading}
        />
      </div>
      
      <div className="absolute top-4 right-4">
        <HotspotToggle 
          enabled={showHotspots}
          onChange={setShowHotspots}
        />
      </div>
      
      {selectedFile && (
        <DiffModal 
          filePath={selectedFile}
          onClose={handleCloseDiff}
        />
      )}
    </div>
  )
}

export default App 