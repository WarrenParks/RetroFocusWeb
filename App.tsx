import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_SETTINGS, ASCII_HEADER } from './constants';
import { TimerMode, Task, DailyStats, Database, DayData } from './types';
import { getTodayDateString, generateMarkdown, downloadMarkdown } from './utils/formatTime';
import { TaskList } from './components/TaskList';
import { TimerDisplay } from './components/TimerDisplay';
import { TuiBox } from './components/TuiBox';
import { HistoryList } from './components/HistoryList';

// Helper for safe ID generation
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const App: React.FC = () => {
  const todayDate = getTodayDateString();

  // --- Database State ---
  const [db, setDb] = useState<Database>(() => {
    try {
      const saved = localStorage.getItem('retrofocus_db');
      let parsedDb: Database = saved ? JSON.parse(saved) : {};
      
      // Legacy migration check (if coming from v1)
      if (Object.keys(parsedDb).length === 0) {
        const oldTasks = localStorage.getItem('tui-pomodoro-tasks');
        const oldStats = localStorage.getItem('tui-pomodoro-stats');
        if (oldTasks || oldStats) {
          try {
            // Try to guess date from stats or default to today
            const statsObj = oldStats ? JSON.parse(oldStats) : { date: todayDate, pomodorosCompleted: 0, totalTimeMinutes: 0 };
            const tasksObj = oldTasks ? JSON.parse(oldTasks) : [];
            const dateKey = statsObj.date || todayDate;
            parsedDb[dateKey] = {
              date: dateKey,
              tasks: tasksObj,
              stats: statsObj
            };
          } catch (e) {
            console.warn("Failed to migrate legacy data", e);
          }
        }
      }

      // Ensure today exists
      if (!parsedDb[todayDate]) {
        parsedDb[todayDate] = {
          date: todayDate,
          tasks: [],
          stats: { date: todayDate, pomodorosCompleted: 0, totalTimeMinutes: 0 }
        };
      }
      
      return parsedDb;
    } catch (error) {
      console.error("Critical error loading database:", error);
      // Return a safe default state to prevent white/black screen of death
      return {
        [todayDate]: {
          date: todayDate,
          tasks: [],
          stats: { date: todayDate, pomodorosCompleted: 0, totalTimeMinutes: 0 }
        }
      };
    }
  });

  const [viewDate, setViewDate] = useState<string>(todayDate);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const [mode, setMode] = useState<TimerMode>(TimerMode.WORK);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workDuration);
  const [isActive, setIsActive] = useState(false);
  
  const lastTickRef = useRef<number | null>(null);

  // --- Persistence ---
  useEffect(() => {
    try {
      localStorage.setItem('retrofocus_db', JSON.stringify(db));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }, [db]);

  // --- Helpers ---
  const isViewingToday = viewDate === todayDate;
  const currentDayData = db[viewDate] || { 
    date: viewDate, 
    tasks: [], 
    stats: { date: viewDate, pomodorosCompleted: 0, totalTimeMinutes: 0 } 
  };
  const todayData = db[todayDate]; // Always exists due to init

  // --- Timer Logic ---
  const handleTimerComplete = () => {
    setIsActive(false);

    if (mode === TimerMode.WORK) {
      // We ONLY update "today's" stats, regardless of viewDate
      setDb(prev => {
        const today = prev[todayDate];
        const newStats = {
          ...today.stats,
          pomodorosCompleted: today.stats.pomodorosCompleted + 1,
          totalTimeMinutes: today.stats.totalTimeMinutes + (DEFAULT_SETTINGS.workDuration / 60)
        };
        
        let newTasks = [...today.tasks];
        // If active task exists in today's list, increment it
        if (activeTaskId) {
          const taskIndex = newTasks.findIndex(t => t.id === activeTaskId);
          if (taskIndex >= 0) {
             newTasks[taskIndex] = {
               ...newTasks[taskIndex],
               pomodoros: newTasks[taskIndex].pomodoros + 1
             };
          }
        }

        return {
          ...prev,
          [todayDate]: {
            ...today,
            stats: newStats,
            tasks: newTasks
          }
        };
      });

      setMode(TimerMode.SHORT_BREAK);
      setTimeLeft(DEFAULT_SETTINGS.shortBreakDuration);
    } else {
      setMode(TimerMode.WORK);
      setTimeLeft(DEFAULT_SETTINGS.workDuration);
    }
  };

  useEffect(() => {
    let interval: number;

    if (isActive && timeLeft > 0) {
      lastTickRef.current = Date.now();
      interval = window.setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - (lastTickRef.current || now)) / 1000);
        
        if (delta >= 1) {
          setTimeLeft(prev => {
            const next = prev - 1;
            if (next <= 0) {
              handleTimerComplete();
              return 0;
            }
            return next;
          });
          lastTickRef.current = now;
        }
      }, 100); 
    } else if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]); // eslint-disable-line react-hooks/exhaustive-deps


  // --- Data Handlers ---

  const handleAddTask = (text: string) => {
    const newTask: Task = {
      id: generateId(),
      text,
      completed: false,
      pomodoros: 0
    };

    setDb(prev => ({
      ...prev,
      [viewDate]: {
        ...prev[viewDate],
        tasks: [...prev[viewDate].tasks, newTask]
      }
    }));

    if (isViewingToday && !activeTaskId) setActiveTaskId(newTask.id);
  };

  const handleToggleTask = (id: string) => {
    setDb(prev => ({
      ...prev,
      [viewDate]: {
        ...prev[viewDate],
        tasks: prev[viewDate].tasks.map(t => 
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      }
    }));
  };

  const handleDeleteTask = (id: string) => {
    setDb(prev => ({
      ...prev,
      [viewDate]: {
        ...prev[viewDate],
        tasks: prev[viewDate].tasks.filter(t => t.id !== id)
      }
    }));
    if (activeTaskId === id && isViewingToday) setActiveTaskId(null);
  };

  const handleSelectTask = (id: string) => {
    // Can only select active tasks if viewing today
    if (isViewingToday) {
      setActiveTaskId(id);
    }
  };

  const handleMigrateTask = (task: Task) => {
    // Create new task copy for today
    const migratedTask: Task = {
      ...task,
      id: generateId(), // New ID to prevent conflicts
      pomodoros: 0 // Reset pomodoros for the new day
    };

    setDb(prev => {
      // Remove from old date
      const oldDay = prev[viewDate];
      const oldTasks = oldDay.tasks.filter(t => t.id !== task.id);
      
      // Add to today
      const today = prev[todayDate];
      const todayTasks = [...today.tasks, migratedTask];

      return {
        ...prev,
        [viewDate]: { ...oldDay, tasks: oldTasks },
        [todayDate]: { ...today, tasks: todayTasks }
      };
    });
  };

  const handleExport = () => {
    const md = generateMarkdown(currentDayData.tasks, currentDayData.stats);
    downloadMarkdown(md, `${viewDate}.md`);
  };

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    switch (newMode) {
      case TimerMode.WORK:
        setTimeLeft(DEFAULT_SETTINGS.workDuration);
        break;
      case TimerMode.SHORT_BREAK:
        setTimeLeft(DEFAULT_SETTINGS.shortBreakDuration);
        break;
      case TimerMode.LONG_BREAK:
        setTimeLeft(DEFAULT_SETTINGS.longBreakDuration);
        break;
    }
  };

  const activeTask = todayData.tasks.find(t => t.id === activeTaskId);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col max-w-6xl mx-auto">
      
      {/* Header */}
      <header className="mb-6 md:mb-8 text-center select-none">
        <div className="hidden md:block">
          <pre className="text-xs md:text-sm lg:text-base leading-none text-green-600 font-bold opacity-75">
            {ASCII_HEADER}
          </pre>
        </div>
        <div className="mt-2 text-green-800 text-sm tracking-[0.5em] flex justify-between items-center px-4 border-b-2 border-green-900 pb-2">
           <span className="hidden md:inline">SYSTEM_READY // V2.0.0</span>
           <span className="text-green-500 font-bold">DATE_LOADED: {viewDate}</span>
           <span className="hidden md:inline">DB_STATUS: ONLINE</span>
        </div>
        
        {/* Mobile Header Title */}
        <h1 className="md:hidden text-4xl font-bold tracking-widest text-green-500 mt-4">RETROFOCUS</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        
        {/* Left Column: History & Stats (3 cols) */}
        <div className="lg:col-span-3 flex flex-col space-y-4 order-2 lg:order-1">
           <HistoryList 
             dates={Object.keys(db)}
             currentDate={todayDate}
             viewDate={viewDate}
             onSelectDate={setViewDate}
           />
           
           <TuiBox title="METRICS_LOG" className="p-4">
             <div className="space-y-4">
               <div>
                  <div className="text-xs text-green-700 mb-1">DATE</div>
                  <div className="text-xl text-green-400 font-bold">{currentDayData.stats.date}</div>
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <div>
                    <div className="text-xs text-green-700">POMODOROS</div>
                    <div className="text-2xl text-green-400">{currentDayData.stats.pomodorosCompleted}</div>
                 </div>
                 <div>
                    <div className="text-xs text-green-700">MINUTES</div>
                    <div className="text-2xl text-green-400">{Math.round(currentDayData.stats.totalTimeMinutes)}</div>
                 </div>
               </div>
             </div>
           </TuiBox>
        </div>

        {/* Middle Column: Timer (5 cols) */}
        <div className="lg:col-span-5 flex flex-col order-1 lg:order-2">
          <TimerDisplay 
            timeLeft={timeLeft}
            isActive={isActive}
            mode={mode}
            totalDuration={
              mode === TimerMode.WORK ? DEFAULT_SETTINGS.workDuration :
              mode === TimerMode.SHORT_BREAK ? DEFAULT_SETTINGS.shortBreakDuration :
              DEFAULT_SETTINGS.longBreakDuration
            }
            activeTaskText={activeTask?.text}
            onToggleTimer={() => setIsActive(!isActive)}
            onReset={() => {
              setIsActive(false);
              handleModeChange(mode);
            }}
            onSkip={() => handleTimerComplete()}
            onModeChange={handleModeChange}
          />
          
          {!isViewingToday && (
             <div className="mt-4 border border-yellow-800 bg-yellow-900/10 p-2 text-center text-yellow-600 animate-pulse text-sm">
               WARNING: VIEWING HISTORICAL LOG. <br/>
               TIMER UPDATES TODAY'S ({todayDate}) STATS.
             </div>
          )}
        </div>

        {/* Right Column: Tasks (4 cols) */}
        <div className="lg:col-span-4 flex flex-col h-full order-3">
           <TaskList 
             tasks={currentDayData.tasks}
             activeTaskId={isViewingToday ? activeTaskId : null}
             isHistory={!isViewingToday}
             onAddTask={handleAddTask}
             onToggleTask={handleToggleTask}
             onDeleteTask={handleDeleteTask}
             onSelectTask={handleSelectTask}
             onMigrateTask={handleMigrateTask}
           />
           
           <div className="mt-4 flex justify-end">
             <button
               onClick={handleExport}
               className="group w-full lg:w-auto relative px-6 py-2 border-2 border-green-800 hover:border-green-400 transition-colors bg-black"
             >
                <span className="text-green-600 group-hover:text-green-300 font-bold tracking-wider">
                  [ DOWNLOAD {viewDate}.md ]
                </span>
             </button>
           </div>
        </div>
      </div>
      
      <footer className="mt-12 text-center text-green-900 text-xs pb-4">
        <p>RETROFOCUS TUI // LOCAL_STORAGE_DB // V2</p>
      </footer>
    </div>
  );
};

export default App;