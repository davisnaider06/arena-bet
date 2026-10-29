// Contrato da API (espelha server/src/domain.ts).
export type MatchStatus = "upcoming" | "live" | "finished";

export interface Team { name: string; short: string; color: string; accent: string }
export interface Selection { id: string; label: string; odds: number }
export interface Market { id: string; name: string; selections: Selection[] }

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

export interface Wallet { balance: number; currency: "BRL" }

export type BetStatus = "open" | "won" | "lost";
export interface Bet {
  id: string;
  createdAt: string;
  stake: number;
  totalOdds: number;
  potentialReturn: number;
  status: BetStatus;
  selections: Array<{ matchId: string; selectionId: string; odds: number; label: string; matchLabel: string; marketName: string }>;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  details?: { changed?: Array<{ selectionId: string; odds: number }> };
}

// Eventos do Socket.IO
export interface MatchUpdate { id: string; status: MatchStatus; minute: number; score: { home: number; away: number }; goal?: "home" | "away" | null }
export interface OddsUpdate { id: string; markets: Market[] }
