// Level-badge frames: the id the frontend catalog knows
// (modules/progress/lib/catalog.ts) and the level that unlocks it.
export const FRAME_MIN_LEVEL = {
  default: 1,
  bronze: 3,
  silver: 5,
  gold: 8,
  violet: 12,
} as const;

export type FrameId = keyof typeof FRAME_MIN_LEVEL;

export const FRAME_IDS = Object.keys(FRAME_MIN_LEVEL) as FrameId[];
