import { computeBagIconFills, computeLiters, FILL_LEVELS } from './litter';

describe('computeLiters', () => {
  it('is ratio × bag size, 1 decimal', () => {
    expect(computeLiters(0.5, 15)).toBe(7.5);
    expect(computeLiters(0.1, 15)).toBe(1.5);
    expect(computeLiters(0.75, 5)).toBe(3.8);
    expect(computeLiters(1, 25)).toBe(25);
  });

  it('is 0 for a 0 ratio', () => {
    expect(computeLiters(0, 15)).toBe(0);
  });
});

describe('FILL_LEVELS', () => {
  it('is levels 0-5 only, indexed by level', () => {
    expect(FILL_LEVELS.map((l) => l.level)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(FILL_LEVELS.map((l) => l.ratio)).toEqual([0, 0.1, 0.25, 0.5, 0.75, 1]);
  });
});

describe('computeBagIconFills', () => {
  it('is all empty at 0 L', () => {
    expect(computeBagIconFills(0, 15)).toEqual({ fills: [0, 0, 0, 0, 0], extra: 0 });
  });

  it('fills partially (22.5 L / 15 L = 1.5 bags)', () => {
    expect(computeBagIconFills(22.5, 15)).toEqual({ fills: [1, 0.5, 0, 0, 0], extra: 0 });
  });

  it('has no +N at exactly 5 bags', () => {
    expect(computeBagIconFills(75, 15)).toEqual({ fills: [1, 1, 1, 1, 1], extra: 0 });
  });

  it('counts a partial extra bag as one', () => {
    expect(computeBagIconFills(90, 15).extra).toBe(1);
    expect(computeBagIconFills(97.5, 15).extra).toBe(2);
  });
});
