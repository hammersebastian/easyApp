import { describe, expect, it } from 'vitest';
import { calculateExamPassed } from './scoring';

describe('50/30-Bestehensregel', () => {
  it.each([
    [{ A: 50, B: 50, C: 50, D: 50, E: 30 }, true],
    [{ A: 50, B: 50, C: 50, D: 50, E: 29 }, false],
    [{ A: 50, B: 50, C: 50, D: 49, E: 49 }, false],
    [{ A: 100, B: 100, C: 100, D: 100, E: 100 }, true],
    [{ A: 80, B: 70, C: 60, D: 40, E: 40 }, false],
  ])('wertet %o als %s', (scores, expected) => {
    expect(calculateExamPassed(scores)).toBe(expected);
  });
});
