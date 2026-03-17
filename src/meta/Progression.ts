import { UNLOCK_DEFS, UnlockDefinition } from '../data/unlocks';

export interface ProgressionData {
  totalScales: number;
  unlockedIds: string[];
}

/** Calculate scales earned from a run */
export function calculateScales(score: number, arenasCleared: number, foodEaten: number): number {
  return Math.floor(score / 10) + arenasCleared * 50 + foodEaten * 2;
}

/** Check if an unlock can be purchased */
export function canPurchase(data: ProgressionData, unlockId: string): boolean {
  const def = UNLOCK_DEFS.find(u => u.id === unlockId);
  if (!def) return false;
  if (data.unlockedIds.includes(unlockId)) return false;
  return data.totalScales >= def.cost;
}

/** Purchase an unlock, returns updated data or null if can't afford */
export function purchaseUnlock(data: ProgressionData, unlockId: string): ProgressionData | null {
  const def = UNLOCK_DEFS.find(u => u.id === unlockId);
  if (!def || !canPurchase(data, unlockId)) return null;
  return {
    totalScales: data.totalScales - def.cost,
    unlockedIds: [...data.unlockedIds, unlockId],
  };
}

/** Check if a specific unlock is owned */
export function hasUnlock(data: ProgressionData, unlockId: string): boolean {
  return data.unlockedIds.includes(unlockId);
}

/** Get all unlock definitions with their purchase status */
export function getUnlockStatus(data: ProgressionData): (UnlockDefinition & { owned: boolean; affordable: boolean })[] {
  return UNLOCK_DEFS.map(def => ({
    ...def,
    owned: data.unlockedIds.includes(def.id),
    affordable: data.totalScales >= def.cost,
  }));
}
