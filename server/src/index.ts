import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { Server } from "socket.io";
import { BetError } from "./domain.js";
import { createEngine } from "./engine.js";

const PORT = Number(process.env.PORT ?? 3001);
const TICK_MS = Number(process.env.TICK_MS ?? 2500);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });
const engine = createEngine((event, payload) => io.emit(event, payload), { newId: randomUUID });
const { api } = engine;

app.use(cors());
app.use(express.json());

// Latência artificial para o front mostrar estados de carregamento de verdade.
app.use((_req, _res, next) => setTimeout(next, 200 + Math.random() * 400));

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/matches", (req, res) => res.json(api.listMatches(String(req.query.q ?? ""))));
app.get("/api/matches/:id", (req, res) => {
  const match = api.getMatch(req.params.id);
  if (!match) return res.status(404).json({ code: "NOT_FOUND", message: "Partida não encontrada." });
  res.json(match);
});
app.get("/api/teams/popular", (_req, res) => res.json(api.popularTeams()));
app.get("/api/wallet", (_req, res) => res.json(api.getWallet()));
app.post("/api/wallet/reset", (_req, res) => res.json(api.resetWallet()));
app.get("/api/bets", (_req, res) => res.json(api.listBets()));
app.post("/api/bets", (req, res) => res.status(201).json(api.placeBet(req.body)));

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof BetError) {
    const status = err.code === "ODDS_CHANGED" ? 409 : err.code === "NOT_FOUND" ? 404 : 422;
    return res.status(status).json({ code: err.code, message: err.message, details: err.details });
  }
  console.error(err);
  res.status(500).json({ code: "INTERNAL", message: "Erro interno." });
});

io.on("connection", (socket) => socket.emit("hello", { serverTime: new Date().toISOString() }));

setInterval(engine.tick, TICK_MS);

httpServer.listen(PORT, () => console.log(`Arena API em http://localhost:${PORT}`));
