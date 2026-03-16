import { Vec2 } from './Grid';
import { Snake } from './Snake';
import { GRID_SIZE } from '../utils/constants';

export enum FoodType {
  APPLE = 'APPLE',
}

export interface FoodItem {
  position: Vec2;
  type: FoodType;
  spawnTick: number;
}

export interface OccupiedCell {
  position: Vec2;
}

export function spawnFood(
  snake: Snake,
  existingFoods: readonly FoodItem[],
  currentTick: number,
  hazards: readonly OccupiedCell[] = [],
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
  return {
    position: pos ?? { x: 0, y: 0 },
    type: FoodType.APPLE,
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
