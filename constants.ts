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
 ____     ___  ______  ____   ___   ____   ___     __  __ 
|    \\   /  _]|      ||    \\ /   \\ |    | /   \\   |  |/  |
|  D  ) /  [_ |      ||  D  )     ||  __|/     \\  |  '  / 
|    / |    _]|_|  |_||    /|  O  ||  | |  O  |  |    \\ 
|    \\ |   [_   |  |  |    \\|     ||  |_|     |  |     \\
|  .  \\|     |  |  |  |  .  \\     ||     |     |  |  .  |
|__|\\_||_____|  |__|  |__|\\_|\\___/ |___| \\___/   |__|\\_|
`;
