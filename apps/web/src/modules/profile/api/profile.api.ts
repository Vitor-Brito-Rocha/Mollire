import { http } from "@/shared/lib/http";
import type { CurrentUser } from "@/modules/auth";
import type { UserProfile } from "../types";

export const profileApi = {
  // Public: anyone can open /u/<handle>.
  publicProfile: (handle: string) => http.get<UserProfile>(`/users/${handle}`),
  updateHandle: (handle: string) => http.patch<CurrentUser>("/users/me", { handle }),
};
