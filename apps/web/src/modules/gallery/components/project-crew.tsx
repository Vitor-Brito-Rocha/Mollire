import { Link } from "react-router";
import type { GalleryProjectDetail } from "../types";

// "Quem faz": the people behind the project, each linking to their profile.
export function ProjectCrew({ members }: { members: GalleryProjectDetail["members"] }) {
  if (members.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="label flex items-center gap-2.5">
        <span className="bg-primary h-0.5 w-[14px]" />
        Quem faz
        <span className="text-text-3 font-mono text-xs tracking-normal normal-case">{members.length}</span>
      </h2>
      <ul className="flex flex-col gap-2">
        {members.map((member) => (
          <li key={member.handle} className="flex items-center gap-2.5">
            <span className="hex bg-raised font-display text-muted-foreground grid size-7 shrink-0 place-items-center text-mini font-bold uppercase">
              {member.handle.charAt(0)}
            </span>
            <Link to={`/u/${member.handle}`} className="text-sm underline-offset-4 hover:underline">
              {member.handle}
            </Link>
            <span className="label text-text-3 ml-auto text-mini">{member.role === "OWNER" ? "dono" : "membro"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
