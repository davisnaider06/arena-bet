import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft, MapPin } from "lucide-react";
import { AxiosError } from "axios";
import { api, qk } from "@/lib/api";
import { TeamBadge } from "@/components/TeamBadge";
import { OddsButton } from "@/components/OddsButton";
import { StatusPill } from "@/components/MatchCards";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { Page, item, stagger } from "./Page";
import { SearchX } from "lucide-react";

export function MatchPage() {
  const { matchId } = useParams({ from: "/partida/$matchId" });
  const q = useQuery({ queryKey: qk.match(matchId), queryFn: () => api.match(matchId) });

  const notFound = q.error instanceof AxiosError && q.error.response?.status === 404;

  return (
    <Page>
      <div className="hero-glow absolute inset-x-0 top-0 h-96" aria-hidden />
      <div className="relative px-4 pb-40 pt-4">
        <Link to="/" className="inline-grid size-10 place-items-center rounded-full bg-black/40 ring-1 ring-white/10" aria-label="Voltar">
          <ArrowLeft className="size-5" />
        </Link>

        {notFound ? (
          <div className="mt-6"><EmptyState icon={SearchX} title="Partida não encontrada" body="Ela pode ter sido removida." /></div>
        ) : q.isError ? (
          <div className="mt-6"><ErrorState message="Não deu para carregar a partida." onRetry={() => q.refetch()} /></div>
        ) : q.isPending ? (
          <div className="mt-6 space-y-3"><Skeleton className="h-52" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.section variants={item} className="mt-4 text-center">
              <div className="flex justify-center"><StatusPill match={q.data} /></div>
              <p className="mt-2 text-xs text-muted">{q.data.league}</p>
              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="flex flex-col items-center gap-2">
                  <TeamBadge team={q.data.home} size={72} />
                  <p className="text-sm font-bold">{q.data.home.name}</p>
                </div>
                <motion.div key={`${q.data.score.home}-${q.data.score.away}`} initial={{ scale: 1.5, opacity: 0.3 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 320, damping: 14 }}
                  className="text-5xl font-black tabular-nums">
                  {q.data.status === "upcoming" ? <span className="text-3xl text-white/40">VS</span> : <>{q.data.score.home}<span className="mx-2 text-white/30">:</span>{q.data.score.away}</>}
                </motion.div>
                <div className="flex flex-col items-center gap-2">
                  <TeamBadge team={q.data.away} size={72} />
                  <p className="text-sm font-bold">{q.data.away.name}</p>
                </div>
              </div>
              <p className="mt-4 flex items-center justify-center gap-1 text-[11px] text-muted"><MapPin className="size-3" />{q.data.venue}</p>
            </motion.section>

            {q.data.status === "live" && (
              <motion.div variants={item} className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div className="brand-gradient h-full rounded-full" animate={{ width: `${Math.min(100, (q.data.minute / (q.data.sport === "futsal" ? 40 : 90)) * 100)}%` }} transition={{ type: "spring", stiffness: 60, damping: 20 }} />
              </motion.div>
            )}

            <div className="mt-6 space-y-3">
              {q.data.markets.map((mk) => (
                <motion.section key={mk.id} variants={item} className="rounded-3xl border border-white/5 bg-surface p-4">
                  <h2 className="mb-3 text-sm font-semibold">{mk.name}</h2>
                  <div className="flex gap-2">
                    {mk.selections.map((s) => <OddsButton key={s.id} match={q.data} market={mk} selection={s} />)}
                  </div>
                </motion.section>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Page>
  );
}
