import { useLocation, useNavigate } from "react-router";
import { loginPathFor, useCurrentUser } from "@/modules/auth";
import { useToggleStar } from "../hooks/use-toggle-star";
import { StarButton } from "./star-button";

type ProjectStarButtonProps = {
  slug: string;
  name: string;
  stars: number;
  starred: boolean;
};

// The star of one project, wired up. Each instance owns its own mutation, so
// starring one card never disables the others.
export function ProjectStarButton({ slug, name, stars, starred }: ProjectStarButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useCurrentUser();
  const toggleStar = useToggleStar();

  function handleToggle() {
    // Visitante anônimo pode ver a galeria, mas estrela é um gesto de quem tem
    // conta: vai entrar e volta para cá.
    if (!user) {
      navigate(loginPathFor(location.pathname + location.search));
      return;
    }
    toggleStar.mutate({ slug, starred });
  }

  return (
    <StarButton name={name} stars={stars} starred={starred} pending={toggleStar.isPending} onToggle={handleToggle} />
  );
}
