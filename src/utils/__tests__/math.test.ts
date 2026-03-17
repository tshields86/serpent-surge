import { describe, it, expect } from 'vitest';
import { createSeededRng, todaySeed } from '../math';

describe('Seeded RNG', () => {
  it('same seed produces same sequence', () => {
    const rng1 = createSeededRng(12345);
    const rng2 = createSeededRng(12345);

    const seq1 = Array.from({ length: 100 }, () => rng1());
    const seq2 = Array.from({ length: 100 }, () => rng2());

    expect(seq1).toEqual(seq2);
  });

  it('different seeds produce different sequences', () => {
    const rng1 = createSeededRng(12345);
    const rng2 = createSeededRng(54321);

    const val1 = rng1();
    const val2 = rng2();

    expect(val1).not.toBe(val2);
  });

  it('produces values in [0, 1) range', () => {
    const rng = createSeededRng(42);
    for (let i = 0; i < 1000; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('todaySeed returns YYYYMMDD integer', () => {
    const seed = todaySeed();
    expect(seed).toBeGreaterThan(20200101);
    expect(seed).toBeLessThan(20991231);
  });
});
