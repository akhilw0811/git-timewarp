import React from "react";

interface TimelineSliderProps {
  currentIndex: number;
  totalCommits: number;
  onChange: (index: number) => void;
  disabled?: boolean;
}

export default function TimelineSlider({
  currentIndex,
  totalCommits,
  onChange,
  disabled = false,
}: TimelineSliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    onChange(value);
  };

  return (
    <div className="bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-300 min-w-[60px]">
          {currentIndex + 1} / {totalCommits}
        </span>

        <input
          type="range"
          min="0"
          max={Math.max(0, totalCommits - 1)}
          value={currentIndex}
          onChange={handleChange}
          disabled={disabled}
          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background:
              "linear-gradient(to right, #3b82f6 0%, #3b82f6 50%, #374151 50%, #374151 100%)",
          }}
        />

        <div className="text-xs text-gray-400 min-w-[120px]">
          {disabled ? "Loading..." : "Timeline"}
        </div>
      </div>
    </div>
  );
}
