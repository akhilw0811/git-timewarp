import React from 'react'

interface TimelineSliderProps {
  current: number
  total: number
  onChange: (index: number) => void
  disabled?: boolean
}

export default function TimelineSlider({ current, total, onChange, disabled = false }: TimelineSliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    onChange(value)
  }

  return (
    <div className="bg-gray-900 bg-opacity-80 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-300 min-w-[60px]">
          {current + 1} / {total}
        </span>
        
        <input
          type="range"
          min="0"
          max={Math.max(0, total - 1)}
          value={current}
          onChange={handleChange}
          disabled={disabled}
          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
        />
        
        <div className="text-xs text-gray-400 min-w-[120px]">
          {disabled ? 'Loading...' : 'Timeline'}
        </div>
      </div>
      
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
} 