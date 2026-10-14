import {
  formatDistanceKm,
  formatDuration,
  formatElevationM,
  formatImpactCardDate,
  formatLiters,
  formatPace,
  formatPrecipitationMm,
  formatRouteDistanceKm,
  formatStreakDays,
  formatTemperatureC,
} from './format';

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

describe('formatImpactCardDate', () => {
  it('formats as D Mon YYYY in the given timezone', () => {
    expect(formatImpactCardDate('2026-08-26T01:00:00Z', 'Australia/Sydney')).toBe('26 Aug 2026');
  });

  it('uses the given timezone, not device-local (date rolls over)', () => {
    // 2026-01-01T13:00:00Z is 2026-01-02 in Sydney (UTC+11)
    expect(formatImpactCardDate('2026-01-01T13:00:00Z', 'Australia/Sydney')).toBe('2 Jan 2026');
  });
});

describe('formatLiters', () => {
  it('drops the decimal when whole', () => expect(formatLiters(15)).toBe('15 L'));
  it('keeps 1 decimal when not whole', () => expect(formatLiters(37.5)).toBe('37.5 L'));
  it('rounds to 1 decimal', () => expect(formatLiters(7.46)).toBe('7.5 L'));
  it('formats 0', () => expect(formatLiters(0)).toBe('0 L'));
});

describe('formatStreakDays', () => {
  it('uses singular for 1', () => expect(formatStreakDays(1)).toBe('1 day'));
  it('uses plural otherwise', () => {
    expect(formatStreakDays(0)).toBe('0 days');
    expect(formatStreakDays(5)).toBe('5 days');
  });
});

describe('formatTemperatureC', () => {
  it('rounds to an integer', () => expect(formatTemperatureC(12.4)).toBe('12°C'));
  it('handles negatives', () => expect(formatTemperatureC(-2.6)).toBe('-3°C'));
  it('never shows -0', () => expect(formatTemperatureC(-0.4)).toBe('0°C'));
});

describe('formatPrecipitationMm', () => {
  it('shows 0mm when none', () => expect(formatPrecipitationMm(0)).toBe('0mm'));
  it('drops the decimal when whole', () => expect(formatPrecipitationMm(3)).toBe('3mm'));
  it('keeps 1 decimal otherwise', () => expect(formatPrecipitationMm(0.44)).toBe('0.4mm'));
});

describe('formatRouteDistanceKm', () => {
  it('keeps 1 decimal', () => expect(formatRouteDistanceKm(9.43)).toBe('9.4 km'));
  it('drops the decimal when whole', () => expect(formatRouteDistanceKm(10)).toBe('10 km'));
  it('rounds up to a whole number', () => expect(formatRouteDistanceKm(9.96)).toBe('10 km'));
});

describe('formatElevationM', () => {
  it('rounds to whole metres', () => expect(formatElevationM(66.6)).toBe('67m'));
});
