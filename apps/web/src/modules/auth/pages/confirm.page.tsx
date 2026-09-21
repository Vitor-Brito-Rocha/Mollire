import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { PendingScreen } from "../components/pending-screen";
import { useConfirmEmail } from "../hooks/use-auth-mutations";
import { resolveNext } from "../lib/redirect";

// Landing page of every auth email link (signup confirmation, password
// recovery): the token_hash in the URL is traded, through the API, for the
// session cookie before moving on into the app.
export default function ConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const confirm = useConfirmEmail();
  // The token is single-use and StrictMode runs effects twice in dev: without
  // this the second call would burn the link and bounce a valid user.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");
    if (!tokenHash || !type) {
      navigate("/login?error=link_invalido", { replace: true });
      return;
    }

    // Only same-site paths: `next` comes from the URL.
    const destination = resolveNext(searchParams.get("next"));
    const path = destination?.kind === "internal" ? destination.path : "/";

    // mutateAsync: the redirect must not depend on this component staying mounted.
    confirm
      .mutateAsync({ tokenHash, type })
      .then(() => navigate(path, { replace: true }))
      .catch(() => navigate("/login?error=link_invalido", { replace: true }));
  }, [confirm, navigate, searchParams]);

  return <PendingScreen label="Confirmando…" />;
}
