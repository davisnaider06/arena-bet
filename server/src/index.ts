import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { Server } from "socket.io";
import { type Bet, BetError, type Match, type Wallet, placeBet, roundOdds, settleBets } from "./domain.js";
import { popularTeams, seedMatches } from "./seed.js";

const PORT = Number(process.env.PORT ?? 3001);
const TICK_MS = Number(process.env.TICK_MS ?? 2500);

const matches = seedMatches();
const wallet: Wallet = { balance: 1000, currency: "BRL" };
const bets: Bet[] = [];

const app = express();
app.use(cors());
app.use(express.json());

// Latência artificial para o front mostrar estados de carregamento de verdade.
app.use((_req, _res, next) => setTimeout(next, 200 + Math.random() * 400));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/matches", (req, res) => {
  const q = String(req.query.q ?? "").trim().toLowerCase();
  let list = [...matches.values()];
  if (q) list = list.filter((m) => `${m.home.name} ${m.away.name} ${m.league}`.toLowerCase().includes(q));
  res.json(list.sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
});
app.get("/api/matches/:id", (req, res) => {
  const match = matches.get(req.params.id);
  if (!match) return res.status(404).json({ code: "NOT_FOUND", message: "Partida não encontrada." });
  res.json(match);
});
app.get("/api/teams/popular", (_req, res) => res.json(popularTeams));
app.get("/api/wallet", (_req, res) => res.json(wallet));
app.post("/api/wallet/reset", (_req, res) => {
  wallet.balance = 1000;
  io.emit("wallet:update", wallet);
  res.json(wallet);
});
app.get("/api/bets", (_req, res) => res.json([...bets].reverse()));
app.post("/api/bets", (req, res) => {
  const bet = placeBet(matches, wallet, req.body ?? {}, new Date(), randomUUID());
  bets.push(bet);
  io.emit("wallet:update", wallet);
  res.status(201).json(bet);
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof BetError) {
    const status = err.code === "ODDS_CHANGED" ? 409 : err.code === "NOT_FOUND" ? 404 : 422;
    return res.status(status).json({ code: err.code, message: err.message, details: err.details });
  }
  console.error(err);
  res.status(500).json({ code: "INTERNAL", message: "Erro interno." });
});

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.emit("hello", { serverTime: new Date().toISOString() });
});

// ---------- Simulação ao vivo ----------
const jitter = (odds: number, amount = 0.06) => roundOdds(odds * (1 + (Math.random() - 0.5) * amount));

function recalc1x2(m: Match) {
  const market = m.markets[0];
  const diff = m.score.home - m.score.away;
  const progress = Math.min(m.minute / (m.sport === "futsal" ? 40 : 90), 1);
  const base = { home: 2.4 - diff * 0.9 * (0.5 + progress), draw: 3.1 - (diff === 0 ? progress * 1.6 : -Math.abs(diff) * progress * 2), away: 2.8 + diff * 0.9 * (0.5 + progress) };
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
        io.emit("match:update", { id: m.id, status: m.status, minute: m.minute, score: m.score });
        const settled = settleBets(bets, matches, wallet);
        if (settled.length) {
          io.emit("bets:settled", settled);
          io.emit("wallet:update", wallet);
        }
        // Reinicia depois de um tempo, para a demo nunca acabar.
        setTimeout(() => {
          m.status = "live";
          m.minute = 0;
          m.score = { home: 0, away: 0 };
          recalc1x2(m);
          io.emit("match:update", { id: m.id, status: m.status, minute: m.minute, score: m.score });
          io.emit("odds:update", { id: m.id, markets: m.markets });
        }, 20_000);
        continue;
      }
      recalc1x2(m);
      for (const market of m.markets.slice(1)) for (const s of market.selections) if (Math.random() < 0.3) s.odds = jitter(s.odds, 0.08);
      io.emit("match:update", { id: m.id, status: m.status, minute: m.minute, score: m.score, goal });
      io.emit("odds:update", { id: m.id, markets: m.markets });
    } else if (m.status === "upcoming" && Math.random() < 0.15) {
      const market = m.markets[Math.floor(Math.random() * m.markets.length)];
      for (const s of market.selections) s.odds = jitter(s.odds, 0.04);
      io.emit("odds:update", { id: m.id, markets: m.markets });
    }
  }
}

setInterval(tick, TICK_MS);

httpServer.listen(PORT, () => console.log(`Arena API em http://localhost:${PORT}`));
