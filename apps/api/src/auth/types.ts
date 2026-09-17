import { Role } from '@prisma/client';

export type AuthenticatedUser = {
  id: string;
  email: string;
  // Public identity; null only for rows provisioned before handles existed
  // and not synced since (syncUser backfills on the next request).
  handle: string | null;
  role: Role;
  xp: number;
};
