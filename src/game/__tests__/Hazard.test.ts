import { describe, it, expect } from 'vitest';
import { updateHazards, checkHazardCollision, HazardInstance, HazardType } from '../Hazard';

function makeHazard(
  type: HazardType,
  x: number,
  y: number,
  overrides: Partial<HazardInstance> = {},
): HazardInstance {
  return {
    position: { x, y },
    type,
    state: 'active',
    ticksRemaining: null,
    spawnTick: 0,
    ...overrides,
  };
}

describe('checkHazardCollision', () => {
  it('returns hazard when head is on active wall block', () => {
    const h = makeHazard(HazardType.WALL_BLOCK, 5, 5);
    expect(checkHazardCollision({ x: 5, y: 5 }, [h])).toBe(h);
  });

  it('returns null when head is not on any hazard', () => {
    const h = makeHazard(HazardType.WALL_BLOCK, 5, 5);
    expect(checkHazardCollision({ x: 6, y: 5 }, [h])).toBeNull();
  });

  it('returns hazard for active spike trap', () => {
    const h = makeHazard(HazardType.SPIKE_TRAP, 3, 3, { state: 'active' });
    expect(checkHazardCollision({ x: 3, y: 3 }, [h])).toBe(h);
  });

  it('returns null for inactive spike trap (safe to cross)', () => {
    const h = makeHazard(HazardType.SPIKE_TRAP, 3, 3, { state: 'inactive' });
    expect(checkHazardCollision({ x: 3, y: 3 }, [h])).toBeNull();
  });

  it('returns hazard for poison trail', () => {
    const h = makeHazard(HazardType.POISON_TRAIL, 7, 7, { ticksRemaining: 5 });
    expect(checkHazardCollision({ x: 7, y: 7 }, [h])).toBe(h);
  });
});

describe('updateHazards', () => {
  it('toggles spike trap state based on tick interval', () => {
    const h = makeHazard(HazardType.SPIKE_TRAP, 5, 5, { spawnTick: 0 });
    // At tick 0: elapsed=0, floor(0/4)=0 → even → active
    let result = updateHazards([h], 0);
    expect(result[0]!.state).toBe('active');

    // At tick 4: elapsed=4, floor(4/4)=1 → odd → inactive
    result = updateHazards([h], 4);
    expect(result[0]!.state).toBe('inactive');

    // At tick 8: elapsed=8, floor(8/4)=2 → even → active
    result = updateHazards([h], 8);
    expect(result[0]!.state).toBe('active');
  });

  it('decays poison trail and removes when expired', () => {
    const h = makeHazard(HazardType.POISON_TRAIL, 5, 5, { ticksRemaining: 2 });

    // Tick 1: remaining goes to 1
    let result = updateHazards([h], 10);
    expect(result).toHaveLength(1);
    expect(result[0]!.ticksRemaining).toBe(1);

    // Tick 2: remaining goes to 0, removed
    result = updateHazards(result, 11);
    expect(result).toHaveLength(0);
  });

  it('does not remove wall blocks', () => {
    const h = makeHazard(HazardType.WALL_BLOCK, 5, 5);
    const result = updateHazards([h], 100);
    expect(result).toHaveLength(1);
  });

  it('handles mixed hazard types', () => {
    const hazards = [
      makeHazard(HazardType.WALL_BLOCK, 1, 1),
      makeHazard(HazardType.SPIKE_TRAP, 2, 2, { spawnTick: 0 }),
      makeHazard(HazardType.POISON_TRAIL, 3, 3, { ticksRemaining: 1 }),
    ];

    // Poison has 1 tick left, so it will be removed
    const result = updateHazards(hazards, 5);
    expect(result).toHaveLength(2);
    expect(result[0]!.type).toBe(HazardType.WALL_BLOCK);
    expect(result[1]!.type).toBe(HazardType.SPIKE_TRAP);
  });
});
