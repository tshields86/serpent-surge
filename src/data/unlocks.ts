export interface UnlockDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export const UNLOCK_DEFS: UnlockDefinition[] = [
  {
    id: 'STARTING_LENGTH_4',
    name: 'Starting Length 4',
    description: 'Start each run with length 4 instead of 3',
    cost: 100,
  },
  {
    id: 'REROLL',
    name: 'Reroll',
    description: 'Reroll power-up offerings once per arena',
    cost: 200,
  },
];
