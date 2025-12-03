import { TimerMode, TimerSettings } from './types';

export const DEFAULT_SETTINGS: TimerSettings = {
  workDuration: 25 * 60,
  shortBreakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
};

export const MODE_LABELS: Record<TimerMode, string> = {
  [TimerMode.WORK]: 'POMODORO',
  [TimerMode.SHORT_BREAK]: 'SHORT BRK',
  [TimerMode.LONG_BREAK]: 'LONG BRK',
};

// ASCII Art used in headers
export const ASCII_HEADER = `
  ____  _____ _____ ____   ___  _____ ___   ____ _   _ ____  
 |  _ \\| ____|_   _|  _ \\ / _ \\|  ___/ _ \\ / ___| | | / ___| 
 | |_) |  _|   | | | |_) | | | | |_ | | | | |   | | | \\___ \\ 
 |  _ <| |___  | | |  _ <| |_| |  _|| |_| | |___| |_| |___) |
 |_| \\_\\_____| |_| |_| \\_\\\\___/|_|   \\___/ \\____|\\___/|____/ 
`;