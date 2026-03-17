import { createSeededRng, todaySeed } from '../utils/math';

export interface DailyChallengeState {
  seed: number;
  rng: () => number;
  personalBest: number;
}

/** Create a daily challenge state for today */
export function createDailyChallenge(): DailyChallengeState {
  const seed = todaySeed();
  return {
    seed,
    rng: createSeededRng(seed),
    personalBest: 0,
  };
}

/** Create a challenge for a specific seed (for testing) */
export function createChallengeFromSeed(seed: number): DailyChallengeState {
  return {
    seed,
    rng: createSeededRng(seed),
    personalBest: 0,
  };
}
