import { cn } from "@/shared/lib/utils";
import type { Tier } from "../lib/tiers";

// The medal (Bronze / Prata / Ouro) a project earns by stars.
export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <span
      className={cn("tag-cut bg-raised label w-fit shrink-0 py-[5px] pr-2 pl-[11px] text-micro font-bold", className)}
      style={{ color: tier.color, boxShadow: `inset 3px 0 0 ${tier.color}` }}
    >
      {tier.label}
    </span>
  );
}
