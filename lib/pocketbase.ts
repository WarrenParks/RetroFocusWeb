import PocketBase from 'pocketbase';
import type { Database, DayData, Task, DailyStats } from '../types';

const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://192.168.1.121:8090';  //'http://127.0.0.1:8090';

export const pb = new PocketBase(POCKETBASE_URL);

// Disable auto-cancellation for better UX
pb.autoCancellation(false);

// Date conversion helpers
// PocketBase date format: "2025-12-03 12:00:00.000Z"
// App date format: "2025-12-03"

/** Convert app date string (YYYY-MM-DD) to PocketBase date format */
export function toPocketBaseDate(dateStr: string): string {
  // PocketBase expects ISO format, we'll use noon UTC to avoid timezone issues
  return `${dateStr} 12:00:00.000Z`;
}

/** Convert PocketBase date to app date string (YYYY-MM-DD) */
export function fromPocketBaseDate(pbDate: string): string {
  // PocketBase returns ISO format, extract just the date part
  if (!pbDate) return '';
  // Handle both "2025-12-03 12:00:00.000Z" and "2025-12-03T12:00:00.000Z" formats
  return pbDate.split(/[T ]/)[0];
}

// In-flight day creation promises to prevent race conditions
const pendingDayCreations = new Map<string, Promise<string | null>>();

// Types for PocketBase records
export interface PBDay {
  id: string;
  date: string; // PocketBase date format
  user: string;
  pomodorosCompleted: number;
  totalTimeMinutes: number;
}

export interface PBTask {
  id: string;
  text: string;
  completed: boolean;
  pomodoros: number;
  day: string;
  user: string;
}

// Auth helpers
export const isLoggedIn = () => pb.authStore.isValid;
export const currentUser = () => pb.authStore.model;

export async function login(email: string, password: string) {
  return await pb.collection('users').authWithPassword(email, password);
}

export async function register(email: string, password: string) {
  await pb.collection('users').create({
    email,
    password,
    passwordConfirm: password,
  });
  return await login(email, password);
}

export function logout() {
  pb.authStore.clear();
}

// Data sync helpers
export async function fetchAllData(): Promise<Database> {
  if (!isLoggedIn()) return {};

  const userId = currentUser()?.id;
  if (!userId) return {};

  try {
    // Fetch all days for this user
    const days = await pb.collection('days').getFullList<PBDay>({
      filter: `user = "${userId}"`,
      sort: '-date',
    });

    // Fetch all tasks for this user
    const tasks = await pb.collection('tasks').getFullList<PBTask>({
      filter: `user = "${userId}"`,
    });

    // Build the database structure
    const db: Database = {};

    for (const day of days) {
      const appDate = fromPocketBaseDate(day.date);
      const dayTasks = tasks
        .filter(t => t.day === day.id)
        .map(t => ({
          id: t.id,
          text: t.text,
          completed: t.completed,
          pomodoros: t.pomodoros,
        }));

      db[appDate] = {
        date: appDate,
        tasks: dayTasks,
        stats: {
          date: appDate,
          pomodorosCompleted: day.pomodorosCompleted,
          totalTimeMinutes: day.totalTimeMinutes,
        },
        _pbDayId: day.id, // Store PB ID for updates
      };
    }

    return db;
  } catch (error) {
    console.error('Failed to fetch data from PocketBase:', error);
    return {};
  }
}

export async function ensureDayExists(date: string): Promise<string | null> {
  if (!isLoggedIn()) return null;

  const userId = currentUser()?.id;
  if (!userId) return null;

  // Create a unique key for this user+date combination
  const cacheKey = `${userId}:${date}`;

  // If there's already a pending creation for this day, wait for it
  const pending = pendingDayCreations.get(cacheKey);
  if (pending) {
    return pending;
  }

  const pbDate = toPocketBaseDate(date);

  // Create the promise for this day creation
  const creationPromise = (async (): Promise<string | null> => {
    try {
      // Check if day exists - use date range filter for date type
      // PocketBase date queries need proper date comparison
      const existing = await pb.collection('days').getList<PBDay>(1, 1, {
        filter: `user = "${userId}" && date >= "${date} 00:00:00.000Z" && date <= "${date} 23:59:59.999Z"`,
      });

      if (existing.items.length > 0) {
        return existing.items[0].id;
      }

      // Create new day
      const newDay = await pb.collection('days').create<PBDay>({
        date: pbDate,
        user: userId,
        pomodorosCompleted: 0,
        totalTimeMinutes: 0,
      });

      return newDay.id;
    } catch (error) {
      console.error('Failed to ensure day exists:', error);
      return null;
    } finally {
      // Clean up the pending promise after completion
      pendingDayCreations.delete(cacheKey);
    }
  })();

  // Store the promise so concurrent calls can wait for it
  pendingDayCreations.set(cacheKey, creationPromise);

  return creationPromise;
}

export async function syncDay(dayData: DayData & { _pbDayId?: string }): Promise<void> {
  if (!isLoggedIn()) return;

  const userId = currentUser()?.id;
  if (!userId) return;

  try {
    let dayId = dayData._pbDayId;

    if (!dayId) {
      dayId = await ensureDayExists(dayData.date) || undefined;
    }

    if (!dayId) return;

    // Update day stats
    await pb.collection('days').update(dayId, {
      pomodorosCompleted: dayData.stats.pomodorosCompleted,
      totalTimeMinutes: dayData.stats.totalTimeMinutes,
    });
  } catch (error) {
    console.error('Failed to sync day:', error);
  }
}

export async function createTask(dayId: string, text: string): Promise<PBTask | null> {
  if (!isLoggedIn()) return null;

  const userId = currentUser()?.id;
  if (!userId) return null;

  try {
    return await pb.collection('tasks').create<PBTask>({
      text,
      completed: false,
      pomodoros: 0,
      day: dayId,
      user: userId,
    });
  } catch (error) {
    console.error('Failed to create task:', error);
    return null;
  }
}

export async function updateTask(taskId: string, updates: Partial<PBTask>): Promise<void> {
  if (!isLoggedIn()) return;

  try {
    await pb.collection('tasks').update(taskId, updates);
  } catch (error) {
    console.error('Failed to update task:', error);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  if (!isLoggedIn()) return;

  try {
    await pb.collection('tasks').delete(taskId);
  } catch (error) {
    console.error('Failed to delete task:', error);
  }
}

export async function migrateTask(taskId: string, newDayId: string): Promise<PBTask | null> {
  if (!isLoggedIn()) return null;

  try {
    // Get original task
    const original = await pb.collection('tasks').getOne<PBTask>(taskId);
    
    // Create new task in new day
    const newTask = await pb.collection('tasks').create<PBTask>({
      text: original.text,
      completed: original.completed,
      pomodoros: 0, // Reset pomodoros for migrated task
      day: newDayId,
      user: original.user,
    });

    // Delete original task
    await pb.collection('tasks').delete(taskId);

    return newTask;
  } catch (error) {
    console.error('Failed to migrate task:', error);
    return null;
  }
}