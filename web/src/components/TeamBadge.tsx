import type { Team } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Escudo gerado a partir das cores do time (times são fictícios). */
export function TeamBadge({ team, size = 40, className }: { team: Team; size?: number; className?: string }) {
  const id = `g-${team.short}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={cn("shrink-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]", className)} role="img" aria-label={team.name}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={team.color} />
          <stop offset="1" stopColor={team.color} stopOpacity="0.72" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="23" fill="#121214" stroke={team.color} strokeWidth="2" />
      <path d="M24 8 37 13v10c0 8.5-5.6 14.6-13 17-7.4-2.4-13-8.5-13-17V13z" fill={`url(#${id})`} />
      <path d="M24 8 37 13v10c0 8.5-5.6 14.6-13 17" fill="none" stroke={team.accent} strokeOpacity="0.5" strokeWidth="1.2" />
      <text x="24" y="28" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="Inter Variable, sans-serif" letterSpacing="0.5">
        {team.short}
      </text>
    </svg>
  );
}
