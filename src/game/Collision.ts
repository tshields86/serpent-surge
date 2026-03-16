import { Vec2 } from './Grid';

export function checkWallCollision(head: Vec2, gridSize: number): boolean {
  return head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
}

export function checkSelfCollision(segments: readonly Vec2[]): boolean {
  const head = segments[0];
  if (!head) return false;
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    if (seg && seg.x === head.x && seg.y === head.y) {
      return true;
    }
  }
  return false;
}
