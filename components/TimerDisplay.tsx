import React, { useEffect, useState } from 'react';
import { TimerMode } from '../types';
import { MODE_LABELS } from '../constants';
import { formatTime } from '../utils/formatTime';
import { TuiBox } from './TuiBox';
import { ProgressBar } from './ProgressBar';

interface TimerDisplayProps {
  timeLeft: number;
  isActive: boolean;
  mode: TimerMode;
  totalDuration: number;
  activeTaskText?: string;
  onToggleTimer: () => void;
  onReset: () => void;
  onSkip: () => void;
  onModeChange: (mode: TimerMode) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}


export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeLeft,
  isActive,
  mode,
  totalDuration,
  activeTaskText,
  onToggleTimer,
  onReset,
  onSkip,
  onModeChange,
  isFocusMode,
  onToggleFocusMode,
}) => {
  const progress = Math.min(100, Math.max(0, ((totalDuration - timeLeft) / totalDuration) * 100));

  // Blinking cursor effect for the timer
  const [cursorVisible, setCursorVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <TuiBox title={isFocusMode ? "POMODORO_CORE // FOCUS_MODE" : "POMODORO_CORE"} className="flex flex-col items-center justify-center p-6 text-center h-full" isActive={isActive}>

      {/* Manual Focus Toggle */}
      {onToggleFocusMode && (
        <div className="absolute top-4 right-4">
          <button
            onClick={onToggleFocusMode}
            className="text-[10px] uppercase tracking-wider text-green-800 hover:text-green-500 border border-green-900 px-2 py-1"
          >
            [{isFocusMode ? 'MINIMIZE' : 'EXPAND'}]
          </button>
        </div>
      )}

      {/* Active Task Display */}
      <div className="w-full mb-6 text-left border-b border-green-900 pb-2">
        <div className="text-xs text-green-700 mb-1">CURRENT_TARGET:</div>
        <div className="text-xl text-green-300 truncate font-bold">
          {activeTaskText ? (
            <span className="typing-effect">{activeTaskText}</span>
          ) : (
            <span className="text-green-900 italic">IDLE... SELECT A TASK</span>
          )}
        </div>
      </div>

      {/* Mode Indicators */}
      <div className="flex space-x-4 mb-4 text-sm">
        {Object.values(TimerMode).map((m) => (
          <button
            key={m}
            onClick={() => onModeChange(m)}
            className={`px-2 py-1 border ${mode === m
                ? 'bg-green-500 text-black border-green-500 font-bold'
                : 'border-green-900 text-green-800 hover:text-green-600 hover:border-green-700'
              }`}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      {/* Big Timer */}
      <div className="relative mb-6">
        <div className={`text-[6rem] leading-none font-bold tracking-widest tui-glow ${isActive ? 'text-green-400' : 'text-green-700'}`}>
          {formatTime(timeLeft)}
        </div>
        {isActive && cursorVisible && (
          <div className="absolute top-4 -right-8 w-4 h-20 bg-green-500 opacity-50"></div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full mb-8">
        <ProgressBar progress={progress} width={30} label={`STATUS: ${isActive ? 'RUNNING' : 'PAUSED'}`} />
      </div>

      {/* Controls */}
      <div className="flex space-x-6 w-full justify-center">
        <button
          onClick={onToggleTimer}
          className="flex-1 py-3 text-xl font-bold border-2 border-green-600 hover:bg-green-600 hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          [{isActive ? 'PAUSE' : 'START'}]
        </button>
        <button
          onClick={onReset}
          className="px-6 py-3 text-lg border border-green-800 text-green-700 hover:border-green-500 hover:text-green-400 transition-colors"
        >
          RESET
        </button>
        <button
          onClick={onSkip}
          className="px-6 py-3 text-lg border border-green-800 text-green-700 hover:border-green-500 hover:text-green-400 transition-colors"
        >
          SKIP
        </button>
      </div>
    </TuiBox>
  );
};