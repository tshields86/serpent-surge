import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface RunEvent {
  arenas_reached: number;
  score: number;
  food_eaten: number;
  power_ups_used: string[];
  is_daily: boolean;
  is_endless: boolean;
}

export class Analytics {
  async init(): Promise<void> {
    // No separate init needed — Firebase is initialized in firebase.ts
  }

  async logRun(event: RunEvent): Promise<void> {
    if (!db) return;
    try {
      await addDoc(collection(db, 'analytics_runs'), event);
    } catch {
      // Silent fail — analytics not critical
    }
  }

  async logDailyChallenge(seed: number, score: number): Promise<void> {
    if (!db) return;
    try {
      await addDoc(collection(db, 'analytics_daily'), { seed, score });
    } catch {
      // Silent fail
    }
  }
}
