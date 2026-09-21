import { XpReason } from '@prisma/client';

// The single place XP amounts live. GET /xp/rules serves the public subset so
// the frontend stops mirroring these numbers.
//
// QUEST is the default per-quest value; each quest carries its own amount (see
// quests.catalog). ACHIEVEMENT is flat, and internal — not listed publicly.
export const XP_VALUE: Record<XpReason, number> = {
  DEPLOY: 10,
  FIRST_DEPLOY: 50,
  PUBLISH: 20,
  STAR_RECEIVED: 5,
  QUEST: 10,
  ACHIEVEMENT: 25,
  HELPFUL_COMMENT: 5,
};

const PUBLIC_RULES: XpReason[] = [
  XpReason.DEPLOY,
  XpReason.FIRST_DEPLOY,
  XpReason.PUBLISH,
  XpReason.STAR_RECEIVED,
  XpReason.QUEST,
  XpReason.HELPFUL_COMMENT,
];

export const XP_RULES = PUBLIC_RULES.map((code) => ({ code, xp: XP_VALUE[code] }));
