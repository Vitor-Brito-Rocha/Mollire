import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { invalidateSession } from "@/modules/auth";

// /auth/github/callback sends the user back here with the outcome of installing
// the GitHub App in the query (?github=conectado | erro&msg=…): say it once,
// then clean the URL so a refresh doesn't repeat it.
export function useGithubReturnNotice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const result = searchParams.get("github");
  const message = searchParams.get("msg");

  useEffect(() => {
    // id: StrictMode runs effects twice in dev; one toast, not two.
    if (result === "conectado") {
      toast.success("GitHub conectado com sucesso", { id: "github-return" });
      // `github_connected` is part of the session user.
      void invalidateSession();
    } else if (result === "erro") {
      toast.error(message ?? "Erro ao conectar GitHub", { id: "github-return" });
    } else {
      return;
    }
    navigate("/perfil", { replace: true });
  }, [result, message, navigate]);
}
