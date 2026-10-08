/**
 * Litter log math (D2-D4) and bag icon fills (G4.3). Pure/unit-tested.
 */

export type FillLevel = {
  level: number;
  label: string;
  ratio: number;
};

// D2 stepper labels. Level 0 `None` comes from Figma (Plog Design 681:1945),
// not the spec, which starts at 1 — Figma is followed here (2026-10-08).
// Levels 6+ (+0.25 per step) are on hold (H1-1 D1) — 0-5 only until decided.
export const FILL_LEVELS: FillLevel[] = [
  { level: 0, label: 'None', ratio: 0 },
  { level: 1, label: 'A handful of litter', ratio: 0.1 }, // ratio [TBD-D1]
  { level: 2, label: 'A quarter of a bag', ratio: 0.25 },
  { level: 3, label: 'Half a bag', ratio: 0.5 },
  { level: 4, label: 'Three quarters of a bag', ratio: 0.75 },
  { level: 5, label: 'A full bag', ratio: 1 },
];

// D3 sizes. No default selection — Figma starts with none picked.
export const BAG_SIZES_L = [5, 10, 15, 20, 25];

/** D4: liters = round(ratio × bagSizeLiters, 1). */
export function computeLiters(ratio: number, bagSizeLiters: number): number {
  return Math.round(ratio * bagSizeLiters * 10) / 10;
}

const BAG_ICON_COUNT = 5;

/**
 * G4.3: each of the 5 icons fills 0-1 by liters ÷ bagSize; past 5 bags,
 * `extra` is the `+N` count (a partial bag counts as one, none at exactly 5).
 */
export function computeBagIconFills(liters: number, bagSizeLiters: number): { fills: number[]; extra: number } {
  const filled = liters / bagSizeLiters;
  const fills = Array.from({ length: BAG_ICON_COUNT }, (_, i) => Math.min(1, Math.max(0, filled - i)));
  const extra = filled > BAG_ICON_COUNT ? Math.ceil(filled - BAG_ICON_COUNT) : 0;
  return { fills, extra };
}
