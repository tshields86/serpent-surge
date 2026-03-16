import { describe, it, expect } from 'vitest';
import {
  PowerUpInstance,
  PowerUpId,
  acquirePowerUp,
  hasPowerUp,
  getStackCount,
  canAcquire,
  rollPowerUpOfferings,
} from '../PowerUp';

describe('PowerUp module', () => {
  it('acquirePowerUp adds new power-up', () => {
    const held: PowerUpInstance[] = [];
    acquirePowerUp(held, PowerUpId.GHOST_MODE);
    expect(held).toHaveLength(1);
    expect(held[0]!.id).toBe(PowerUpId.GHOST_MODE);
    expect(held[0]!.stackCount).toBe(1);
  });

  it('acquirePowerUp stacks existing power-up', () => {
    const held: PowerUpInstance[] = [];
    acquirePowerUp(held, PowerUpId.GHOST_MODE);
    acquirePowerUp(held, PowerUpId.GHOST_MODE);
    expect(held).toHaveLength(1);
    expect(held[0]!.stackCount).toBe(2);
  });

  it('hasPowerUp returns true when held', () => {
    const held: PowerUpInstance[] = [];
    acquirePowerUp(held, PowerUpId.WALL_WRAP);
    expect(hasPowerUp(held, PowerUpId.WALL_WRAP)).toBe(true);
    expect(hasPowerUp(held, PowerUpId.GHOST_MODE)).toBe(false);
  });

  it('getStackCount returns correct count', () => {
    const held: PowerUpInstance[] = [];
    acquirePowerUp(held, PowerUpId.IRON_GUT);
    acquirePowerUp(held, PowerUpId.IRON_GUT);
    expect(getStackCount(held, PowerUpId.IRON_GUT)).toBe(2);
    expect(getStackCount(held, PowerUpId.DASH)).toBe(0);
  });

  it('canAcquire respects maxStack', () => {
    const held: PowerUpInstance[] = [];
    // Wall Wrap has maxStack 1
    expect(canAcquire(held, PowerUpId.WALL_WRAP)).toBe(true);
    acquirePowerUp(held, PowerUpId.WALL_WRAP);
    expect(canAcquire(held, PowerUpId.WALL_WRAP)).toBe(false);
  });

  it('rollPowerUpOfferings returns up to 3 unique offerings', () => {
    const held: PowerUpInstance[] = [];
    const offerings = rollPowerUpOfferings(held);
    expect(offerings.length).toBeGreaterThan(0);
    expect(offerings.length).toBeLessThanOrEqual(3);

    // All unique
    const ids = offerings.map(o => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rollPowerUpOfferings excludes maxed power-ups', () => {
    const held: PowerUpInstance[] = [];
    // Max out Wall Wrap (maxStack 1)
    acquirePowerUp(held, PowerUpId.WALL_WRAP);

    const offerings = rollPowerUpOfferings(held);
    const ids = offerings.map(o => o.id);
    expect(ids).not.toContain(PowerUpId.WALL_WRAP);
  });
});
