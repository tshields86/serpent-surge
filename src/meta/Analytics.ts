import type { Firestore } from 'firebase/firestore';
import { firebaseConfigured, getFirebase } from './firebase';

export interface RunEvent {
  arenas_reached: number;
  score: number;
  food_eaten: number;
  power_ups_used: string[];
  is_daily: boolean;
  is_endless: boolean;
}

export class Analytics {
  private db: Firestore | null = null;

  async init(): Promise<void> {
    if (!firebaseConfigured) return;
    const firebase = await getFirebase();
    if (firebase) this.db = firebase.db;
  }

  async logRun(event: RunEvent): Promise<void> {
    if (!this.db) return;
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(this.db, 'analytics_runs'), event);
    } catch {
      // Silent fail — analytics not critical
    }
  }

  async logDailyChallenge(seed: number, score: number): Promise<void> {
    if (!this.db) return;
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(this.db, 'analytics_daily'), { seed, score });
    } catch {
      // Silent fail
    }
  }
}
