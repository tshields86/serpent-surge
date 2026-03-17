import { PowerUpId, PowerUpRarity, PowerUpDefinition, POWERUP_DEFS, RARITY_WEIGHTS } from '../data/powerups';

export { PowerUpId, PowerUpRarity } from '../data/powerups';

export interface PowerUpInstance {
  id: PowerUpId;
  stackCount: number;
  usesRemaining: number | null;
}

/** Get a PowerUpDefinition by id */
export function getPowerUpDef(id: PowerUpId): PowerUpDefinition {
  return POWERUP_DEFS.find(d => d.id === id)!;
}

/** Check if player already has max stacks of a power-up */
export function canAcquire(held: readonly PowerUpInstance[], id: PowerUpId): boolean {
  const def = getPowerUpDef(id);
  const existing = held.find(p => p.id === id);
  return !existing || existing.stackCount < def.maxStack;
}

/** Add or stack a power-up */
export function acquirePowerUp(held: PowerUpInstance[], id: PowerUpId): void {
  const existing = held.find(p => p.id === id);
  if (existing) {
    existing.stackCount++;
  } else {
    held.push({
      id,
      stackCount: 1,
      usesRemaining: null,
    });
  }
}

/** Check if player has a specific power-up */
export function hasPowerUp(held: readonly PowerUpInstance[], id: PowerUpId): boolean {
  return held.some(p => p.id === id && p.stackCount > 0);
}

/** Get stack count of a power-up */
export function getStackCount(held: readonly PowerUpInstance[], id: PowerUpId): number {
  const p = held.find(pu => pu.id === id);
  return p ? p.stackCount : 0;
}

/** Roll 3 unique power-up offerings, weighted by rarity, filtering out maxed ones.
 *  If the player has Lucky, guarantee at least 1 Uncommon+ offering. */
export function rollPowerUpOfferings(held: readonly PowerUpInstance[]): PowerUpDefinition[] {
  const available = POWERUP_DEFS.filter(def => canAcquire(held, def.id));
  if (available.length === 0) return [];

  const hasLucky = hasPowerUp(held, PowerUpId.LUCKY);
  const offerings: PowerUpDefinition[] = [];
  const used = new Set<PowerUpId>();

  // If Lucky is held, first slot is guaranteed Uncommon+
  if (hasLucky) {
    const uncommonPlus = available.filter(
      d => !used.has(d.id) && d.rarity !== PowerUpRarity.COMMON,
    );
    if (uncommonPlus.length > 0) {
      const picked = weightedPick(uncommonPlus);
      offerings.push(picked);
      used.add(picked.id);
    }
  }

  const count = Math.min(3, available.length);
  while (offerings.length < count) {
    const candidates = available.filter(d => !used.has(d.id));
    if (candidates.length === 0) break;

    const picked = weightedPick(candidates);
    offerings.push(picked);
    used.add(picked.id);
  }

  return offerings;
}

function weightedPick(candidates: PowerUpDefinition[]): PowerUpDefinition {
  let totalWeight = 0;
  for (const c of candidates) {
    totalWeight += RARITY_WEIGHTS[c.rarity];
  }

  let roll = Math.random() * totalWeight;
  for (const c of candidates) {
    roll -= RARITY_WEIGHTS[c.rarity];
    if (roll <= 0) return c;
  }
  return candidates[candidates.length - 1]!;
}
