import { describe, it, expect } from 'vitest';
import { checkWallCollision, checkSelfCollision } from '../Collision';

describe('checkWallCollision', () => {
  const gridSize = 20;

  it('returns false for positions inside the grid', () => {
    expect(checkWallCollision({ x: 0, y: 0 }, gridSize)).toBe(false);
    expect(checkWallCollision({ x: 10, y: 10 }, gridSize)).toBe(false);
    expect(checkWallCollision({ x: 19, y: 19 }, gridSize)).toBe(false);
  });

  it('returns true when head goes past left boundary', () => {
    expect(checkWallCollision({ x: -1, y: 10 }, gridSize)).toBe(true);
  });

  it('returns true when head goes past right boundary', () => {
    expect(checkWallCollision({ x: 20, y: 10 }, gridSize)).toBe(true);
  });

  it('returns true when head goes past top boundary', () => {
    expect(checkWallCollision({ x: 10, y: -1 }, gridSize)).toBe(true);
  });

  it('returns true when head goes past bottom boundary', () => {
    expect(checkWallCollision({ x: 10, y: 20 }, gridSize)).toBe(true);
  });

  it('returns true at exact corners outside grid', () => {
    expect(checkWallCollision({ x: -1, y: -1 }, gridSize)).toBe(true);
    expect(checkWallCollision({ x: 20, y: 20 }, gridSize)).toBe(true);
  });
});

describe('checkSelfCollision', () => {
  it('returns false for a straight snake', () => {
    const segments = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ];
    expect(checkSelfCollision(segments)).toBe(false);
  });

  it('returns true when head overlaps a body segment', () => {
    const segments = [
      { x: 4, y: 5 }, // head loops back onto body
      { x: 5, y: 5 },
      { x: 5, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 5 }, // collision here
    ];
    expect(checkSelfCollision(segments)).toBe(true);
  });

  it('returns false for a short snake that cannot self-collide', () => {
    const segments = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
    ];
    expect(checkSelfCollision(segments)).toBe(false);
  });

  it('returns false for an empty segments array', () => {
    expect(checkSelfCollision([])).toBe(false);
  });
});
