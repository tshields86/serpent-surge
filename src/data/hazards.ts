export enum HazardType {
  WALL_BLOCK = 'WALL_BLOCK',
  SPIKE_TRAP = 'SPIKE_TRAP',
  POISON_TRAIL = 'POISON_TRAIL',
}

export interface HazardDef {
  type: HazardType;
  name: string;
  minWave: number;       // minimum wave within arena to appear
  permanent: boolean;    // false = decays (poison trail)
  toggleInterval: number | null; // ticks between state toggle (spike trap)
  decayTicks: number | null;     // ticks until removed (poison trail)
}

export const HAZARD_DEFS: Record<HazardType, HazardDef> = {
  [HazardType.WALL_BLOCK]: {
    type: HazardType.WALL_BLOCK,
    name: 'Wall Block',
    minWave: 2,
    permanent: true,
    toggleInterval: null,
    decayTicks: null,
  },
  [HazardType.SPIKE_TRAP]: {
    type: HazardType.SPIKE_TRAP,
    name: 'Spike Trap',
    minWave: 2,
    permanent: true,
    toggleInterval: 4,
    decayTicks: null,
  },
  [HazardType.POISON_TRAIL]: {
    type: HazardType.POISON_TRAIL,
    name: 'Poison Trail',
    minWave: 3,
    permanent: false,
    toggleInterval: null,
    decayTicks: 8,
  },
};
