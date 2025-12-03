
export interface Task {
  id: string;
  text: string;
  completed: boolean;
  pomodoros: number;
}

export interface DailyStats {
  date: string;
  pomodorosCompleted: number;
  totalTimeMinutes: number;
}

export interface DayData {
  date: string;
  tasks: Task[];
  stats: DailyStats;
}

export type Database = Record<string, DayData>;

export enum TimerMode {
  WORK = 'WORK',
  SHORT_BREAK = 'SHORT_BREAK',
  LONG_BREAK = 'LONG_BREAK',
}

export interface TimerSettings {
  workDuration: number; // in seconds
  shortBreakDuration: number;
  longBreakDuration: number;
}
