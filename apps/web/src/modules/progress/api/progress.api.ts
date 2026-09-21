import { http } from "@/shared/lib/http";
import type { Achievement, QuestsResponse, XpEvent } from "../types";

// Endpoint calls only — they throw ApiError.
export const progressApi = {
  quests: () => http.get<QuestsResponse>("/users/me/quests"),
  myAchievements: () => http.get<Achievement[]>("/users/me/achievements"),
  achievementsOf: (handle: string) => http.get<Achievement[]>(`/users/${encodeURIComponent(handle)}/achievements`),
  xpHistory: (limit = 12) => http.get<XpEvent[]>(`/users/me/xp/history?limit=${limit}`),
};
