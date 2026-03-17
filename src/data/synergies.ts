import { PowerUpId } from './powerups';

export interface SynergyDefinition {
  id: string;
  name: string;
  description: string;
  requires: [PowerUpId, PowerUpId];
}

export const SYNERGY_DEFS: SynergyDefinition[] = [
  {
    id: 'GLUTTONY',
    name: 'Gluttony',
    description: 'Always phase through tail when length > 15',
    requires: [PowerUpId.GHOST_MODE, PowerUpId.IRON_GUT],
  },
  {
    id: 'WARP_SPEED',
    name: 'Warp Speed',
    description: 'Dash through walls with 1s invincibility',
    requires: [PowerUpId.WALL_WRAP, PowerUpId.DASH],
  },
  {
    id: 'TOXIC_BLAST',
    name: 'Toxic Blast',
    description: 'Shockwave leaves venom in its path',
    requires: [PowerUpId.VENOM_TRAIL, PowerUpId.SHOCKWAVE],
  },
  {
    id: 'BLACK_HOLE',
    name: 'Black Hole',
    description: 'All food on grid drifts toward you',
    requires: [PowerUpId.SCAVENGER, PowerUpId.SINGULARITY],
  },
];
