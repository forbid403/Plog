import { shadowLayerToStyle } from './shadow';

describe('shadowLayerToStyle', () => {
  it('splits an 8-digit hex color into shadowColor + shadowOpacity', () => {
    const style = shadowLayerToStyle({ x: 0, y: 1, blur: 2, spread: 0, color: '#0000001f' });
    expect(style.shadowColor).toBe('#000000');
    expect(style.shadowOpacity).toBeCloseTo(31 / 255);
    expect(style.shadowOffset).toEqual({ width: 0, height: 1 });
    expect(style.shadowRadius).toBe(2);
  });

  it('defaults opacity to 1 for a 6-digit hex color', () => {
    const style = shadowLayerToStyle({ x: 0, y: 0, blur: 0, spread: 0, color: '#15e654' });
    expect(style.shadowOpacity).toBe(1);
  });
});
