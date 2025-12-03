
import React, { useState } from 'react';
import { Task } from '../types';
import { TuiBox } from './TuiBox';

interface TaskListProps {
  tasks: Task[];
  activeTaskId: string | null;
  isHistory: boolean;
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  onMigrateTask?: (task: Task) => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  activeTaskId,
  isHistory,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onSelectTask,
  onMigrateTask,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onAddTask(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <TuiBox title={isHistory ? "ARCHIVED_TASKS.LOG" : "CURRENT_TASKS.EXE"} className="flex-1 min-h-[300px] flex flex-col">
      {!isHistory && (
        <div className="mb-4">
          <div className="flex items-center text-green-400 mb-2">
            <span className="mr-2">{'>'}</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ADD NEW TASK..."
              className="w-full bg-transparent border-b border-green-800 focus:border-green-400 text-green-300 placeholder-green-900 outline-none font-mono text-lg py-1"
              autoFocus
            />
          </div>
          <div className="text-xs text-green-800 pl-4">PRESS ENTER TO ADD</div>
        </div>
      )}

      {isHistory && (
        <div className="mb-4 text-green-600 italic text-sm border-b border-green-900 pb-2">
          [READ_ONLY MODE] Viewing past log. <br/>
          Migrate incomplete tasks to work on them today.
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 space-y-1">
        {tasks.length === 0 && (
          <div className="text-green-900 italic text-center py-4">NO TASKS IN RECORD</div>
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`group flex items-center p-2 cursor-pointer border border-transparent hover:border-green-900/50 hover:bg-green-900/20 transition-all ${
              activeTaskId === task.id ? 'bg-green-900/30 border-green-800' : ''
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleTask(task.id);
              }}
              className="mr-3 font-bold text-xl hover:text-white"
            >
              {task.completed ? '[x]' : '[ ]'}
            </button>
            
            <div 
              className="flex-1"
              onClick={() => !isHistory && onSelectTask(task.id)}
            >
              <span className={`${task.completed ? 'line-through text-green-800' : 'text-green-300'} text-lg`}>
                {task.text}
              </span>
              {task.pomodoros > 0 && (
                 <span className="ml-2 text-xs text-green-600 font-bold">
                   {'*'.repeat(task.pomodoros)}
                 </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
               {activeTaskId === task.id && !isHistory && (
                 <span className="text-xs bg-green-900 text-green-300 px-1 mr-2 animate-pulse">ACTIVE</span>
               )}
               
               {isHistory && !task.completed && onMigrateTask && (
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     onMigrateTask(task);
                   }}
                   className="text-xs border border-green-700 text-green-700 hover:bg-green-700 hover:text-black px-2 py-0.5"
                 >
                   MIGRATE
                 </button>
               )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTask(task.id);
                }}
                className="opacity-0 group-hover:opacity-100 text-green-700 hover:text-red-500 font-bold px-2"
              >
                DEL
              </button>
            </div>
          </div>
        ))}
      </div>
    </TuiBox>
  );
};
