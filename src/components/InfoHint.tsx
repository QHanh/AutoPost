import React from 'react';

interface InfoHintProps {
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  size?: 'sm' | 'md';
}

// A lightweight tooltip with an "i" indicator
const InfoHint: React.FC<InfoHintProps> = ({ text, position = 'top', className = '', size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'h-4 w-4 text-[10px]' : 'h-5 w-5 text-[12px]';
  const tooltipPos: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span className={`relative inline-flex items-center group ${className}`}>
      <span
        className={`inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-700 ${sizeClasses} font-semibold cursor-default select-none`}
        aria-label="Thông tin"
      >
        i
      </span>
      <span
        className={`pointer-events-none absolute ${tooltipPos[position]} whitespace-normal break-normal hyphens-auto text-pretty min-w-[12rem] max-w-sm sm:max-w-md lg:max-w-lg rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 z-20 shadow text-left`}
        role="tooltip"
      >
        {text}
      </span>
    </span>
  );
};

export default InfoHint;
