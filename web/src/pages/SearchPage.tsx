import { useDeferredValue, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Search, SearchX, X } from "lucide-react";
import { api, qk } from "@/lib/api";
import { MatchCard } from "@/components/MatchCards";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui";
import { Page, PageHeader } from "./Page";

export function SearchPage() {
  const [text, setText] = useState("");
  const term = useDeferredValue(text.trim());
  // keepPreviousData: a lista anterior fica na tela enquanto a nova busca carrega.
  const q = useQuery({ queryKey: qk.matches(term), queryFn: () => api.matches(term), placeholderData: keepPreviousData, enabled: term.length >= 2 });

  return (
    <Page>
      <PageHeader title="Buscar" subtitle="Times, ligas e jogos" />
      <div className="px-4">
        <label className="flex h-12 items-center gap-3 rounded-2xl bg-surface px-4 ring-1 ring-transparent focus-within:ring-brand/70">
          <Search className="size-5 text-muted" />
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Spartans, Liga Noturna" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted" />
          {text && <button onClick={() => setText("")} aria-label="Limpar"><X className="size-4 text-muted" /></button>}
        </label>
        {q.isFetching && <motion.div className="brand-gradient mt-2 h-0.5 rounded-full" initial={{ width: "0%" }} animate={{ width: "90%" }} transition={{ duration: 0.8 }} />}
      </div>
      <div className="px-4 pb-40 pt-4">
        {term.length < 2 ? (
          <p className="pt-6 text-center text-sm text-muted">Digite pelo menos 2 letras.</p>
        ) : q.isError ? (
          <ErrorState message="A busca falhou." onRetry={() => q.refetch()} />
        ) : q.isPending ? (
          <div className="space-y-3"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
        ) : q.data.length === 0 ? (
          <EmptyState icon={SearchX} title={`Nada encontrado para "${term}"`} body="Confira a grafia ou tente o nome da liga." />
        ) : (
          <div className="space-y-3" style={{ opacity: q.isPlaceholderData ? 0.6 : 1 }}>
            {q.data.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </div>
    </Page>
  );
}
