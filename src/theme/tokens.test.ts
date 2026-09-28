import { colors, spacing, shadows, typography } from './tokens';

describe('design tokens', () => {
  it('exposes the brand primary color scale', () => {
    expect(colors.brand.primary['500']).toBe('#15e654');
  });

  it('exposes the spacing scale', () => {
    expect(spacing.m).toBe(12);
  });

  it('exposes shadow layers', () => {
    expect(shadows.normal).toHaveLength(3);
  });

  it('exposes typography composites', () => {
    expect(typography.headline.fontSize).toBe(17);
    expect(typography.titles.large.lineHeight).toBeCloseTo(33.6);
  });
});
