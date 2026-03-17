import { PowerUpInstance, hasPowerUp } from './PowerUp';
import { SynergyDefinition, SYNERGY_DEFS } from '../data/synergies';

export interface ActiveSynergy {
  id: string;
  name: string;
  description: string;
}

/** Check which synergies are active based on held power-ups */
export function getActiveSynergies(held: readonly PowerUpInstance[]): ActiveSynergy[] {
  const active: ActiveSynergy[] = [];
  for (const syn of SYNERGY_DEFS) {
    if (hasPowerUp(held, syn.requires[0]) && hasPowerUp(held, syn.requires[1])) {
      active.push({ id: syn.id, name: syn.name, description: syn.description });
    }
  }
  return active;
}

/** Detect newly unlocked synergies by comparing before/after */
export function detectNewSynergies(
  before: readonly ActiveSynergy[],
  after: readonly ActiveSynergy[],
): ActiveSynergy[] {
  const beforeIds = new Set(before.map(s => s.id));
  return after.filter(s => !beforeIds.has(s.id));
}

/** Get synergy definition by ID */
export function getSynergyDef(id: string): SynergyDefinition | undefined {
  return SYNERGY_DEFS.find(s => s.id === id);
}
