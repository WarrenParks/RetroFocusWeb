import { useState, useEffect, useCallback } from 'react';
import { 
  pb, 
  isLoggedIn, 
  currentUser, 
  login as pbLogin, 
  register as pbRegister, 
  logout as pbLogout,
  fetchAllData,
  ensureDayExists,
  syncDay,
  createTask as pbCreateTask,
  updateTask as pbUpdateTask,
  deleteTask as pbDeleteTask,
  migrateTask as pbMigrateTask,
  PBTask,
} from '../lib/pocketbase';
import type { Database, DayData, Task } from '../types';
import { getTodayDateString } from '../utils/formatTime';

export interface UsePocketBaseReturn {
  // Auth state
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
  error: string | null;
  
  // Auth actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  // Data state
  db: Database;
  isSyncing: boolean;
  
  // Data actions
  refreshData: () => Promise<void>;
  addTask: (date: string, text: string) => Promise<Task | null>;
  toggleTask: (date: string, taskId: string) => Promise<void>;
  removeTask: (date: string, taskId: string) => Promise<void>;
  moveTaskToToday: (fromDate: string, task: Task) => Promise<Task | null>;
  updateDayStats: (date: string, stats: Partial<DayData['stats']>) => Promise<void>;
  incrementTaskPomodoro: (date: string, taskId: string) => Promise<void>;
}

export function usePocketBase(): UsePocketBaseReturn {
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn());
  const [user, setUser] = useState(currentUser());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [db, setDb] = useState<Database>({});
  const [isSyncing, setIsSyncing] = useState(false);

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setIsAuthenticated(!!token);
      setUser(model);
    });

    // Initial check
    setIsAuthenticated(isLoggedIn());
    setUser(currentUser());
    setIsLoading(false);

    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch data when authenticated
  const refreshData = useCallback(async () => {
    if (!isLoggedIn()) {
      setDb({});
      return;
    }

    setIsSyncing(true);
    try {
      const data = await fetchAllData();
      
      // Ensure today exists
      const today = getTodayDateString();
      if (!data[today]) {
        const dayId = await ensureDayExists(today);
        if (dayId) {
          data[today] = {
            date: today,
            tasks: [],
            stats: { date: today, pomodorosCompleted: 0, totalTimeMinutes: 0 },
            _pbDayId: dayId,
          };
        }
      }
      
      setDb(data);
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError('Failed to sync data');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Refresh data when auth changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshData();
    } else {
      setDb({});
    }
  }, [isAuthenticated, refreshData]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      await pbLogin(email, password);
      return true;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      await pbRegister(email, password);
      return true;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    pbLogout();
    setDb({});
  };

  const addTask = async (date: string, text: string): Promise<Task | null> => {
    if (!isAuthenticated) return null;

    // Ensure day exists
    let dayData = db[date];
    let dayId = (dayData as any)?._pbDayId;

    if (!dayId) {
      dayId = await ensureDayExists(date);
      if (!dayId) return null;
    }

    const pbTask = await pbCreateTask(dayId, text);
    if (!pbTask) return null;

    const newTask: Task = {
      id: pbTask.id,
      text: pbTask.text,
      completed: pbTask.completed,
      pomodoros: pbTask.pomodoros,
    };

    // Update local state
    setDb(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        date,
        tasks: [...(prev[date]?.tasks || []), newTask],
        stats: prev[date]?.stats || { date, pomodorosCompleted: 0, totalTimeMinutes: 0 },
        _pbDayId: dayId,
      },
    }));

    return newTask;
  };

  const toggleTask = async (date: string, taskId: string): Promise<void> => {
    if (!isAuthenticated) return;

    const task = db[date]?.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;

    // Optimistic update
    setDb(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        tasks: prev[date].tasks.map(t =>
          t.id === taskId ? { ...t, completed: newCompleted } : t
        ),
      },
    }));

    await pbUpdateTask(taskId, { completed: newCompleted });
  };

  const removeTask = async (date: string, taskId: string): Promise<void> => {
    if (!isAuthenticated) return;

    // Optimistic update
    setDb(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        tasks: prev[date].tasks.filter(t => t.id !== taskId),
      },
    }));

    await pbDeleteTask(taskId);
  };

  const moveTaskToToday = async (fromDate: string, task: Task): Promise<Task | null> => {
    if (!isAuthenticated) return null;

    const today = getTodayDateString();
    let todayDayId = (db[today] as any)?._pbDayId;

    if (!todayDayId) {
      todayDayId = await ensureDayExists(today);
      if (!todayDayId) return null;
    }

    const migratedPbTask = await pbMigrateTask(task.id, todayDayId);
    if (!migratedPbTask) return null;

    const migratedTask: Task = {
      id: migratedPbTask.id,
      text: migratedPbTask.text,
      completed: migratedPbTask.completed,
      pomodoros: migratedPbTask.pomodoros,
    };

    // Update local state
    setDb(prev => {
      const newDb = { ...prev };

      // Remove from old date
      if (newDb[fromDate]) {
        newDb[fromDate] = {
          ...newDb[fromDate],
          tasks: newDb[fromDate].tasks.filter(t => t.id !== task.id),
        };
      }

      // Add to today
      newDb[today] = {
        ...newDb[today],
        date: today,
        tasks: [...(newDb[today]?.tasks || []), migratedTask],
        stats: newDb[today]?.stats || { date: today, pomodorosCompleted: 0, totalTimeMinutes: 0 },
        _pbDayId: todayDayId,
      };

      return newDb;
    });

    return migratedTask;
  };

  const updateDayStats = async (date: string, statsUpdate: Partial<DayData['stats']>): Promise<void> => {
    if (!isAuthenticated) return;

    const dayData = db[date];
    if (!dayData) return;

    const newStats = {
      ...dayData.stats,
      ...statsUpdate,
    };

    // Optimistic update
    setDb(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        stats: newStats,
      },
    }));

    await syncDay({ ...dayData, stats: newStats });
  };

  const incrementTaskPomodoro = async (date: string, taskId: string): Promise<void> => {
    if (!isAuthenticated) return;

    const task = db[date]?.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newPomodoros = task.pomodoros + 1;

    // Optimistic update
    setDb(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        tasks: prev[date].tasks.map(t =>
          t.id === taskId ? { ...t, pomodoros: newPomodoros } : t
        ),
      },
    }));

    await pbUpdateTask(taskId, { pomodoros: newPomodoros });
  };

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    db,
    isSyncing,
    refreshData,
    addTask,
    toggleTask,
    removeTask,
    moveTaskToToday,
    updateDayStats,
    incrementTaskPomodoro,
  };
}