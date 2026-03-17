export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENT_DEFS: AchievementDefinition[] = [
  { id: 'FIRST_BITE', name: 'First Bite', description: 'Eat your first apple', icon: '🍎' },
  { id: 'GOLDEN_TONGUE', name: 'Golden Tongue', description: 'Eat a golden apple', icon: '🏆' },
  { id: 'ARENA_1', name: 'Arena Clearer', description: 'Clear your first arena', icon: '🏟️' },
  { id: 'ARENA_3', name: 'Triple Threat', description: 'Clear 3 arenas in one run', icon: '⚔️' },
  { id: 'ARENA_5', name: 'Unstoppable', description: 'Clear 5 arenas in one run', icon: '🔥' },
  { id: 'SCORE_500', name: 'Half Grand', description: 'Score 500 points in one run', icon: '💎' },
  { id: 'SCORE_1000', name: 'Grand Master', description: 'Score 1000 points in one run', icon: '👑' },
  { id: 'LENGTH_20', name: 'Long Boi', description: 'Reach length 20', icon: '📏' },
  { id: 'LENGTH_50', name: 'Mega Serpent', description: 'Reach length 50', icon: '🐉' },
  { id: 'REWIND_SAVE', name: 'Second Chance', description: 'Survive death with Rewind', icon: '⏪' },
  { id: 'OUROBOROS_HEAL', name: 'Self-Sustaining', description: 'Heal with Ouroboros', icon: '🐍' },
  { id: 'SYNERGY_FOUND', name: 'Alchemist', description: 'Discover a synergy', icon: '⚗️' },
  { id: 'ALL_SYNERGIES', name: 'Master Alchemist', description: 'Discover all 4 synergies', icon: '🧪' },
  { id: 'POWER_5', name: 'Collector', description: 'Hold 5 power-ups at once', icon: '🎒' },
  { id: 'BOMB_CLEAR', name: 'Demolition', description: 'Destroy 3+ hazards with one bomb fruit', icon: '💣' },
  { id: 'GHOST_ESCAPE', name: 'Phantom', description: 'Pass through your tail with Ghost Mode', icon: '👻' },
  { id: 'SPEED_RUN', name: 'Speed Demon', description: 'Clear a wave while speed boosted', icon: '⚡' },
];
