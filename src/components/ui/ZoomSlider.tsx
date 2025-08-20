import React, { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { formatZoomLevel } from '@/utils/pdfUtils';

interface ZoomSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export const ZoomSlider: React.FC<ZoomSliderProps> = ({
  value,
  onChange,
  disabled = false,
  className = '',
}) => {
  const [isInteracting, setIsInteracting] = useState(false);

  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  const handlePointerDown = () => {
    setIsInteracting(true);
  };

  const handlePointerUp = () => {
    setIsInteracting(false);
  };

  const handleValueCommit = () => {
    setIsInteracting(false);
  };

  const min = 0.25;
  const max = 5.0;
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`relative flex items-center space-x-3 ${className}`}>
      <ZoomOut className="h-4 w-4 text-gray-500 flex-shrink-0" />
      
      <div className="relative flex-1 min-w-24">
        {/* Floating percentage label */}
        <div 
          className={`absolute -top-8 transform -translate-x-1/2 
                     bg-gray-900 text-white text-xs px-2 py-1 rounded
                     pointer-events-none z-10 whitespace-nowrap
                     transition-all duration-300 ease-out
                     ${isInteracting ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={{ left: `${percentage}%` }}
        >
          {formatZoomLevel(value)}
        </div>
        
        {/* Slider component */}
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          onValueCommit={handleValueCommit}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          min={min}
          max={max}
          step={0.25}
          disabled={disabled}
          className="w-full"
        />
      </div>
      
      <ZoomIn className="h-4 w-4 text-gray-500 flex-shrink-0" />
    </div>
  );
};