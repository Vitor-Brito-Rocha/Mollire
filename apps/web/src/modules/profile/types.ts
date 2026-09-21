export type UserProfile = {
  handle: string;
  xp: number;
  level: number;
  next: number;
  joined_at: string;
  frame?: string | null;
  projects: {
    slug: string;
    name: string;
    thumbnail_url: string | null;
    stars: number;
    published_at: string | null;
  }[];
  heatmap: { date: string; count: number }[];
};
