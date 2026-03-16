import { Vec2 } from './Grid';
import { Snake } from './Snake';
import { GRID_SIZE } from '../utils/constants';

export enum FoodType {
  APPLE = 'APPLE',
  GOLDEN_APPLE = 'GOLDEN_APPLE',
  SHRINK_PELLET = 'SHRINK_PELLET',
}

export interface FoodItem {
  position: Vec2;
  type: FoodType;
  spawnTick: number;
}

export interface OccupiedCell {
  position: Vec2;
}

/** Score values per food type */
export const FOOD_SCORES: Record<FoodType, number> = {
  [FoodType.APPLE]: 10,
  [FoodType.GOLDEN_APPLE]: 50,
  [FoodType.SHRINK_PELLET]: 25,
};

export function spawnFood(
  snake: Snake,
  existingFoods: readonly FoodItem[],
  currentTick: number,
  hazards: readonly OccupiedCell[] = [],
  wave = 1,
): FoodItem {
  const occupied = new Set<string>();
  for (const seg of snake.segments) occupied.add(`${seg.x},${seg.y}`);
  for (const f of existingFoods) occupied.add(`${f.position.x},${f.position.y}`);
  for (const h of hazards) occupied.add(`${h.position.x},${h.position.y}`);

  const emptyCells: Vec2[] = [];
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      if (!occupied.has(`${x},${y}`)) emptyCells.push({ x, y });
    }
  }

  const pos = emptyCells[Math.floor(Math.random() * emptyCells.length)];

  // Determine food type
  const roll = Math.random();
  let type = FoodType.APPLE;
  if (roll < 0.10 && wave >= 3) {
    type = FoodType.SHRINK_PELLET;
  } else if (roll < 0.25) {
    // 15% chance for golden apple (25% - 10% shrink range)
    type = FoodType.GOLDEN_APPLE;
  }

  return {
    position: pos ?? { x: 0, y: 0 },
    type,
    spawnTick: currentTick,
  };
}

export function checkFoodCollision(head: Vec2, foods: readonly FoodItem[]): FoodItem | null {
  for (const food of foods) {
    if (food.position.x === head.x && food.position.y === head.y) {
      return food;
    }
  }
  return null;
}
