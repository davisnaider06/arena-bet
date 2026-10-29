import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Check, ChevronUp, RefreshCw, Trash2, X } from "lucide-react";
import { api, errorBody, qk } from "@/lib/api";
import { useBetSlip } from "@/state/betslip";
import { useToast } from "@/state/toast";
import { cn, formatBRL, formatOdds } from "@/lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";
import { Button } from "./ui";

const QUICK = [10, 25, 50, 100];

/** Odds atuais de cada seleção, lidas do cache que o socket mantém atualizado. */
function useCurrentOdds() {
  const { data } = useQuery({ queryKey: qk.matches(""), queryFn: () => api.matches() });
  return useMemo(() => {
    const map: Record<string, number> = {};
    for (const m of data ?? []) for (const mk of m.markets) for (const s of mk.selections) map[s.id] = s.odds;
    return map;
  }, [data]);
}

export function BetSlip() {
  const { state, dispatch } = useBetSlip();
  const count = state.items.length;
  const current = useCurrentOdds();
  const totalOdds = state.items.reduce((acc, i) => acc * (current[i.selectionId] ?? i.odds), 1);

  return (
    <>
      {/* Pílula flutuante acima da navegação */}
      <AnimatePresence>
        {count > 0 && !state.open && (
          <motion.button
            initial={{ y: 80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => dispatch({ type: "open", open: true })}
            className="brand-gradient absolute inset-x-4 bottom-[92px] z-30 flex h-14 items-center gap-3 rounded-2xl px-4 shadow-2xl shadow-brand/40"
          >
            <motion.span key={count} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="grid size-8 place-items-center rounded-full bg-black/85 text-sm font-bold">
              {count}
            </motion.span>
            <span className="flex-1 text-left">
              <span className="block text-sm font-bold">{count === 1 ? "Aposta simples" : `Múltipla · ${count} seleções`}</span>
              <span className="block text-[11px] text-white/80">Odd total {formatOdds(totalOdds)}</span>
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold">Cupom <ChevronUp className="size-4" /></span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>{state.open && <Sheet current={current} />}</AnimatePresence>
    </>
  );
}

function Sheet({ current }: { current: Record<string, number> }) {
  const { state, dispatch } = useBetSlip();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: wallet } = useQuery({ queryKey: qk.wallet, queryFn: api.wallet });
  const [stake, setStake] = useState(10);
  const [done, setDone] = useState(false);
  // Em jogo ao vivo a odd muda a cada poucos segundos. Com isto ligado, o cupom segue a odd atual.
  const [autoAccept, setAutoAccept] = useState(true);

  const oddsOf = (i: { selectionId: string; odds: number }) => (autoAccept ? current[i.selectionId] ?? i.odds : i.odds);
  const changed = autoAccept ? [] : state.items.filter((i) => current[i.selectionId] !== undefined && current[i.selectionId] !== i.odds);
  const totalOdds = state.items.reduce((acc, i) => acc * oddsOf(i), 1);
  const potential = stake * totalOdds;
  const balance = wallet?.balance ?? 0;
  const stakeError = stake < 1 ? "Mínimo de R$ 1,00" : stake > balance ? "Saldo insuficiente" : null;

  const place = useMutation({
    mutationFn: () => api.placeBet({ stake, selections: state.items.map((i) => ({ matchId: i.matchId, selectionId: i.selectionId, odds: oddsOf(i) })) }),
    onSuccess: (bet) => {
      qc.setQueryData(qk.bets, (old: unknown) => (Array.isArray(old) ? [bet, ...old] : [bet]));
      setDone(true);
      toast.push({ kind: "success", title: "Aposta feita!", body: `Retorno potencial ${formatBRL(bet.potentialReturn)}` });
      setTimeout(() => dispatch({ type: "clear" }), 1300);
    },
  });
  const err = place.error ? errorBody(place.error) : null;
  const close = () => dispatch({ type: "open", open: false });
  const acceptChanges = () => {
    dispatch({ type: "accept", odds: current });
    place.reset();
  };

  return (
    <>
      <motion.div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
      <motion.section
        role="dialog"
        aria-label="Cupom de apostas"
        className="absolute inset-x-0 bottom-0 z-50 max-h-[86%] overflow-hidden rounded-t-[32px] border-t border-white/10 bg-[#141416]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 36 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => (info.offset.y > 110 || info.velocity.y > 600) && close()}
      >
        <div className="mx-auto mt-3 h-1.5 w-11 rounded-full bg-white/20" />
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 px-6 pb-16 pt-12">
              <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 14 }}
                className="grid size-20 place-items-center rounded-full bg-win text-black shadow-xl shadow-win/40">
                <Check className="size-10" strokeWidth={3} />
              </motion.div>
              <p className="text-lg font-bold">Aposta confirmada</p>
              <p className="text-sm text-muted">Acompanhe em Apostas</p>
            </motion.div>
          ) : (
            <motion.div key="form" exit={{ opacity: 0 }} className="flex max-h-[80vh] flex-col">
              <header className="flex items-center justify-between px-5 pb-2 pt-3">
                <div>
                  <h2 className="text-lg font-extrabold">Cupom</h2>
                  <p className="text-xs text-muted">{state.items.length === 1 ? "Aposta simples" : `Múltipla com ${state.items.length} seleções`}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => dispatch({ type: "clear" })} className="grid size-9 place-items-center rounded-full bg-white/5 text-muted hover:text-white" aria-label="Limpar cupom"><Trash2 className="size-4" /></button>
                  <button onClick={close} className="grid size-9 place-items-center rounded-full bg-white/5" aria-label="Fechar"><X className="size-4" /></button>
                </div>
              </header>

              <ul className="no-scrollbar flex-1 space-y-2 overflow-y-auto px-5 py-2">
                <AnimatePresence initial={false}>
                  {state.items.map((i) => {
                    const now = current[i.selectionId] ?? i.odds;
                    const diff = !autoAccept && now !== i.odds;
                    return (
                      <motion.li key={i.selectionId} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}
                        className={cn("flex items-center gap-3 rounded-2xl bg-surface p-3", diff && "ring-1 ring-brand-2/60")}>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{i.label}</p>
                          <p className="truncate text-[11px] text-muted">{i.marketName} · {i.matchLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold tabular-nums">{formatOdds(oddsOf(i))}</p>
                          {diff && <p className={cn("text-[10px] font-semibold tabular-nums", now > i.odds ? "text-win" : "text-loss")}>agora {formatOdds(now)}</p>}
                        </div>
                        <button onClick={() => dispatch({ type: "remove", selectionId: i.selectionId })} className="text-muted hover:text-white" aria-label="Remover"><X className="size-4" /></button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>

              <div className="space-y-3 border-t border-white/5 px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-4">
                <AnimatePresence>
                  {(changed.length > 0 || err?.code === "ODDS_CHANGED") && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 overflow-hidden rounded-2xl bg-brand/12 px-3 py-2.5 text-xs text-brand-2">
                      <RefreshCw className="size-4 shrink-0" />
                      <span className="flex-1">As odds mudaram enquanto você montava o cupom.</span>
                      <button onClick={acceptChanges} className="font-bold text-white">Aceitar</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <div className="mb-1.5 flex justify-between text-xs text-muted">
                    <label htmlFor="stake">Valor da aposta</label>
                    <span>Saldo <span className="tabular-nums text-white">{formatBRL(balance)}</span></span>
                  </div>
                  <div className={cn("flex h-13 items-center rounded-2xl bg-surface px-4 ring-1 ring-transparent focus-within:ring-brand/70", stakeError && "ring-loss/60")}>
                    <span className="text-muted">R$</span>
                    <input id="stake" type="number" inputMode="decimal" min={1} step={1} value={Number.isNaN(stake) ? "" : stake}
                      onChange={(e) => setStake(e.target.valueAsNumber)}
                      className="ml-2 w-full bg-transparent text-lg font-bold tabular-nums outline-none" />
                  </div>
                  <div className="mt-2 flex gap-2">
                    {QUICK.map((v) => (
                      <motion.button key={v} whileTap={{ scale: 0.92 }} onClick={() => setStake((s) => (Number.isNaN(s) ? v : s + v))}
                        className="h-9 flex-1 rounded-xl bg-white/5 text-xs font-semibold hover:bg-white/10">+{v}</motion.button>
                    ))}
                  </div>
                  {stakeError && <p className="mt-1.5 text-xs text-loss">{stakeError}</p>}
                </div>

                <label className="flex cursor-pointer items-center justify-between text-xs text-muted">
                  Aceitar mudanças de odd automaticamente
                  <button type="button" role="switch" aria-checked={autoAccept} onClick={() => { setAutoAccept((v) => !v); dispatch({ type: "accept", odds: current }); }}
                    className={cn("relative h-6 w-11 rounded-full transition-colors", autoAccept ? "bg-brand" : "bg-surface-2")}>
                    <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 34 }}
                      className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow", autoAccept ? "right-0.5" : "left-0.5")} />
                  </button>
                </label>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted">Odd total</p>
                    <p className="font-bold tabular-nums">{formatOdds(totalOdds)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted">Retorno potencial</p>
                    <p className="text-xl font-extrabold text-win"><AnimatedNumber value={Number.isNaN(potential) ? 0 : potential} format={formatBRL} /></p>
                  </div>
                </div>

                {err && err.code !== "ODDS_CHANGED" && <p role="alert" className="text-xs text-loss">{err.message}</p>}

                <Button variant="brand" size="lg" className="w-full" disabled={!!stakeError || changed.length > 0 || place.isPending || Number.isNaN(stake)} onClick={() => place.mutate()}>
                  {place.isPending ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}><RefreshCw className="size-5" /></motion.span>
                  ) : (
                    <>Apostar {Number.isNaN(stake) ? "" : formatBRL(stake)} <ArrowRight className="size-5" /></>
                  )}
                </Button>
                <p className="text-center text-[10px] text-muted">Demo com dinheiro fictício. Nenhum valor real é movimentado.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </>
  );
}
