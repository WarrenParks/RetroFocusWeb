
import React from 'react';
import { TuiBox } from './TuiBox';

interface HistoryListProps {
  dates: string[];
  currentDate: string;
  viewDate: string;
  onSelectDate: (date: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ 
  dates, 
  currentDate, 
  viewDate, 
  onSelectDate 
}) => {
  // Sort dates descending
  const sortedDates = [...dates].sort().reverse();

  return (
    <TuiBox title="LOG_FILES.DB" className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pr-2 space-y-1 max-h-[200px] lg:max-h-none">
        {sortedDates.map((date) => (
          <button
            key={date}
            onClick={() => onSelectDate(date)}
            className={`w-full text-left px-2 py-1 font-mono text-lg transition-colors flex justify-between group ${
              viewDate === date 
                ? 'bg-green-900 text-green-300 border border-green-700' 
                : 'text-green-800 hover:text-green-500 hover:bg-green-900/20 border border-transparent'
            }`}
          >
            <span>{date}.md</span>
            {date === currentDate && (
              <span className="text-xs self-center bg-green-700 text-black px-1 ml-2 group-hover:bg-green-500">
                TODAY
              </span>
            )}
          </button>
        ))}
      </div>
    </TuiBox>
  );
};
