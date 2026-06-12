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

/** The player's personal best plus their rank — works no matter how far down they are. */
export interface PlayerStanding {
  entry: LeaderboardEntry;
  rank: number;
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
      // Overfetch so dedupe still produces `limit` distinct players when
      // the top of the board is dominated by one user's streak.
      const q = query(
        collection(this.db, 'leaderboard'),
        where('is_daily', '==', false),
        orderBy('score', 'desc'),
        firestoreLimit(limit * 2),
      );
      const snapshot = await getDocs(q);
      const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as LeaderboardEntry);
      return dedupeByPlayer(raw).slice(0, limit);
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
        firestoreLimit(limit * 2),
      );
      const snapshot = await getDocs(q);
      const raw = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as LeaderboardEntry);
      return dedupeByPlayer(raw).slice(0, limit);
    } catch (e) {
      console.warn('Failed to fetch daily leaderboard:', e);
      return [];
    }
  }

  /**
   * Look up the player's personal best plus their rank — used to pin a "YOU"
   * row when the player isn't in the top 10. Two Firestore reads (one for the
   * best score, one count-aggregation for entries scoring higher).
   *
   * Rank is approximate: the count includes duplicate entries from other
   * players (someone with 3 scores above the player counts as 3, not 1). For
   * the current player base this is fine; a future server-side dedupe pass
   * would tighten it.
   */
  async getPlayerStanding(
    playerName: string,
    opts: { isDaily?: boolean; seed?: number } = {},
  ): Promise<PlayerStanding | null> {
    if (!this.db) return null;
    if (!playerName) return null;

    const { collection, query, where, orderBy, limit, getDocs, getCountFromServer } =
      await import('firebase/firestore');

    const isDaily = opts.isDaily ?? false;
    const constraints = isDaily
      ? [where('is_daily', '==', true), where('daily_seed', '==', opts.seed ?? 0)]
      : [where('is_daily', '==', false)];

    try {
      // 1. Player's personal best in this category.
      const bestQ = query(
        collection(this.db, 'leaderboard'),
        ...constraints,
        where('player_name', '==', playerName),
        orderBy('score', 'desc'),
        limit(1),
      );
      const bestSnap = await getDocs(bestQ);
      if (bestSnap.empty) return null;
      const bestDoc = bestSnap.docs[0]!;
      const entry = { id: bestDoc.id, ...bestDoc.data() } as LeaderboardEntry;

      // 2. Count entries strictly above their score.
      const aboveQ = query(
        collection(this.db, 'leaderboard'),
        ...constraints,
        where('score', '>', entry.score),
      );
      const aboveSnap = await getCountFromServer(aboveQ);
      const rank = aboveSnap.data().count + 1;

      return { entry, rank };
    } catch (e) {
      console.warn('Failed to fetch player standing:', e);
      return null;
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

// Keep one row per player (best score). Input must already be sorted score desc.
function dedupeByPlayer(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const seen = new Set<string>();
  const out: LeaderboardEntry[] = [];
  for (const e of entries) {
    const key = e.player_name.toUpperCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(e);
  }
  return out;
}
