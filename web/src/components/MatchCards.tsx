import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronRight, MapPin } from "lucide-react";
import type { Match } from "@/lib/types";
import { cn, startsIn } from "@/lib/utils";
import { LiveDot } from "./ui";
import { TeamBadge } from "./TeamBadge";
import { OddsRow } from "./OddsButton";

export function StatusPill({ match, light }: { match: Match; light?: boolean }) {
  const base = cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold", light ? "bg-white/20 text-white" : "bg-white/8 text-white/80");
  if (match.status === "live")
    return (
      <span className={cn(base, light ? "bg-black/30" : "bg-loss/15 text-loss")}>
        <LiveDot className={light ? "bg-white" : undefined} /> AO VIVO · <span className="tabular-nums">{match.minute}'</span>
      </span>
    );
  if (match.status === "finished") return <span className={base}>Encerrado</span>;
  return (
    <span className="flex items-center gap-2">
      <span className={cn(base, light ? "bg-white/25" : "bg-brand/20 text-brand-2")}>Aberto</span>
      <span className={cn("text-[10px]", light ? "text-white/80" : "text-muted")}>{startsIn(match.startsAt)}</span>
    </span>
  );
}

function Score({ match, light }: { match: Match; light?: boolean }) {
  if (match.status === "upcoming") return null;
  return (
    <motion.div key={`${match.score.home}-${match.score.away}`} initial={{ scale: 1.35, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}
      className={cn("rounded-xl px-2.5 py-1 text-lg font-extrabold tabular-nums", light ? "bg-black/25" : "bg-white/5")}>
      {match.score.home}<span className="mx-1 opacity-50">:</span>{match.score.away}
    </motion.div>
  );
}

/** Card de destaque, no estilo do primeiro card do conceito (gradiente laranja). */
export function FeaturedCard({ match, variant = "brand" }: { match: Match; variant?: "brand" | "dark" }) {
  const light = variant === "brand";
  return (
    <Link to="/partida/$matchId" params={{ matchId: match.id }} className="block">
      <motion.article
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={cn(
          "relative overflow-hidden rounded-3xl p-4",
          light ? "brand-gradient shadow-xl shadow-brand/30" : "border border-white/5 bg-surface",
        )}
      >
        {light && <div className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-white/15 blur-2xl" />}
        <div className="relative flex items-start justify-between">
          <StatusPill match={match} light={light} />
          <span className={cn("text-[11px] font-medium", light ? "text-white/80" : "text-muted")}>{match.league}</span>
        </div>

        <div className="relative mt-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex -space-x-3">
              <TeamBadge team={match.home} size={42} />
              <TeamBadge team={match.away} size={42} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-[17px] font-extrabold leading-tight">{match.home.name}</h3>
              <h3 className="truncate text-[17px] font-extrabold leading-tight opacity-90">{match.away.name}</h3>
            </div>
          </div>
          <Score match={match} light={light} />
        </div>
        <p className={cn("relative mt-1.5 flex items-center gap-1 text-[11px]", light ? "text-white/80" : "text-muted")}>
          <MapPin className="size-3" /> {match.venue}
        </p>

        <div className="relative mt-4">
          <OddsRow match={match} tone={light ? "light" : "dark"} />
        </div>
        <div className={cn("relative mt-2.5 flex h-11 items-center justify-center gap-1 rounded-2xl text-sm font-semibold", light ? "bg-black/85" : "bg-brand")}>
          Ver mercados <ChevronRight className="size-4" />
        </div>
      </motion.article>
    </Link>
  );
}

/** Linha compacta para a lista de jogos. */
export function MatchCard({ match }: { match: Match }) {
  return (
    <Link to="/partida/$matchId" params={{ matchId: match.id }} className="block">
      <motion.article whileTap={{ scale: 0.99 }} className="rounded-3xl border border-white/5 bg-surface p-4">
        <div className="flex items-center justify-between">
          <StatusPill match={match} />
          <span className="text-[11px] text-muted">{match.league}</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex -space-x-2">
            <TeamBadge team={match.home} size={34} />
            <TeamBadge team={match.away} size={34} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-bold">{match.home.name} <span className="text-muted">x</span> {match.away.name}</h3>
            <p className="truncate text-[11px] text-muted">{match.venue}</p>
          </div>
          <Score match={match} />
        </div>
        <div className="mt-3">
          <OddsRow match={match} compact />
        </div>
      </motion.article>
    </Link>
  );
}
