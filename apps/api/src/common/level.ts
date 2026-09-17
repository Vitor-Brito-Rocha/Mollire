// Level L requires cumulative XP 50*L*(L-1) — a quadratic curve so each level
// costs more than the last. Derived from xp on read, never stored: xp is the
// single source of truth, level/next are just a view of it.
function thresholdFor(level: number): number {
  return 50 * level * (level - 1);
}

export function levelForXp(xp: number): { level: number; next: number } {
  let level = 1;
  while (xp >= thresholdFor(level + 1)) {
    level++;
  }
  return { level, next: thresholdFor(level + 1) };
}
