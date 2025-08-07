import React from "react";

interface HotspotToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  threshold: number;
  onThresholdChange: (value: number) => void;
}

export default function HotspotToggle({
  enabled,
  onChange,
  disabled = false,
  threshold,
  onThresholdChange,
}: HotspotToggleProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className="bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-lg p-3 space-y-2">
      <label className="flex items-center space-x-2 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={handleChange}
          disabled={disabled}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
        />
        <span className="text-sm text-gray-300">Show hotspots only</span>
      </label>
      <div className="flex items-center space-x-2">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={threshold}
          onChange={(e) => onThresholdChange(Number(e.target.value))}
          className="w-32 accent-blue-500"
        />
        <span className="text-xs text-gray-400">τ {threshold.toFixed(2)}</span>
      </div>
    </div>
  );
}
