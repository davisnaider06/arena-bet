import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Radio } from "lucide-react";
import { api, qk } from "@/lib/api";
import { FeaturedCard } from "@/components/MatchCards";
import { EmptyState, ErrorState, LiveDot, Skeleton } from "@/components/ui";
import { useConnection } from "@/lib/socket";
import { Page, PageHeader, item, stagger } from "./Page";

export function LivePage() {
  const q = useQuery({ queryKey: qk.matches(""), queryFn: () => api.matches() });
  const live = (q.data ?? []).filter((m) => m.status === "live");
  const conn = useConnection();

  return (
    <Page>
      <PageHeader
        title="Ao vivo"
        subtitle="Odds e placares atualizam sozinhos"
        right={
          <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-[11px]">
            {conn.status === "connected" ? <><LiveDot className="bg-win" /> Conectado</> : <><LiveDot className="bg-brand-2" /> Reconectando</>}
          </span>
        }
      />
      <div className="px-4 pb-40 pt-2">
        {q.isError ? (
          <ErrorState message="Não deu para carregar os jogos ao vivo." onRetry={() => q.refetch()} />
        ) : q.isPending ? (
          <div className="space-y-3"><Skeleton className="h-60" /><Skeleton className="h-60" /></div>
        ) : live.length === 0 ? (
          <EmptyState icon={Radio} title="Nenhum jogo ao vivo agora" body="Volte mais tarde ou veja os próximos jogos no início." />
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
            {live.map((m, i) => (
              <motion.div key={m.id} variants={item} layout>
                <FeaturedCard match={m} variant={i === 0 ? "brand" : "dark"} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Page>
  );
}
