import { BASE_TICK_RATE } from '../utils/constants';

export interface WaveConfig {
  foodQuota: number;
  hazardCount: number;
  tickRate: number;
}

export class Arena {
  currentArena = 1;
  currentWave = 1;
  waveFoodEaten = 0;
  waveFoodQuota = 5;

  private static readonly WAVES_PER_ARENA = 3;

  /** Reset for a new run */
  reset(): void {
    this.currentArena = 1;
    this.currentWave = 1;
    this.waveFoodEaten = 0;
    this.applyWaveConfig();
  }

  /** Get config for current wave */
  getWaveConfig(): WaveConfig {
    const arena = this.currentArena;
    const wave = this.currentWave;

    const baseQuota = 3 + wave * 2;           // W1=5, W2=7, W3=9
    const arenaBonus = (arena - 1) * 2;        // +2 per arena
    const foodQuota = baseQuota + arenaBonus;

    const hazardCount = Math.max(0, (wave - 1) + (arena - 1) * 2);
    const tickRate = BASE_TICK_RATE + (arena - 1) * 0.5;

    return { foodQuota, hazardCount, tickRate };
  }

  /** Apply current wave config (call on wave/arena start) */
  applyWaveConfig(): void {
    const config = this.getWaveConfig();
    this.waveFoodQuota = config.foodQuota;
    this.waveFoodEaten = 0;
  }

  /** Record food eaten. Returns true if wave is now cleared. */
  eatFood(): boolean {
    this.waveFoodEaten++;
    return this.waveFoodEaten >= this.waveFoodQuota;
  }

  /** Advance to next wave. Returns true if arena is cleared (was last wave). */
  advanceWave(): boolean {
    if (this.currentWave >= Arena.WAVES_PER_ARENA) {
      return true; // arena cleared
    }
    this.currentWave++;
    this.applyWaveConfig();
    return false;
  }

  /** Advance to next arena, reset wave to 1. */
  advanceArena(): void {
    this.currentArena++;
    this.currentWave = 1;
    this.applyWaveConfig();
  }

  get wavesPerArena(): number {
    return Arena.WAVES_PER_ARENA;
  }

  get waveProgress(): string {
    return `WAVE ${this.currentWave}/${Arena.WAVES_PER_ARENA} — ${this.waveFoodEaten}/${this.waveFoodQuota}`;
  }
}
