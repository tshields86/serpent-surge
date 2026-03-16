import { GRID_SIZE } from '../utils/constants';

export interface Vec2 {
  x: number;
  y: number;
}

export class Grid {
  readonly size = GRID_SIZE;

  isInBounds(pos: Vec2): boolean {
    return pos.x >= 0 && pos.x < this.size && pos.y >= 0 && pos.y < this.size;
  }

  centerCell(): Vec2 {
    return {
      x: Math.floor(this.size / 2),
      y: Math.floor(this.size / 2),
    };
  }
}
