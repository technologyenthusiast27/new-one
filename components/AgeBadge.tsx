import { ShieldAlert } from "lucide-react";
import type { AgeCategory } from "@/lib/types";
import { ageCategoryLabel } from "@/lib/age";

/** Compact age-requirement pill, reused on event, tickets and checkout. */
export function AgeBadge({
  category,
  className = "",
  withIcon = true,
}: {
  category: AgeCategory;
  className?: string;
  withIcon?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-violet-glow/15 px-3 py-1 text-xs font-semibold text-violet-soft ring-1 ring-inset ring-violet-glow/30 ${className}`}
    >
      {withIcon && <ShieldAlert className="h-3.5 w-3.5" aria-hidden />}
      <span className="sr-only">Age requirement: </span>
      {ageCategoryLabel(category)}
    </span>
  );
}
