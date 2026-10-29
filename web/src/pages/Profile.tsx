import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { RotateCcw, ShieldCheck, Wallet as WalletIcon } from "lucide-react";
import { api, qk } from "@/lib/api";
import { formatBRL } from "@/lib/utils";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { Button, Skeleton } from "@/components/ui";
import { useToast } from "@/state/toast";
import { useConnection } from "@/lib/socket";
import { Page, PageHeader, item, stagger } from "./Page";

export function ProfilePage() {
  const qc = useQueryClient();
  const toast = useToast();
  const wallet = useQuery({ queryKey: qk.wallet, queryFn: api.wallet });
  const bets = useQuery({ queryKey: qk.bets, queryFn: api.bets });
  const conn = useConnection();
  const reset = useMutation({
    mutationFn: api.resetWallet,
    onSuccess: (w) => {
      qc.setQueryData(qk.wallet, w);
      toast.push({ kind: "success", title: "Saldo demo restaurado", body: formatBRL(w.balance) });
    },
    onError: () => toast.push({ kind: "error", title: "Não deu para restaurar o saldo" }),
  });

  const all = bets.data ?? [];
  const won = all.filter((b) => b.status === "won").length;
  const done = all.filter((b) => b.status !== "open").length;

  return (
    <Page>
      <PageHeader title="Perfil" />
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 px-4 pb-40 pt-2">
        <motion.section variants={item} className="brand-gradient relative overflow-hidden rounded-3xl p-5 shadow-xl shadow-brand/30">
          <div className="pointer-events-none absolute -right-8 -top-10 size-40 rounded-full bg-white/15 blur-2xl" />
          <p className="flex items-center gap-1.5 text-xs text-white/80"><WalletIcon className="size-4" /> Saldo demo</p>
          <p className="mt-1 text-4xl font-black">{wallet.data ? <AnimatedNumber value={wallet.data.balance} format={formatBRL} /> : <Skeleton className="h-10 w-40 bg-white/20" />}</p>
          <Button variant="dark" size="sm" className="mt-4" onClick={() => reset.mutate()} disabled={reset.isPending}>
            <RotateCcw className="size-3.5" /> Restaurar R$ 1.000
          </Button>
        </motion.section>

        <motion.section variants={item} className="grid grid-cols-3 gap-2">
          {[{ k: "Apostas", v: all.length }, { k: "Ganhas", v: won }, { k: "Acerto", v: done ? `${Math.round((won / done) * 100)}%` : "—" }].map((s) => (
            <div key={s.k} className="rounded-2xl bg-surface p-3 text-center">
              <p className="text-xl font-extrabold tabular-nums">{s.v}</p>
              <p className="text-[11px] text-muted">{s.k}</p>
            </div>
          ))}
        </motion.section>

        <motion.section variants={item} className="rounded-3xl bg-surface p-4 text-sm">
          <div className="flex justify-between"><span className="text-muted">Tempo real</span><span>{conn.status === "connected" ? "Conectado" : "Reconectando…"}</span></div>
        </motion.section>

        <motion.section variants={item} className="flex gap-3 rounded-3xl border border-white/5 p-4 text-xs text-muted">
          <ShieldCheck className="size-5 shrink-0 text-win" />
          <p>Projeto de portfólio. Tudo aqui usa dinheiro fictício e times inventados. Nenhum valor real é depositado, apostado ou sacado.</p>
        </motion.section>
      </motion.div>
    </Page>
  );
}
