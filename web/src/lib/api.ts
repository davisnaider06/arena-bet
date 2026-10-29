import axios, { AxiosError } from "axios";
import type { ApiErrorBody, Bet, Match, Team, Wallet } from "./types";

import { DEMO } from "./socket";

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
export const http = axios.create({ baseURL: `${API_URL ?? ""}/api`, timeout: 8000 });
if (DEMO) http.defaults.adapter = (await import("./demo")).demoAdapter;

/** Converte qualquer erro do Axios numa mensagem que dá pra mostrar ao usuário. */
export function errorBody(err: unknown): ApiErrorBody {
  if (err instanceof AxiosError) {
    if (err.response?.data && typeof err.response.data === "object") return err.response.data as ApiErrorBody;
    if (err.code === "ECONNABORTED") return { code: "TIMEOUT", message: "O servidor demorou para responder." };
    return { code: "NETWORK", message: "Sem conexão com o servidor." };
  }
  return { code: "UNKNOWN", message: "Algo deu errado." };
}

export const api = {
  matches: (q?: string) => http.get<Match[]>("/matches", { params: q ? { q } : undefined }).then((r) => r.data),
  match: (id: string) => http.get<Match>(`/matches/${id}`).then((r) => r.data),
  popularTeams: () => http.get<Team[]>("/teams/popular").then((r) => r.data),
  wallet: () => http.get<Wallet>("/wallet").then((r) => r.data),
  resetWallet: () => http.post<Wallet>("/wallet/reset").then((r) => r.data),
  bets: () => http.get<Bet[]>("/bets").then((r) => r.data),
  placeBet: (body: { stake: number; selections: Array<{ matchId: string; selectionId: string; odds: number }> }) =>
    http.post<Bet>("/bets", body).then((r) => r.data),
};

export const qk = {
  matches: (q = "") => ["matches", q] as const,
  match: (id: string) => ["match", id] as const,
  teams: ["teams", "popular"] as const,
  wallet: ["wallet"] as const,
  bets: ["bets"] as const,
};
