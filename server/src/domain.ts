// Domínio do Arena: partidas, mercados, carteira e apostas.
// Tudo em memória: é um backend de demonstração para o front.

export type MatchStatus = "upcoming" | "live" | "finished";

export interface Team {
  name: string;
  short: string;
  color: string;
  accent: string;
}

export interface Selection {
  id: string;
  label: string;
  odds: number;
}

export interface Market {
  id: string;
  name: string;
  selections: Selection[];
}

export interface Match {
  id: string;
  sport: "futebol" | "basquete" | "futsal";
  league: string;
  venue: string;
  home: Team;
  away: Team;
  startsAt: string;
  status: MatchStatus;
  minute: number;
  score: { home: number; away: number };
  markets: Market[];
  featured: boolean;
}

export interface BetSelectionInput {
  matchId: string;
  selectionId: string;
  odds: number;
}

export type BetStatus = "open" | "won" | "lost";

export interface Bet {
  id: string;
  createdAt: string;
  stake: number;
  totalOdds: number;
  potentialReturn: number;
  status: BetStatus;
  selections: Array<BetSelectionInput & { label: string; matchLabel: string; marketName: string }>;
}

export interface Wallet {
  balance: number;
  currency: "BRL";
}

/** Arredonda odds para duas casas, nunca abaixo de 1.01. */
export function roundOdds(value: number): number {
  return Math.max(1.01, Math.round(value * 100) / 100);
}

export function findSelection(match: Match, selectionId: string) {
  for (const market of match.markets) {
    const selection = market.selections.find((s) => s.id === selectionId);
    if (selection) return { market, selection };
  }
  return null;
}

export class BetError extends Error {
  constructor(
    public code: "INVALID_STAKE" | "INSUFFICIENT_FUNDS" | "MATCH_CLOSED" | "NOT_FOUND" | "ODDS_CHANGED" | "DUPLICATE_MATCH" | "EMPTY",
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const MIN_STAKE = 1;
export const MAX_STAKE = 5000;

/**
 * Valida e cria uma aposta. Não altera nada se lançar erro.
 * Regra importante: se alguma odd mudou desde que o usuário montou o cupom,
 * a aposta é recusada com as odds atuais, para o front pedir confirmação.
 */
export function placeBet(
  matches: Map<string, Match>,
  wallet: Wallet,
  input: { selections: BetSelectionInput[]; stake: number },
  now: Date,
  id: string,
): Bet {
  const { selections, stake } = input;
  if (!Array.isArray(selections) || selections.length === 0) throw new BetError("EMPTY", "Cupom vazio.");
  if (!Number.isFinite(stake) || stake < MIN_STAKE || stake > MAX_STAKE)
    throw new BetError("INVALID_STAKE", `O valor precisa estar entre R$ ${MIN_STAKE} e R$ ${MAX_STAKE}.`);
  if (stake > wallet.balance) throw new BetError("INSUFFICIENT_FUNDS", "Saldo insuficiente.");

  const seen = new Set<string>();
  const changed: Array<{ selectionId: string; odds: number }> = [];
  const resolved: Bet["selections"] = [];

  for (const sel of selections) {
    if (seen.has(sel.matchId)) throw new BetError("DUPLICATE_MATCH", "Só uma seleção por partida na múltipla.");
    seen.add(sel.matchId);
    const match = matches.get(sel.matchId);
    if (!match) throw new BetError("NOT_FOUND", "Partida não encontrada.");
    if (match.status === "finished") throw new BetError("MATCH_CLOSED", `${match.home.name} x ${match.away.name} já terminou.`);
    const found = findSelection(match, sel.selectionId);
    if (!found) throw new BetError("NOT_FOUND", "Seleção não encontrada.");
    if (found.selection.odds !== sel.odds) changed.push({ selectionId: sel.selectionId, odds: found.selection.odds });
    resolved.push({
      ...sel,
      odds: found.selection.odds,
      label: found.selection.label,
      marketName: found.market.name,
      matchLabel: `${match.home.name} x ${match.away.name}`,
    });
  }

  if (changed.length > 0) throw new BetError("ODDS_CHANGED", "As odds mudaram. Confira antes de confirmar.", { changed });

  const totalOdds = roundOdds(resolved.reduce((acc, s) => acc * s.odds, 1));
  wallet.balance = Math.round((wallet.balance - stake) * 100) / 100;

  return {
    id,
    createdAt: now.toISOString(),
    stake,
    totalOdds,
    potentialReturn: Math.round(stake * totalOdds * 100) / 100,
    status: "open",
    selections: resolved,
  };
}

/** Resultado vencedor de cada mercado, dado o placar final. */
export function winningSelectionIds(match: Match): Set<string> {
  const { home, away } = match.score;
  const ids = new Set<string>();
  ids.add(`${match.id}-1x2-${home > away ? "home" : home < away ? "away" : "draw"}`);
  ids.add(`${match.id}-ou-${home + away > 2.5 ? "over" : "under"}`);
  ids.add(`${match.id}-btts-${home > 0 && away > 0 ? "yes" : "no"}`);
  return ids;
}

/** Liquida as apostas abertas cujas partidas já terminaram. Retorna as que mudaram. */
export function settleBets(bets: Bet[], matches: Map<string, Match>, wallet: Wallet): Bet[] {
  const settled: Bet[] = [];
  for (const bet of bets) {
    if (bet.status !== "open") continue;
    const all = bet.selections.map((s) => matches.get(s.matchId));
    if (all.some((m) => !m || m.status !== "finished")) continue;
    const won = bet.selections.every((s) => winningSelectionIds(matches.get(s.matchId)!).has(s.selectionId));
    bet.status = won ? "won" : "lost";
    if (won) wallet.balance = Math.round((wallet.balance + bet.potentialReturn) * 100) / 100;
    settled.push(bet);
  }
  return settled;
}
