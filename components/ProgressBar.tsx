import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  width?: number; // Number of characters
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, width = 20, label }) => {
  const filledChars = Math.round((progress / 100) * width);
  const emptyChars = width - filledChars;
  
  const bar = '█'.repeat(filledChars) + '░'.repeat(emptyChars);

  return (
    <div className="flex flex-col w-full">
      {label && <div className="mb-1 text-sm opacity-80">{label}</div>}
      <div className="font-mono text-green-500 whitespace-pre">
        [{bar}] {Math.round(progress)}%
      </div>
    </div>
  );
};