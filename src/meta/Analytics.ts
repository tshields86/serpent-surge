import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export interface RunEvent {
  arenas_reached: number;
  score: number;
  food_eaten: number;
  power_ups_used: string[];
  is_daily: boolean;
  is_endless: boolean;
}

export class Analytics {
  private client: SupabaseClient | null = null;

  async init(): Promise<void> {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  /** Log a completed run */
  async logRun(event: RunEvent): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('analytics_runs').insert(event);
    } catch {
      // Silent fail — analytics not critical
    }
  }

  /** Log daily challenge participation */
  async logDailyChallenge(seed: number, score: number): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.from('analytics_daily').insert({ seed, score });
    } catch {
      // Silent fail
    }
  }
}
