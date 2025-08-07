import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./three/Scene";
import TimelineSlider from "./components/TimelineSlider";
import DiffModal from "./components/DiffModal";
import HotspotToggle from "./components/HotspotToggle";
import { getHotspotThreshold } from "./lib/config";
import { useSnapshots } from "./hooks/useSnapshots";

function App() {
  const [showHotspotsOnly, setShowHotspotsOnly] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedCommitId, setSelectedCommitId] = useState<string | null>(null);

  const { commits, currentIndex, setCurrentIndex, files, loading, error } =
    useSnapshots();

  // Filter files based on hotspot toggle
  const threshold = getHotspotThreshold();
  const filteredFiles = showHotspotsOnly
    ? files.filter((file) => file.hotspot_score >= threshold)
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
      <Canvas gl={{ antialias: true, alpha: false }} dpr={[1, 2]} camera={{ position: [0, 0, 30], fov: 70 }}>
        <Scene files={filteredFiles} onFileClick={handleFileClick} />
      </Canvas>

      <div className="absolute bottom-4 left-4 right-4 pointer-events-auto">
        <TimelineSlider
          currentIndex={currentIndex}
          totalCommits={commits.length}
          onChange={setCurrentIndex}
          disabled={loading}
        />
      </div>

      <div className="absolute top-4 right-4 pointer-events-auto">
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

      {/* No files overlay */}
      {!loading && commits.length > 0 && files.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-gray-400 bg-black/60 px-4 py-2 rounded">No files to display for this commit</div>
        </div>
      )}
    </div>
  );
}

export default App;
