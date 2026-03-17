import { BASE_TICK_RATE } from '../utils/constants';
import { WaveConfig } from './Arena';

/**
 * Endless mode arena — no arenas or waves, just continuous escalating difficulty.
 * Power-up offered every 15 food eaten.
 */
export class EndlessArena {
  totalFoodEaten = 0;
  private foodSinceLastPowerUp = 0;
  private difficultyLevel = 1;

  /** Reset for a new run */
  reset(): void {
    this.totalFoodEaten = 0;
    this.foodSinceLastPowerUp = 0;
    this.difficultyLevel = 1;
  }

  /** Get config that scales with total food eaten */
  getConfig(): WaveConfig {
    const tickRate = BASE_TICK_RATE + this.difficultyLevel * 0.3;
    const hazardCount = Math.floor(this.difficultyLevel * 1.5);
    const foodQuota = Infinity; // never clears a "wave"

    return { foodQuota, hazardCount, tickRate };
  }

  /** Record food eaten. Returns true if a power-up should be offered. */
  eatFood(): boolean {
    this.totalFoodEaten++;
    this.foodSinceLastPowerUp++;

    // Increase difficulty every 10 food
    if (this.totalFoodEaten % 10 === 0) {
      this.difficultyLevel++;
    }

    // Offer power-up every 15 food
    if (this.foodSinceLastPowerUp >= 15) {
      this.foodSinceLastPowerUp = 0;
      return true;
    }

    return false;
  }

  get currentArena(): number {
    return this.difficultyLevel;
  }

  get currentWave(): number {
    return 1; // Endless has no waves
  }

  get waveProgress(): string {
    return `ENDLESS — ${this.totalFoodEaten} EATEN`;
  }

  /** Spawn new hazards periodically */
  shouldSpawnHazards(): boolean {
    return this.totalFoodEaten % 5 === 0 && this.totalFoodEaten > 0;
  }
}
