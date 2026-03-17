import { ACHIEVEMENT_DEFS, AchievementDefinition } from '../data/achievements';

export interface AchievementState {
  unlockedIds: string[];
}

export class AchievementTracker {
  private unlocked = new Set<string>();
  private pendingToasts: AchievementDefinition[] = [];

  loadState(state: AchievementState): void {
    this.unlocked = new Set(state.unlockedIds);
  }

  getState(): AchievementState {
    return { unlockedIds: [...this.unlocked] };
  }

  /** Try to unlock an achievement. Returns true if newly unlocked. */
  tryUnlock(id: string): boolean {
    if (this.unlocked.has(id)) return false;
    const def = ACHIEVEMENT_DEFS.find(a => a.id === id);
    if (!def) return false;
    this.unlocked.add(id);
    this.pendingToasts.push(def);
    return true;
  }

  /** Get and clear the next toast to display */
  popToast(): AchievementDefinition | null {
    return this.pendingToasts.shift() ?? null;
  }

  /** Check if there are toasts waiting */
  hasToasts(): boolean {
    return this.pendingToasts.length > 0;
  }

  isUnlocked(id: string): boolean {
    return this.unlocked.has(id);
  }

  getUnlockedCount(): number {
    return this.unlocked.size;
  }

  getTotalCount(): number {
    return ACHIEVEMENT_DEFS.length;
  }

  getAllWithStatus(): (AchievementDefinition & { unlocked: boolean })[] {
    return ACHIEVEMENT_DEFS.map(def => ({
      ...def,
      unlocked: this.unlocked.has(def.id),
    }));
  }
}
