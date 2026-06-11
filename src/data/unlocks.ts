export interface UnlockDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
}

// Costs per docs/DESIGN_SPEC.md §5 Collection (mock placeholders ratified).
export const UNLOCK_DEFS: UnlockDefinition[] = [
  {
    id: 'STARTING_LENGTH_4',
    name: 'Starting Length 4',
    description: 'Begin every run at length 4.',
    cost: 100,
  },
  {
    id: 'REROLL',
    name: 'Reroll',
    description: 'Reroll power-up offers once per arena.',
    cost: 200,
  },
  {
    id: 'ARENA_PREVIEW',
    name: 'Arena Preview',
    description: 'See the next arena before you enter.',
    cost: 300,
  },
  {
    id: 'EXTRA_LIFE',
    name: 'Extra Life',
    description: 'Survive one fatal hit per run.',
    cost: 500,
  },
  {
    id: 'ENDLESS_MODE',
    name: 'Endless Mode',
    description: 'Unlock the no-limit survival mode.',
    cost: 750,
  },
];
