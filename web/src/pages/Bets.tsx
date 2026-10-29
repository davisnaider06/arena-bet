import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Receipt } from "lucide-react";
import { api, qk } from "@/lib/api";
import type { Bet } from "@/lib/types";
import { cn, formatBRL, formatOdds } from "@/lib/utils";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { Page, PageHeader } from "./Page";

const tabs = [
  { id: "open", label: "Abertas" },
  { id: "done", label: "Finalizadas" },
] as const;

export function BetsPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("open");
  const q = useQuery({ queryKey: qk.bets, queryFn: api.bets });
  const list = (q.data ?? []).filter((b) => (tab === "open" ? b.status === "open" : b.status !== "open"));

  return (
    <Page>
      <PageHeader title="Minhas apostas" subtitle="Liquidadas automaticamente ao fim da partida" />
      <div className="px-4">
        <div className="relative flex rounded-2xl bg-surface p-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className="relative h-10 flex-1 text-sm font-semibold">
              {tab === t.id && <motion.span layoutId="bets-tab" className="absolute inset-0 rounded-xl bg-surface-2" transition={{ type: "spring", stiffness: 500, damping: 36 }} />}
              <span className={cn("relative", tab === t.id ? "text-white" : "text-muted")}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="px-4 pb-40 pt-4">
        {q.isError ? (
          <ErrorState message="Não deu para carregar suas apostas." onRetry={() => q.refetch()} />
        ) : q.isPending ? (
          <div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>
        ) : list.length === 0 ? (
          <EmptyState icon={Receipt} title={tab === "open" ? "Nenhuma aposta aberta" : "Nada finalizado ainda"}
            body={tab === "open" ? "Toque numa odd para montar seu cupom." : "Quando uma partida terminar, a aposta aparece aqui."}
            action={tab === "open" ? <Link to="/ao-vivo" className="text-sm font-semibold text-brand-2">Ver jogos ao vivo</Link> : undefined} />
        ) : (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {list.map((b) => <BetCard key={b.id} bet={b} />)}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </Page>
  );
}

function BetCard({ bet }: { bet: Bet }) {
  const color = bet.status === "won" ? "text-win" : bet.status === "lost" ? "text-loss" : "text-brand-2";
  const label = bet.status === "won" ? "Ganha" : bet.status === "lost" ? "Perdida" : "Em aberto";
  return (
    <motion.li layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
      className="rounded-3xl border border-white/5 bg-surface p-4">
      <div className="flex items-center justify-between text-xs">
        <span className={cn("rounded-full bg-white/5 px-2.5 py-1 font-semibold", color)}>{label}</span>
        <span className="text-muted">{new Date(bet.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      <ul className="mt-3 space-y-2">
        {bet.selections.map((s) => (
          <li key={s.selectionId} className="flex justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-semibold">{s.label} <span className="font-normal text-muted">· {s.marketName}</span></p>
              <p className="truncate text-[11px] text-muted">{s.matchLabel}</p>
            </div>
            <span className="font-bold tabular-nums">{formatOdds(s.odds)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-between border-t border-white/5 pt-3 text-sm">
        <span className="text-muted">Aposta <span className="text-white">{formatBRL(bet.stake)}</span> · odd {formatOdds(bet.totalOdds)}</span>
        <span className={cn("font-bold", bet.status === "lost" ? "text-muted line-through" : "text-win")}>{formatBRL(bet.potentialReturn)}</span>
      </div>
    </motion.li>
  );
}
