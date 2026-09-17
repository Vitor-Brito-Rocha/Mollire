import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Escape hatch for the global JwtAuthGuard — auth here is opt-out, not opt-in,
// so a forgotten @UseGuards() can never turn into a silent tenant-isolation hole.
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
