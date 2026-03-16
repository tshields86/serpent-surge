import { Vec2 } from './Grid';
import { Snake } from './Snake';
import { FoodItem } from './Food';
import { HazardType, HAZARD_DEFS } from '../data/hazards';
import { GRID_SIZE } from '../utils/constants';

export { HazardType } from '../data/hazards';

export interface HazardInstance {
  position: Vec2;
  type: HazardType;
  state: 'active' | 'inactive';
  ticksRemaining: number | null;
  spawnTick: number;
}

/** Update hazards each game tick: toggle spikes, decay poison */
export function updateHazards(hazards: HazardInstance[], currentTick: number): HazardInstance[] {
  const result: HazardInstance[] = [];

  for (const h of hazards) {
    const def = HAZARD_DEFS[h.type];

    // Toggle spike traps
    if (def.toggleInterval !== null) {
      const elapsed = currentTick - h.spawnTick;
      h.state = Math.floor(elapsed / def.toggleInterval) % 2 === 0 ? 'active' : 'inactive';
    }

    // Decay poison trails
    if (h.ticksRemaining !== null) {
      h.ticksRemaining--;
      if (h.ticksRemaining <= 0) continue; // remove
    }

    result.push(h);
  }

  return result;
}

/** Check if head collides with any active hazard */
export function checkHazardCollision(head: Vec2, hazards: readonly HazardInstance[]): HazardInstance | null {
  for (const hazard of hazards) {
    if (hazard.position.x === head.x && hazard.position.y === head.y) {
      if (hazard.type === HazardType.SPIKE_TRAP && hazard.state === 'inactive') {
        continue; // spike is off, safe
      }
      return hazard;
    }
  }
  return null;
}

/** Spawn hazards for wave start based on hazard count from wave config */
export function spawnHazards(
  count: number,
  wave: number,
  snake: Snake,
  foods: readonly FoodItem[],
  existingHazards: readonly HazardInstance[],
  currentTick: number,
): HazardInstance[] {
  if (count <= 0) return [];

  // Determine available hazard types for this wave
  const available: HazardType[] = [];
  for (const def of Object.values(HAZARD_DEFS)) {
    if (wave >= def.minWave) {
      available.push(def.type);
    }
  }

  if (available.length === 0) return [];

  // Build occupied set
  const occupied = new Set<string>();
  for (const seg of snake.segments) occupied.add(`${seg.x},${seg.y}`);
  for (const f of foods) occupied.add(`${f.position.x},${f.position.y}`);
  for (const h of existingHazards) occupied.add(`${h.position.x},${h.position.y}`);

  // Keep a 2-cell buffer around snake head
  const head = snake.head;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      occupied.add(`${head.x + dx},${head.y + dy}`);
    }
  }

  const emptyCells: Vec2[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) emptyCells.push({ x, y });
    }
  }

  const spawned: HazardInstance[] = [];
  for (let i = 0; i < count && emptyCells.length > 0; i++) {
    const idx = Math.floor(Math.random() * emptyCells.length);
    const pos = emptyCells.splice(idx, 1)[0]!;
    const type = available[Math.floor(Math.random() * available.length)]!;
    const def = HAZARD_DEFS[type];

    spawned.push({
      position: pos,
      type,
      state: 'active',
      ticksRemaining: def.decayTicks,
      spawnTick: currentTick,
    });
  }

  return spawned;
}
