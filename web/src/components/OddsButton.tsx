import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, Lock } from "lucide-react";
import type { Market, Match, Selection } from "@/lib/types";
import { useBetSlip } from "@/state/betslip";
import { cn, formatOdds } from "@/lib/utils";

/**
 * Botão de odd. Quando a odd muda pelo socket, pisca verde (subiu) ou vermelho (caiu)
 * e o número troca com animação. Selecionado = está no cupom.
 */
export function OddsButton({ match, market, selection, compact, tone = "dark", shortLabel }: { match: Match; market: Market; selection: Selection; compact?: boolean; tone?: "dark" | "light"; shortLabel?: string }) {
  const { state, dispatch } = useBetSlip();
  const selected = state.items.some((i) => i.selectionId === selection.id);
  const prev = useRef(selection.odds);
  const [dir, setDir] = useState<"up" | "down" | null>(null);
  const locked = match.status === "finished";

  useEffect(() => {
    if (selection.odds === prev.current) return;
    setDir(selection.odds > prev.current ? "up" : "down");
    prev.current = selection.odds;
    const t = setTimeout(() => setDir(null), 1400);
    return () => clearTimeout(t);
  }, [selection.odds]);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (locked) return;
    dispatch({
      type: "toggle",
      item: { matchId: match.id, selectionId: selection.id, odds: selection.odds, label: selection.label, marketName: market.name, matchLabel: `${match.home.name} x ${match.away.name}` },
    });
  };

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      disabled={locked}
      aria-pressed={selected}
      aria-label={`${selection.label}, odd ${formatOdds(selection.odds)}`}
      className={cn(
        "relative flex flex-1 items-center justify-between gap-1 overflow-hidden rounded-xl px-2.5 text-left transition-colors",
        compact ? "h-10" : "h-12",
        tone === "light" ? "bg-black/25 hover:bg-black/35" : "bg-surface-2 hover:bg-[#303036]",
        selected && "bg-white text-black hover:bg-white",
        locked && "opacity-50",
      )}
    >
      <AnimatePresence>
        {dir && !selected && (
          <motion.span
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
            className={cn("absolute inset-0", dir === "up" ? "bg-win/35" : "bg-loss/35")}
          />
        )}
      </AnimatePresence>
      <span className={cn("relative truncate text-[11px] font-medium", selected ? "text-black/60" : "text-white/60")}>{shortLabel ?? selection.label}</span>
      <span className="relative flex items-center gap-0.5 text-sm font-bold tabular-nums">
        {locked ? <Lock className="size-3.5" /> : (
          <>
            {dir === "up" && <ArrowUp className="size-3 text-win" />}
            {dir === "down" && <ArrowDown className="size-3 text-loss" />}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={selection.odds}
                initial={{ y: dir === "down" ? -12 : 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: dir === "down" ? 12 : -12, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              >
                {formatOdds(selection.odds)}
              </motion.span>
            </AnimatePresence>
          </>
        )}
      </span>
    </motion.button>
  );
}

export function OddsRow({ match, tone, compact }: { match: Match; tone?: "dark" | "light"; compact?: boolean }) {
  const market = match.markets[0];
  // Nos cards, o 1x2 usa a sigla do time para não truncar em telas pequenas.
  const short = (id: string) => (id.endsWith("home") ? match.home.short : id.endsWith("away") ? match.away.short : "X");
  return (
    <div className="flex gap-2">
      {market.selections.map((s) => (
        <OddsButton key={s.id} match={match} market={market} selection={s} tone={tone} compact={compact} shortLabel={short(s.id)} />
      ))}
    </div>
  );
}
