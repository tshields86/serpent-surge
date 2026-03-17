import { get, set } from 'idb-keyval';

export interface PersistedData {
  highScore: number;
  totalScales: number;
  totalRuns: number;
  unlockedIds: string[];
  achievementIds: string[];
  selectedSkin: string;
  dailyBest: { seed: number; score: number } | null;
  settings: {
    muted: boolean;
  };
}

const STORAGE_KEY = 'serpent-surge-data';

const DEFAULT_DATA: PersistedData = {
  highScore: 0,
  totalScales: 0,
  totalRuns: 0,
  unlockedIds: [],
  achievementIds: [],
  selectedSkin: 'default',
  dailyBest: null,
  settings: {
    muted: false,
  },
};

export async function loadData(): Promise<PersistedData> {
  try {
    const data = await get<PersistedData>(STORAGE_KEY);
    return data ? { ...DEFAULT_DATA, ...data } : { ...DEFAULT_DATA };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export async function saveData(data: PersistedData): Promise<void> {
  try {
    await set(STORAGE_KEY, data);
  } catch {
    // Silently fail — storage not critical
  }
}
