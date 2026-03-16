import { Vec2 } from './Grid';

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

const DIRECTION_VECTORS: Record<Direction, Vec2> = {
  [Direction.UP]: { x: 0, y: -1 },
  [Direction.DOWN]: { x: 0, y: 1 },
  [Direction.LEFT]: { x: -1, y: 0 },
  [Direction.RIGHT]: { x: 1, y: 0 },
};

export function isOpposite(a: Direction, b: Direction): boolean {
  return (
    (a === Direction.UP && b === Direction.DOWN) ||
    (a === Direction.DOWN && b === Direction.UP) ||
    (a === Direction.LEFT && b === Direction.RIGHT) ||
    (a === Direction.RIGHT && b === Direction.LEFT)
  );
}

export class Snake {
  segments: Vec2[];
  previousSegments: Vec2[];
  direction: Direction;
  queuedDirection: Direction | null = null;
  growthPending = 0;

  constructor(startPos: Vec2, length = 3, direction = Direction.RIGHT) {
    this.direction = direction;
    this.segments = [];
    for (let i = 0; i < length; i++) {
      this.segments.push({ x: startPos.x - i, y: startPos.y });
    }
    this.previousSegments = this.segments.map(s => ({ ...s }));
  }

  /** Apply queued input and move the snake one tick. Returns the new head position. */
  move(): Vec2 {
    // Save previous positions for interpolation
    this.previousSegments = this.segments.map(s => ({ ...s }));

    // Apply queued direction
    if (this.queuedDirection && !isOpposite(this.queuedDirection, this.direction)) {
      this.direction = this.queuedDirection;
      this.queuedDirection = null;
    }

    const vec = DIRECTION_VECTORS[this.direction];
    const head = this.segments[0];
    if (!head) throw new Error('Snake has no segments');

    const newHead: Vec2 = { x: head.x + vec.x, y: head.y + vec.y };

    // Add new head
    this.segments.unshift(newHead);

    // Remove tail unless growing
    if (this.growthPending > 0) {
      this.growthPending--;
      // Also add to previousSegments so lerp works for the new tail
      const lastPrev = this.previousSegments[this.previousSegments.length - 1];
      if (lastPrev) {
        this.previousSegments.push({ ...lastPrev });
      }
    } else {
      this.segments.pop();
    }

    return newHead;
  }

  get head(): Vec2 {
    const h = this.segments[0];
    if (!h) throw new Error('Snake has no segments');
    return h;
  }

  grow(amount = 1): void {
    this.growthPending += amount;
  }

  shrink(amount = 1): void {
    const minLength = 3;
    const toRemove = Math.min(amount, this.segments.length - minLength);
    if (toRemove > 0) {
      this.segments.splice(this.segments.length - toRemove, toRemove);
    }
  }

  queueDirection(dir: Direction): void {
    // Allow queuing if not opposite to current and not same as current
    const effectiveDir = this.queuedDirection ?? this.direction;
    if (!isOpposite(dir, effectiveDir) && dir !== effectiveDir) {
      this.queuedDirection = dir;
    }
  }
}
