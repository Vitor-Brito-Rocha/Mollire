import { useMutation, useQuery } from "@tanstack/react-query";
import { setSessionUser, type CurrentUser } from "@/modules/auth";
import { profileApi } from "../api/profile.api";

// The screen renders its own "not found" / error state.
export function useUserProfile(handle: string) {
  return useQuery({
    queryKey: ["profile", handle],
    queryFn: () => profileApi.publicProfile(handle),
    meta: { silent: true },
  });
}

export function useUpdateHandle() {
  return useMutation({
    mutationFn: (handle: string) => profileApi.updateHandle(handle),
    // The header avatar reads the cached session: write the fresh user through.
    onSuccess: setSessionUser,
    meta: {
      successMessage: (updated: CurrentUser) => `Agora você aparece como ${updated.handle}`,
      errorMessage: "Erro ao salvar",
    },
  });
}
