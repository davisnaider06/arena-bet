import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { socket } from "./socket";
import { qk } from "./api";
import type { Bet, Match, MatchUpdate, OddsUpdate, Wallet } from "./types";
import { useToast } from "@/state/toast";

function patchMatch(qc: QueryClient, id: string, patch: (m: Match) => Match) {
  qc.setQueriesData<Match[]>({ queryKey: ["matches"] }, (list) => list?.map((m) => (m.id === id ? patch(m) : m)));
  qc.setQueryData<Match>(qk.match(id), (m) => (m ? patch(m) : m));
}

/**
 * Liga os eventos do Socket.IO ao cache do TanStack Query.
 * O servidor empurra mudanças; o cache é a única fonte de verdade da tela.
 */
export function useLiveUpdates() {
  const qc = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    const onOdds = (u: OddsUpdate) => patchMatch(qc, u.id, (m) => ({ ...m, markets: u.markets }));
    const onMatch = (u: MatchUpdate) => {
      patchMatch(qc, u.id, (m) => ({ ...m, status: u.status, minute: u.minute, score: u.score }));
      if (u.goal) {
        const m = qc.getQueryData<Match[]>(qk.matches(""))?.find((x) => x.id === u.id);
        if (m) toast.push({ kind: "goal", title: `Gol do ${u.goal === "home" ? m.home.name : m.away.name}!`, body: `${m.home.short} ${u.score.home} x ${u.score.away} ${m.away.short} · ${u.minute}'` });
      }
    };
    const onWallet = (w: Wallet) => qc.setQueryData(qk.wallet, w);
    const onSettled = (bets: Bet[]) => {
      qc.invalidateQueries({ queryKey: qk.bets });
      for (const b of bets)
        toast.push(b.status === "won"
          ? { kind: "win", title: "Aposta ganha!", body: `Você recebeu ${b.potentialReturn.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}` }
          : { kind: "info", title: "Aposta encerrada", body: "Não foi dessa vez." });
    };
    // Ao reconectar, perdemos eventos que aconteceram offline: busca tudo de novo.
    const onReconnect = () => qc.invalidateQueries();

    socket.on("odds:update", onOdds);
    socket.on("match:update", onMatch);
    socket.on("wallet:update", onWallet);
    socket.on("bets:settled", onSettled);
    socket.io.on("reconnect", onReconnect);
    return () => {
      socket.off("odds:update", onOdds);
      socket.off("match:update", onMatch);
      socket.off("wallet:update", onWallet);
      socket.off("bets:settled", onSettled);
      socket.io.off("reconnect", onReconnect);
    };
  }, [qc, toast]);
}
