import React from "react";

interface HotspotToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export default function HotspotToggle({
  enabled,
  onChange,
  disabled = false,
}: HotspotToggleProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <div className="bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-lg p-3">
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
    </div>
  );
}
