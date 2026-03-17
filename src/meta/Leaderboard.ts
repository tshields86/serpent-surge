import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configure these environment variables for your Supabase project
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

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
  private client: SupabaseClient | null = null;
  private offlineQueue: LeaderboardEntry[] = [];
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured — leaderboard disabled');
      return;
    }

    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Anonymous auth
    const { error } = await this.client.auth.signInAnonymously();
    if (error) {
      console.warn('Anonymous auth failed:', error.message);
      this.client = null;
      return;
    }

    this.initialized = true;

    // Flush offline queue
    await this.flushQueue();
  }

  /** Submit a score to the leaderboard */
  async submitScore(entry: Omit<LeaderboardEntry, 'id' | 'created_at'>): Promise<void> {
    if (!this.client) {
      this.offlineQueue.push(entry as LeaderboardEntry);
      return;
    }

    const { error } = await this.client
      .from('leaderboard')
      .insert(entry);

    if (error) {
      console.warn('Failed to submit score:', error.message);
      this.offlineQueue.push(entry as LeaderboardEntry);
    }
  }

  /** Fetch all-time top scores */
  async getTopScores(limit = 50): Promise<LeaderboardEntry[]> {
    if (!this.client) return [];

    const { data, error } = await this.client
      .from('leaderboard')
      .select('*')
      .eq('is_daily', false)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Failed to fetch leaderboard:', error.message);
      return [];
    }

    return data ?? [];
  }

  /** Fetch daily top scores for a given seed */
  async getDailyScores(seed: number, limit = 50): Promise<LeaderboardEntry[]> {
    if (!this.client) return [];

    const { data, error } = await this.client
      .from('leaderboard')
      .select('*')
      .eq('is_daily', true)
      .eq('daily_seed', seed)
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Failed to fetch daily leaderboard:', error.message);
      return [];
    }

    return data ?? [];
  }

  /** Flush offline queue */
  private async flushQueue(): Promise<void> {
    if (!this.client || this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const entry of queue) {
      const { error } = await this.client
        .from('leaderboard')
        .insert(entry);

      if (error) {
        console.warn('Failed to flush queued score:', error.message);
      }
    }
  }

  get isAvailable(): boolean {
    return this.initialized && this.client !== null;
  }
}
