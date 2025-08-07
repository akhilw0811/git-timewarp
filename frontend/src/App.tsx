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
  const [threshold, setThreshold] = useState(getHotspotThreshold());
  let filteredFiles = showHotspotsOnly
    ? files.filter((file) => file.hotspot_score >= threshold)
    : files;

  // If hotspots-only yields no results, fall back to top-N hottest
  const usedFallback = showHotspotsOnly && filteredFiles.length === 0 && files.length > 0;
  if (usedFallback) {
    const TOP_N = 50;
    filteredFiles = [...files]
      .sort((a, b) => (b.hotspot_score || 0) - (a.hotspot_score || 0))
      .slice(0, Math.min(TOP_N, files.length));
  }

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
        <Scene files={filteredFiles} hotspotThreshold={threshold} onFileClick={handleFileClick} />
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
          threshold={threshold}
          onThresholdChange={setThreshold}
        />
      </div>
      {/* Legend + status */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="bg-gray-900/70 rounded px-3 py-2 text-xs text-gray-200 space-y-1">
          <div className="font-semibold text-white">Legend</div>
          <div className="flex items-center space-x-2"><span className="w-3 h-3 inline-block bg-[#87cefa]"></span><span>Low churn</span></div>
          <div className="flex items-center space-x-2"><span className="w-3 h-3 inline-block bg-[#ff0000]"></span><span>High churn (larger cubes)</span></div>
          <div className="flex items-center space-x-2"><span className="w-3 h-3 inline-block bg-pink-500"></span><span>Hotspot ≥ τ</span></div>
          <div className="text-gray-300 pt-1">Showing {filteredFiles.length} / {files.length} files • τ={threshold.toFixed(2)}</div>
        </div>
      </div>


      {selectedFile && selectedCommitId && (
        <DiffModal
          commitId={selectedCommitId}
          filePath={selectedFile}
          onClose={handleCloseDiff}
        />
      )}

      {/* Fallback banner when hotspots-only had zero matches */}
      {usedFallback && (
        <div className="absolute top-4 left-4 pointer-events-none">
          <div className="text-xs text-yellow-300 bg-black/60 px-2 py-1 rounded">
            No files met hotspot threshold {threshold}. Showing top hottest files.
          </div>
        </div>
      )}

      {/* No files overlay (after filtering/fallback) */}
      {!loading && commits.length > 0 && filteredFiles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-gray-400 bg-black/60 px-4 py-2 rounded">No files to display for this commit</div>
        </div>
      )}
    </div>
  );
}

export default App;
