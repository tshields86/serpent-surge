import type { Firestore } from 'firebase/firestore';
import { firebaseConfigured, getFirebase } from './firebase';

export interface LeaderboardEntry {
  id?: string;
  player_name: string;
  score: number;
  arenas_cleared: number;
  food_eaten: number;
  is_daily: boolean;
  daily_seed: number | null;
  created_at?: string;
}

export class Leaderboard {
  private db: Firestore | null = null;
  private offlineQueue: LeaderboardEntry[] = [];
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    if (!firebaseConfigured) {
      console.warn('Firebase not configured — leaderboard disabled');
      return;
    }

    const firebase = await getFirebase();
    if (!firebase) return;

    const { signInAnonymously } = await import('firebase/auth');
    try {
      await signInAnonymously(firebase.auth);
    } catch (e) {
      console.warn('Anonymous auth failed:', e);
      return;
    }

    this.db = firebase.db;
    this.initialized = true;
    await this.flushQueue();
  }

  async submitScore(entry: Omit<LeaderboardEntry, 'id' | 'created_at'>): Promise<void> {
    if (!this.db) {
      this.offlineQueue.push(entry as LeaderboardEntry);
      return;
    }

    const { collection, addDoc } = await import('firebase/firestore');
    try {
      await addDoc(collection(this.db, 'leaderboard'), {
        ...entry,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to submit score:', e);
      this.offlineQueue.push(entry as LeaderboardEntry);
    }
  }

  async getTopScores(limit = 50): Promise<LeaderboardEntry[]> {
    if (!this.db) return [];

    const { collection, query, where, orderBy, limit: firestoreLimit, getDocs } = await import('firebase/firestore');
    try {
      const q = query(
        collection(this.db, 'leaderboard'),
        where('is_daily', '==', false),
        orderBy('score', 'desc'),
        firestoreLimit(limit),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as LeaderboardEntry);
    } catch (e) {
      console.warn('Failed to fetch leaderboard:', e);
      return [];
    }
  }

  async getDailyScores(seed: number, limit = 50): Promise<LeaderboardEntry[]> {
    if (!this.db) return [];

    const { collection, query, where, orderBy, limit: firestoreLimit, getDocs } = await import('firebase/firestore');
    try {
      const q = query(
        collection(this.db, 'leaderboard'),
        where('is_daily', '==', true),
        where('daily_seed', '==', seed),
        orderBy('score', 'desc'),
        firestoreLimit(limit),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as LeaderboardEntry);
    } catch (e) {
      console.warn('Failed to fetch daily leaderboard:', e);
      return [];
    }
  }

  private async flushQueue(): Promise<void> {
    if (!this.db || this.offlineQueue.length === 0) return;

    const { collection, addDoc } = await import('firebase/firestore');
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const entry of queue) {
      try {
        await addDoc(collection(this.db, 'leaderboard'), {
          ...entry,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Failed to flush queued score:', e);
      }
    }
  }

  get isAvailable(): boolean {
    return this.initialized && this.db !== null;
  }
}
