import React, { ReactNode } from 'react';

interface TuiBoxProps {
  title?: string;
  children: ReactNode;
  className?: string;
  isActive?: boolean;
}

export const TuiBox: React.FC<TuiBoxProps> = ({ title, children, className = '', isActive = false }) => {
  return (
    <div className={`relative border-2 p-4 mb-4 transition-colors duration-200 ${
      isActive 
        ? 'border-green-400 bg-green-900/10 shadow-[0_0_15px_rgba(51,255,51,0.15)]' 
        : 'border-green-800 bg-black/50'
    } ${className}`}>
      {title && (
        <div className="absolute -top-3 left-4 px-2 bg-[#0c0c0c]">
          <span className={`text-xl font-bold tracking-wider ${isActive ? 'text-green-400' : 'text-green-700'}`}>
            [{title}]
          </span>
        </div>
      )}
      {children}
    </div>
  );
};