import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./three/Scene";
import TimelineSlider from "./components/TimelineSlider";
import DiffModal from "./components/DiffModal";
import HotspotToggle from "./components/HotspotToggle";
import { useSnapshots } from "./hooks/useSnapshots";

function App() {
  const [showHotspotsOnly, setShowHotspotsOnly] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);

  const { commits, currentIndex, setCurrentIndex, files, loading, error } =
    useSnapshots();

  // Filter files based on hotspot toggle
  const filteredFiles = showHotspotsOnly
    ? files.filter((file) => file.hotspot_score > 0.8)
    : files;

  const handleFileClick = (filePath: string) => {
    if (commits[currentIndex]) {
      setSelectedFile(filePath);
      setSelectedCommitId(commits[currentIndex].id);
    }
  };

  const handleCloseDiff = () => {
    setSelectedFile(null);
    setSelectedCommitId(null);
  };

  if (error) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-black relative">
      <Canvas camera={{ position: [0, 0, 45], fov: 100 }}>
        <Scene files={filteredFiles} onFileClick={handleFileClick} />
      </Canvas>

      <div className="absolute bottom-4 left-4 right-4">
        <TimelineSlider
          currentIndex={currentIndex}
          totalCommits={commits.length}
          onChange={setCurrentIndex}
          disabled={loading}
        />
      </div>

      <div className="absolute top-4 right-4">
        <HotspotToggle
          enabled={showHotspotsOnly}
          onChange={setShowHotspotsOnly}
          disabled={loading}
        />
      </div>

      {selectedFile && selectedCommitId && (
        <DiffModal
          commitId={selectedCommitId}
          filePath={selectedFile}
          onClose={handleCloseDiff}
        />
      )}
    </div>
  );
}

export default App;
