import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, PartyPopper, Trophy, XCircle } from "lucide-react";

type Kind = "success" | "error" | "info" | "goal" | "win";
interface Toast { id: number; kind: Kind; title: string; body?: string }

const Ctx = createContext<{ push: (t: Omit<Toast, "id">) => void } | null>(null);

const icons = { success: CheckCircle2, error: XCircle, info: Info, goal: PartyPopper, win: Trophy } as const;
const tint: Record<Kind, string> = {
  success: "text-win",
  error: "text-loss",
  info: "text-muted",
  goal: "text-brand-2",
  win: "text-win",
};

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = ++seq;
    setToasts((all) => [...all.slice(-2), { ...t, id }]);
    setTimeout(() => setToasts((all) => all.filter((x) => x.id !== id)), 3600);
  }, []);
  const value = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 sm:top-10 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const Icon = icons[t.kind];
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -24, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-white/10 bg-[#1d1d20]/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur"
              >
                <Icon className={`size-5 shrink-0 ${tint[t.kind]}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t.title}</p>
                  {t.body && <p className="truncate text-xs text-muted">{t.body}</p>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast fora do ToastProvider");
  return ctx;
}
