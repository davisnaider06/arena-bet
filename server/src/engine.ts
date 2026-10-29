// Motor da simulação ao vivo, sem I/O. Quem usa decide como emitir os eventos:
// o servidor emite por Socket.IO; a demo estática da Vercel emite dentro do navegador.
import { type Bet, type Match, type Wallet, placeBet, roundOdds, settleBets } from "./domain.js";
import { popularTeams, seedMatches } from "./seed.js";

export type Emit = (event: string, payload: unknown) => void;

export function createEngine(emit: Emit, opts: { newId: () => string; restartDelayMs?: number } ) {
  const matches = seedMatches();
  const wallet: Wallet = { balance: 1000, currency: "BRL" };
  const bets: Bet[] = [];
  const restartDelay = opts.restartDelayMs ?? 20_000;

  const jitter = (odds: number, amount = 0.06) => roundOdds(odds * (1 + (Math.random() - 0.5) * amount));

  function recalc1x2(m: Match) {
    const market = m.markets[0];
    const diff = m.score.home - m.score.away;
    const progress = Math.min(m.minute / (m.sport === "futsal" ? 40 : 90), 1);
    const base = {
      home: 2.4 - diff * 0.9 * (0.5 + progress),
      draw: 3.1 - (diff === 0 ? progress * 1.6 : -Math.abs(diff) * progress * 2),
      away: 2.8 + diff * 0.9 * (0.5 + progress),
    };
    for (const s of market.selections) {
      const key = s.id.endsWith("home") ? "home" : s.id.endsWith("draw") ? "draw" : "away";
      s.odds = jitter(Math.max(1.05, base[key]));
    }
  }

  function tick() {
    for (const m of matches.values()) {
      if (m.status === "live") {
        const duration = m.sport === "futsal" ? 40 : 90;
        m.minute += 1;
        let goal: "home" | "away" | null = null;
        if (Math.random() < 0.05) {
          goal = Math.random() < 0.52 ? "home" : "away";
          m.score[goal] += 1;
        }
        if (m.minute >= duration) {
          m.status = "finished";
          emit("match:update", { id: m.id, status: m.status, minute: m.minute, score: m.score });
          const settled = settleBets(bets, matches, wallet);
          if (settled.length) {
            emit("bets:settled", settled);
            emit("wallet:update", wallet);
          }
          // Reinicia depois de um tempo, para a demo nunca acabar.
          setTimeout(() => {
            m.status = "live";
            m.minute = 0;
            m.score = { home: 0, away: 0 };
            recalc1x2(m);
            emit("match:update", { id: m.id, status: m.status, minute: m.minute, score: m.score });
            emit("odds:update", { id: m.id, markets: m.markets });
          }, restartDelay);
          continue;
        }
        recalc1x2(m);
        for (const market of m.markets.slice(1))
          for (const s of market.selections) if (Math.random() < 0.3) s.odds = jitter(s.odds, 0.08);
        emit("match:update", { id: m.id, status: m.status, minute: m.minute, score: m.score, goal });
        emit("odds:update", { id: m.id, markets: m.markets });
      } else if (m.status === "upcoming" && Math.random() < 0.15) {
        const market = m.markets[Math.floor(Math.random() * m.markets.length)];
        for (const s of market.selections) s.odds = jitter(s.odds, 0.04);
        emit("odds:update", { id: m.id, markets: m.markets });
      }
    }
  }

  // Casos de uso que a API expõe. Lançam BetError quando a regra recusa.
  const api = {
    listMatches(q = "") {
      const term = q.trim().toLowerCase();
      let list = [...matches.values()];
      if (term) list = list.filter((m) => `${m.home.name} ${m.away.name} ${m.league}`.toLowerCase().includes(term));
      return list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    },
    getMatch: (id: string) => matches.get(id) ?? null,
    popularTeams: () => popularTeams,
    getWallet: () => wallet,
    resetWallet() {
      wallet.balance = 1000;
      emit("wallet:update", wallet);
      return wallet;
    },
    listBets: () => [...bets].reverse(),
    placeBet(body: unknown) {
      const bet = placeBet(matches, wallet, (body ?? {}) as Parameters<typeof placeBet>[2], new Date(), opts.newId());
      bets.push(bet);
      emit("wallet:update", wallet);
      return bet;
    },
  };

  return { tick, api };
}

export type Engine = ReturnType<typeof createEngine>;
