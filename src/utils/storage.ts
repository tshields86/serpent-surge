import { get, set } from 'idb-keyval';

export interface PersistedData {
  highScore: number;
  totalScales: number;
  totalRuns: number;
  unlockedIds: string[];
  achievementIds: string[];
  selectedSkin: string;
  playerName: string;
  dailyBest: { seed: number; score: number } | null;
  settings: {
    muted: boolean;
    colorblindMode: boolean;
    reducedMotion: boolean;
    musicVolume: number;
    sfxVolume: number;
    crtEnabled: boolean;
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
  playerName: 'AAA',
  dailyBest: null,
  settings: {
    muted: false,
    colorblindMode: false,
    reducedMotion: false,
    musicVolume: 70,
    sfxVolume: 80,
    crtEnabled: true,
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
