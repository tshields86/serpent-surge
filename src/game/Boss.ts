import { Vec2 } from './Grid';
import { HazardType, HazardInstance } from './Hazard';
import { GRID_SIZE } from '../utils/constants';

export interface BossSnake {
  segments: Vec2[];
  direction: Vec2;
  tickCounter: number;
  moveInterval: number; // ticks between moves
  defeated: boolean;
  health: number;
  maxHealth: number;
  poisonTrailInterval: number; // leave poison every N moves
  movesSincePoison: number;
}

/** Create a boss snake for the given arena number */
export function createBoss(arenaNumber: number): BossSnake {
  const length = 8 + arenaNumber;
  const health = 3 + Math.floor(arenaNumber / 5);
  const startX = Math.floor(GRID_SIZE / 4);
  const startY = Math.floor(GRID_SIZE / 4);

  const segments: Vec2[] = [];
  for (let i = 0; i < length; i++) {
    segments.push({ x: startX - i, y: startY });
  }

  return {
    segments,
    direction: { x: 1, y: 0 },
    tickCounter: 0,
    moveInterval: Math.max(2, 5 - Math.floor(arenaNumber / 10)),
    defeated: false,
    health,
    maxHealth: health,
    poisonTrailInterval: 3,
    movesSincePoison: 0,
  };
}

/** Update boss movement — follows a pattern, speeds up over time */
export function updateBoss(boss: BossSnake, playerHead: Vec2, currentTick: number): HazardInstance | null {
  boss.tickCounter++;
  if (boss.tickCounter < boss.moveInterval) return null;
  boss.tickCounter = 0;

  // Simple AI: move toward player with some randomness
  const head = boss.segments[0];
  if (!head) return null;

  const dx = playerHead.x - head.x;
  const dy = playerHead.y - head.y;

  // Every 4th move, change direction toward player; otherwise continue
  if (currentTick % 4 === 0) {
    if (Math.abs(dx) > Math.abs(dy)) {
      boss.direction = { x: Math.sign(dx), y: 0 };
    } else {
      boss.direction = { x: 0, y: Math.sign(dy) || 1 };
    }
  }

  // Occasionally add randomness
  if (Math.random() < 0.15) {
    const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
    boss.direction = dirs[Math.floor(Math.random() * dirs.length)]!;
  }

  const newHead: Vec2 = {
    x: ((head.x + boss.direction.x) % GRID_SIZE + GRID_SIZE) % GRID_SIZE,
    y: ((head.y + boss.direction.y) % GRID_SIZE + GRID_SIZE) % GRID_SIZE,
  };

  // Save tail for poison trail
  const tail = boss.segments[boss.segments.length - 1];

  boss.segments.unshift(newHead);
  boss.segments.pop();

  // Leave poison trail
  boss.movesSincePoison++;
  if (boss.movesSincePoison >= boss.poisonTrailInterval && tail) {
    boss.movesSincePoison = 0;
    return {
      position: { x: tail.x, y: tail.y },
      type: HazardType.POISON_TRAIL,
      state: 'active',
      ticksRemaining: 12,
      spawnTick: currentTick,
    };
  }

  return null;
}

/** Check if player head collides with boss body */
export function checkBossCollision(playerHead: Vec2, boss: BossSnake): boolean {
  return boss.segments.some(seg => seg.x === playerHead.x && seg.y === playerHead.y);
}

/** Damage the boss (e.g., when player eats food near boss head).
 *  Returns true if boss is defeated. */
export function damageBoss(boss: BossSnake): boolean {
  boss.health--;
  if (boss.health <= 0) {
    boss.defeated = true;
    return true;
  }
  // Speed up when damaged
  boss.moveInterval = Math.max(1, boss.moveInterval - 1);
  return false;
}

/** Check if this arena should be a boss arena */
export function isBossArena(arenaNumber: number): boolean {
  return arenaNumber > 0 && arenaNumber % 5 === 0;
}
