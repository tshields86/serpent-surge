export enum PowerUpRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  LEGENDARY = 'LEGENDARY',
}

export enum PowerUpId {
  GHOST_MODE = 'GHOST_MODE',
  WALL_WRAP = 'WALL_WRAP',
  VENOM_TRAIL = 'VENOM_TRAIL',
  HEAD_BASH = 'HEAD_BASH',
  IRON_GUT = 'IRON_GUT',
  SCAVENGER = 'SCAVENGER',
  DASH = 'DASH',
  TIME_DILATION = 'TIME_DILATION',
  REWIND = 'REWIND',
  SINGULARITY = 'SINGULARITY',
  SPLIT_STRIKE = 'SPLIT_STRIKE',
  OUROBOROS = 'OUROBOROS',
  LUCKY = 'LUCKY',
  AFTERIMAGE = 'AFTERIMAGE',
  SHOCKWAVE = 'SHOCKWAVE',
}

export interface PowerUpDefinition {
  id: PowerUpId;
  name: string;
  description: string;
  rarity: PowerUpRarity;
  icon: string;
  maxStack: number;
}

export const RARITY_COLORS: Record<PowerUpRarity, string> = {
  [PowerUpRarity.COMMON]: '#ffffff',
  [PowerUpRarity.UNCOMMON]: '#4da6ff',
  [PowerUpRarity.RARE]: '#b366ff',
  [PowerUpRarity.LEGENDARY]: '#ffd700',
};

export const RARITY_WEIGHTS: Record<PowerUpRarity, number> = {
  [PowerUpRarity.COMMON]: 50,
  [PowerUpRarity.UNCOMMON]: 30,
  [PowerUpRarity.RARE]: 15,
  [PowerUpRarity.LEGENDARY]: 5,
};

export const POWERUP_DEFS: PowerUpDefinition[] = [
  {
    id: PowerUpId.GHOST_MODE,
    name: 'Ghost Mode',
    description: 'Phase through your tail for 3s after eating',
    rarity: PowerUpRarity.COMMON,
    icon: '👻',
    maxStack: 3,
  },
  {
    id: PowerUpId.WALL_WRAP,
    name: 'Wall Wrap',
    description: 'Exit one side, enter the opposite',
    rarity: PowerUpRarity.COMMON,
    icon: '🔄',
    maxStack: 1,
  },
  {
    id: PowerUpId.VENOM_TRAIL,
    name: 'Venom Trail',
    description: 'Tail leaves poison for 3 ticks',
    rarity: PowerUpRarity.COMMON,
    icon: '☠️',
    maxStack: 3,
  },
  {
    id: PowerUpId.HEAD_BASH,
    name: 'Head Bash',
    description: 'Destroy 1 wall block on contact, 1x/wave',
    rarity: PowerUpRarity.COMMON,
    icon: '💥',
    maxStack: 3,
  },
  {
    id: PowerUpId.IRON_GUT,
    name: 'Iron Gut',
    description: '+2 length per food instead of +1',
    rarity: PowerUpRarity.COMMON,
    icon: '🛡️',
    maxStack: 2,
  },
  {
    id: PowerUpId.SCAVENGER,
    name: 'Scavenger',
    description: '2 food items on grid at once',
    rarity: PowerUpRarity.COMMON,
    icon: '🍎',
    maxStack: 2,
  },
  {
    id: PowerUpId.DASH,
    name: 'Dash',
    description: 'Double-tap direction to skip 3 cells',
    rarity: PowerUpRarity.UNCOMMON,
    icon: '⚡',
    maxStack: 2,
  },
  {
    id: PowerUpId.TIME_DILATION,
    name: 'Time Dilation',
    description: '30% slowdown for 2s on near-miss',
    rarity: PowerUpRarity.UNCOMMON,
    icon: '⏳',
    maxStack: 2,
  },
  {
    id: PowerUpId.REWIND,
    name: 'Rewind',
    description: 'Undo death, rewind 3s — 1x per arena',
    rarity: PowerUpRarity.RARE,
    icon: '⏪',
    maxStack: 1,
  },
  {
    id: PowerUpId.SINGULARITY,
    name: 'Singularity',
    description: 'Food within 3 cells drifts toward you',
    rarity: PowerUpRarity.RARE,
    icon: '🌀',
    maxStack: 2,
  },
  {
    id: PowerUpId.SPLIT_STRIKE,
    name: 'Split Strike',
    description: 'Split into 2 snakes for 5s on eat',
    rarity: PowerUpRarity.RARE,
    icon: '✂️',
    maxStack: 1,
  },
  {
    id: PowerUpId.OUROBOROS,
    name: 'Ouroboros',
    description: 'Eating own tail heals instead of kills, 1x/arena',
    rarity: PowerUpRarity.LEGENDARY,
    icon: '🐍',
    maxStack: 1,
  },
  {
    id: PowerUpId.LUCKY,
    name: 'Lucky',
    description: 'Power-up choices always include 1+ Uncommon',
    rarity: PowerUpRarity.UNCOMMON,
    icon: '🍀',
    maxStack: 1,
  },
  {
    id: PowerUpId.AFTERIMAGE,
    name: 'Afterimage',
    description: 'Leave a fading decoy trail behind you',
    rarity: PowerUpRarity.UNCOMMON,
    icon: '👤',
    maxStack: 2,
  },
  {
    id: PowerUpId.SHOCKWAVE,
    name: 'Shockwave',
    description: 'Eating food pushes hazards 2 cells away',
    rarity: PowerUpRarity.UNCOMMON,
    icon: '💫',
    maxStack: 2,
  },
];
