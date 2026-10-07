import { formatDistanceKm, formatDuration, formatPace } from './format';

describe('formatDuration', () => {
  it('formats under a minute', () => expect(formatDuration(5)).toBe('0:05'));
  it('formats minutes:seconds, unpadded minutes', () => expect(formatDuration(65)).toBe('1:05'));
  it('formats just under an hour', () => expect(formatDuration(3599)).toBe('59:59'));
  it('switches to h:mm:ss at exactly an hour', () => expect(formatDuration(3600)).toBe('1:00:00'));
  it('formats multi-hour durations', () => expect(formatDuration(7384)).toBe('2:03:04'));
  it('clamps negative input to 0', () => expect(formatDuration(-5)).toBe('0:00'));
});

describe('formatDistanceKm', () => {
  it('formats with 1 decimal', () => expect(formatDistanceKm(7.6, 1)).toBe('7.6'));
  it('formats with 2 decimals', () => expect(formatDistanceKm(4, 2)).toBe('4.00'));
  it('rounds', () => expect(formatDistanceKm(4.016, 2)).toBe('4.02'));
});

describe('formatPace', () => {
  it('formats m′ss″', () => {
    expect(formatPace(362)).toBe('6′02″');
    expect(formatPace(600)).toBe('10′00″');
  });

  it('rounds 59.6s up to the next minute', () => {
    expect(formatPace(59.6)).toBe('1′00″');
  });
});
