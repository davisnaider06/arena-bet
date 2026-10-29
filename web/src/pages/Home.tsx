import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarX2, Search, SlidersHorizontal } from "lucide-react";
import { api, qk } from "@/lib/api";
import type { Match } from "@/lib/types";
import { cn, formatBRL, isSameDay } from "@/lib/utils";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { FeaturedCard, MatchCard } from "@/components/MatchCards";
import { TeamBadge } from "@/components/TeamBadge";
import { EmptyState, ErrorState, SectionTitle, Skeleton } from "@/components/ui";
import { Page, stagger, item } from "./Page";

function useWeek() {
  return useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * 86_400_000));
  }, []);
}

export function HomePage() {
  const week = useWeek();
  const [day, setDay] = useState(0);
  const matches = useQuery({ queryKey: qk.matches(""), queryFn: () => api.matches() });
  const teams = useQuery({ queryKey: qk.teams, queryFn: api.popularTeams });

  const selected = week[day];
  const { featured, rest } = useMemo(() => {
    const all = matches.data ?? [];
    // Hoje mostra também o que está ao vivo; os outros dias filtram pela data de início.
    const ofDay = all.filter((m) => (day === 0 && m.status === "live") || isSameDay(new Date(m.startsAt), selected));
    const f = ofDay.filter((m) => m.status === "live" || m.featured).slice(0, 4);
    return { featured: f, rest: ofDay.filter((m) => !f.includes(m)) };
  }, [matches.data, day, selected]);

  return (
    <Page>
      <div className="hero-glow absolute inset-x-0 top-0 h-80" aria-hidden />
      <motion.div variants={stagger} initial="hidden" animate="show" className="relative space-y-6 px-4 pb-40 pt-4">
        <motion.header variants={item}><Greeting /></motion.header>

        <motion.div variants={item}>
          <Link to="/buscar" className="flex h-12 items-center gap-3 rounded-2xl bg-white/8 px-4 text-sm text-white/60 ring-1 ring-white/10 backdrop-blur transition hover:bg-white/12">
            <Search className="size-5" />
            <span className="flex-1">Buscar times, ligas e jogos</span>
            <SlidersHorizontal className="size-4" />
          </Link>
        </motion.div>

        <motion.div variants={item} className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4">
          {week.map((d, i) => {
            const active = i === day;
            return (
              <button key={i} onClick={() => setDay(i)} className="relative flex h-16 min-w-[52px] flex-1 flex-col items-center justify-center rounded-2xl">
                {active && <motion.span layoutId="day" className="absolute inset-0 rounded-2xl bg-brand shadow-lg shadow-brand/40" transition={{ type: "spring", stiffness: 500, damping: 34 }} />}
                <span className={cn("relative text-xs capitalize", active ? "text-white" : i === 0 ? "text-brand-2" : "text-white/70")}>
                  {i === 0 ? "Hoje" : d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                </span>
                <span className={cn("relative text-[15px] font-bold", !active && i === 0 && "text-brand-2")}>{d.getDate()}</span>
              </button>
            );
          })}
        </motion.div>

        {matches.isError ? (
          <ErrorState message="Não deu para carregar os jogos." onRetry={() => matches.refetch()} />
        ) : matches.isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-60" />
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        ) : featured.length + rest.length === 0 ? (
          <EmptyState icon={CalendarX2} title="Nenhum jogo nesse dia" body="Escolha outro dia ou veja o que está ao vivo agora." action={<button onClick={() => setDay(0)} className="text-sm font-semibold text-brand-2">Ver hoje</button>} />
        ) : (
          <>
            {featured.length > 0 && (
              <motion.section variants={item} className="space-y-3">
                {featured.map((m, i) => (
                  <motion.div key={m.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <FeaturedCard match={m} variant={i === 0 ? "brand" : "dark"} />
                  </motion.div>
                ))}
              </motion.section>
            )}
            {rest.length > 0 && (
              <motion.section variants={item}>
                <SectionTitle action={<Link to="/ao-vivo" className="text-xs text-muted hover:text-white">Ver ao vivo</Link>}>Próximos jogos</SectionTitle>
                <div className="space-y-3">{rest.map((m) => <MatchCard key={m.id} match={m} />)}</div>
              </motion.section>
            )}
          </>
        )}

        <motion.section variants={item}>
          <SectionTitle>Times populares</SectionTitle>
          {teams.isPending ? (
            <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
          ) : teams.isError ? (
            <ErrorState message="Não deu para carregar os times." onRetry={() => teams.refetch()} />
          ) : (
            <ul className="divide-y divide-white/5">
              {teams.data.map((t) => (
                <TeamRow key={t.short} team={t} matches={matches.data ?? []} />
              ))}
            </ul>
          )}
        </motion.section>
      </motion.div>
    </Page>
  );
}

function TeamRow({ team, matches }: { team: Match["home"]; matches: Match[] }) {
  const next = matches.find((m) => m.home.short === team.short || m.away.short === team.short);
  return (
    <li>
      {next ? (
        <Link to="/partida/$matchId" params={{ matchId: next.id }} className="flex items-center gap-3 py-3">
          <TeamBadge team={team} size={44} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{team.name}</p>
            <p className="truncate text-[11px] text-muted">{next.venue}</p>
          </div>
          <span className="text-xs font-medium text-white/80">Ver jogo</span>
        </Link>
      ) : (
        <div className="flex items-center gap-3 py-3">
          <TeamBadge team={team} size={44} />
          <p className="flex-1 font-semibold">{team.name}</p>
          <span className="text-xs text-muted">Sem jogos</span>
        </div>
      )}
    </li>
  );
}

function Greeting() {
  const wallet = useQuery({ queryKey: qk.wallet, queryFn: api.wallet });
  return (
    <div className="flex items-center gap-3">
      <div className="brand-gradient grid size-12 place-items-center rounded-full p-[2px]">
        <div className="grid size-full place-items-center rounded-full bg-[#1a1a1c] text-sm font-bold">DS</div>
      </div>
      <div className="flex-1">
        <p className="text-[17px] font-bold leading-tight">E aí, Davi</p>
        <p className="text-xs text-white/60">Pronto pra jogar?</p>
      </div>
      <Link to="/perfil" className="rounded-full bg-black/40 px-3 py-1.5 text-right ring-1 ring-white/10 backdrop-blur">
        <p className="text-[9px] uppercase tracking-wider text-white/50">Saldo demo</p>
        <p className="text-sm font-bold">{wallet.data ? <AnimatedNumber value={wallet.data.balance} format={formatBRL} /> : "—"}</p>
      </Link>
      <button className="relative grid size-10 place-items-center rounded-full bg-black/30" aria-label="Notificações">
        <Bell className="size-5" />
        <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-brand ring-2 ring-[#1c120d]" />
      </button>
    </div>
  );
}
