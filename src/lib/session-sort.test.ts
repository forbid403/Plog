import { sortSessions } from './session-sort';

const s = (id: string, startedAt: string, liters: number | null) => ({ id, startedAt, liters });
const sessions = [
  s('a', '2026-10-01T01:00:00Z', 5),
  s('b', '2026-10-03T01:00:00Z', null),
  s('c', '2026-10-02T01:00:00Z', 15),
  s('d', '2026-10-04T01:00:00Z', 0),
  s('e', '2026-09-30T01:00:00Z', 5),
];
const ids = (list: { id: string }[]) => list.map((x) => x.id);

describe('sortSessions', () => {
  it('most recent first', () => expect(ids(sortSessions(sessions, 'recent'))).toEqual(['d', 'b', 'c', 'a', 'e']));
  it('oldest first', () => expect(ids(sortSessions(sessions, 'oldest'))).toEqual(['e', 'a', 'c', 'b', 'd']));
  it('most litter first, ties newest first, unlogged last', () =>
    expect(ids(sortSessions(sessions, 'mostLitter'))).toEqual(['c', 'a', 'e', 'd', 'b']));
  it('least litter first, 0 L before unlogged', () =>
    expect(ids(sortSessions(sessions, 'leastLitter'))).toEqual(['d', 'a', 'e', 'c', 'b']));
  it('does not mutate the input', () => {
    const copy = [...sessions];
    sortSessions(sessions, 'oldest');
    expect(sessions).toEqual(copy);
  });
});
