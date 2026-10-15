/**
 * Recent Plogs sort (G4.1). The spec has Most recent / Oldest; the litter
 * orders were added 2026-10-14 (product decision). Pure — the My screen
 * sorts its already-loaded list.
 */

export type SessionSort = 'recent' | 'oldest' | 'mostLitter' | 'leastLitter';

export const SESSION_SORT_OPTIONS: { key: SessionSort; label: string }[] = [
  { key: 'recent', label: 'Most recent' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'mostLitter', label: 'Most litter' },
  { key: 'leastLitter', label: 'Least litter' },
];

type Sortable = { startedAt: string; liters: number | null };

const newestFirst = (a: Sortable, b: Sortable) => Date.parse(b.startedAt) - Date.parse(a.startedAt);

/**
 * Returns a new array. Litter orders keep sessions whose litter isn't logged
 * yet (liters null) at the end — they're unknown, not 0 L — and break ties
 * newest first.
 */
export function sortSessions<T extends Sortable>(sessions: T[], sort: SessionSort): T[] {
  const copy = [...sessions];
  if (sort === 'recent') return copy.sort(newestFirst);
  if (sort === 'oldest') return copy.sort((a, b) => -newestFirst(a, b));
  const direction = sort === 'mostLitter' ? -1 : 1;
  return copy.sort((a, b) => {
    if (a.liters === null || b.liters === null) {
      return a.liters === b.liters ? newestFirst(a, b) : a.liters === null ? 1 : -1;
    }
    return a.liters === b.liters ? newestFirst(a, b) : direction * (a.liters - b.liters);
  });
}
