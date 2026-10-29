// Modo demo (deploy estático na Vercel): o mesmo motor do servidor roda no navegador.
// O front continua falando Axios + "socket"; só a ponta do transporte muda.
import { AxiosError, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { createEngine } from "../../../server/src/engine";
import { BetError } from "../../../server/src/domain";

type Handler = (payload: never) => void;

/** Imitação mínima da interface do Socket.IO client que o app usa. */
class DemoSocket {
  connected = true;
  private handlers = new Map<string, Set<Handler>>();
  private ioHandlers = new Map<string, Set<Handler>>();
  io = {
    on: (ev: string, fn: Handler) => void this.add(this.ioHandlers, ev, fn),
    off: (ev: string, fn: Handler) => void this.ioHandlers.get(ev)?.delete(fn),
  };
  private add(map: Map<string, Set<Handler>>, ev: string, fn: Handler) {
    if (!map.has(ev)) map.set(ev, new Set());
    map.get(ev)!.add(fn);
    return this;
  }
  on(ev: string, fn: Handler) { return this.add(this.handlers, ev, fn); }
  off(ev: string, fn: Handler) { this.handlers.get(ev)?.delete(fn); return this; }
  connect() { return this; }
  dispatch(ev: string, payload: unknown) {
    // structuredClone imita a serialização da rede: o front nunca recebe a referência do motor.
    const copy = structuredClone(payload) as never;
    this.handlers.get(ev)?.forEach((fn) => fn(copy));
  }
}

export const demoSocket = new DemoSocket();
const engine = createEngine((ev, p) => demoSocket.dispatch(ev, p), { newId: () => crypto.randomUUID() });
setInterval(engine.tick, 2500);

const latency = () => new Promise((r) => setTimeout(r, 200 + Math.random() * 400));

export const demoAdapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
  await latency();
  const method = (config.method ?? "get").toLowerCase();
  const url = (config.url ?? "").replace(/^\/+/, "");
  const ok = (data: unknown, status = 200): AxiosResponse => ({ data: structuredClone(data), status, statusText: "OK", headers: {}, config });
  const fail = (status: number, body: unknown) => {
    const response: AxiosResponse = { data: body, status, statusText: "", headers: {}, config };
    throw new AxiosError(String((body as { message?: string }).message), String(status), config, null, response);
  };
  const { api } = engine;

  try {
    if (method === "get" && url === "matches") return ok(api.listMatches(String(config.params?.q ?? "")));
    const m = url.match(/^matches\/([^/]+)$/);
    if (method === "get" && m) {
      const match = api.getMatch(m[1]);
      return match ? ok(match) : fail(404, { code: "NOT_FOUND", message: "Partida não encontrada." });
    }
    if (method === "get" && url === "teams/popular") return ok(api.popularTeams());
    if (method === "get" && url === "wallet") return ok(api.getWallet());
    if (method === "post" && url === "wallet/reset") return ok(api.resetWallet());
    if (method === "get" && url === "bets") return ok(api.listBets());
    if (method === "post" && url === "bets") {
      const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
      return ok(api.placeBet(body), 201);
    }
    return fail(404, { code: "NOT_FOUND", message: "Rota não encontrada." });
  } catch (e) {
    if (e instanceof BetError) {
      const status = e.code === "ODDS_CHANGED" ? 409 : e.code === "NOT_FOUND" ? 404 : 422;
      return fail(status, { code: e.code, message: e.message, details: e.details });
    }
    throw e;
  }
};
