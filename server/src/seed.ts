import { type Match, type Market, type Team, roundOdds } from "./domain.js";

// Times e ligas fictícios.
const T = (name: string, short: string, color: string, accent: string): Team => ({ name, short, color, accent });

const teams = {
  spartans: T("Spartans FC", "SPA", "#E8441A", "#FFD2B8"),
  horizon: T("Horizon Warriors", "HOR", "#B3122E", "#FFB3B3"),
  tide: T("Costa Azul", "CAZ", "#1C5BD9", "#BFD4FF"),
  serra: T("Serra Verde", "SVE", "#16834A", "#BDF2D3"),
  lobos: T("Lobos do Vale", "LOB", "#5B4BDB", "#D6D0FF"),
  ferro: T("Ferroviário Norte", "FEN", "#3A3A3A", "#E5E5E5"),
  aurora: T("Aurora SC", "AUR", "#E0A100", "#FFF0B8"),
  atlantico: T("Atlântico EC", "ATL", "#0F8C9E", "#BFF3FA"),
  trovao: T("Trovão BC", "TRO", "#F25C05", "#FFD9C2"),
  cometas: T("Cometas", "COM", "#7A1FA2", "#EBC8FA"),
  marina: T("Marina Green", "MAR", "#2E9E5B", "#C6F5D9"),
  cidade: T("City Sports", "CIT", "#D23A6A", "#FFC9DA"),
};

function markets(id: string, h: number, d: number, a: number): Market[] {
  return [
    {
      id: `${id}-1x2`,
      name: "Resultado final",
      selections: [
        { id: `${id}-1x2-home`, label: "Casa", odds: roundOdds(h) },
        { id: `${id}-1x2-draw`, label: "Empate", odds: roundOdds(d) },
        { id: `${id}-1x2-away`, label: "Fora", odds: roundOdds(a) },
      ],
    },
    {
      id: `${id}-ou`,
      name: "Total de gols 2.5",
      selections: [
        { id: `${id}-ou-over`, label: "Mais de 2.5", odds: roundOdds(1.75 + Math.random() * 0.4) },
        { id: `${id}-ou-under`, label: "Menos de 2.5", odds: roundOdds(1.85 + Math.random() * 0.4) },
      ],
    },
    {
      id: `${id}-btts`,
      name: "Ambos marcam",
      selections: [
        { id: `${id}-btts-yes`, label: "Sim", odds: roundOdds(1.7 + Math.random() * 0.3) },
        { id: `${id}-btts-no`, label: "Não", odds: roundOdds(1.9 + Math.random() * 0.3) },
      ],
    },
  ];
}

export function seedMatches(now = new Date()): Map<string, Match> {
  const at = (hoursFromNow: number) => new Date(now.getTime() + hoursFromNow * 3_600_000).toISOString();
  const list: Array<Omit<Match, "markets"> & { o: [number, number, number] }> = [
    { id: "m1", sport: "futebol", league: "Liga Noturna", venue: "Marina Green · 1,8 km", home: teams.spartans, away: teams.horizon, startsAt: at(-0.6), status: "live", minute: 34, score: { home: 1, away: 0 }, featured: true, o: [1.65, 3.6, 4.8] },
    { id: "m2", sport: "futsal", league: "Copa Futsal Night", venue: "City Sports Complex · 1,1 km", home: teams.cidade, away: teams.marina, startsAt: at(-0.3), status: "live", minute: 12, score: { home: 0, away: 0 }, featured: true, o: [2.3, 3.1, 2.9] },
    { id: "m3", sport: "futebol", league: "Série Litoral", venue: "Arena Costa · 4,2 km", home: teams.tide, away: teams.serra, startsAt: at(-1.2), status: "live", minute: 71, score: { home: 2, away: 2 }, featured: false, o: [2.9, 2.4, 3.3] },
    { id: "m4", sport: "futebol", league: "Liga Noturna", venue: "Estádio do Vale · 6 km", home: teams.lobos, away: teams.ferro, startsAt: at(3), status: "upcoming", minute: 0, score: { home: 0, away: 0 }, featured: true, o: [1.9, 3.4, 4.1] },
    { id: "m5", sport: "futebol", league: "Série Litoral", venue: "Parque Aurora · 2,5 km", home: teams.aurora, away: teams.atlantico, startsAt: at(5), status: "upcoming", minute: 0, score: { home: 0, away: 0 }, featured: false, o: [2.6, 3.2, 2.7] },
    { id: "m6", sport: "futebol", league: "Copa Regional", venue: "Ginásio Trovão · 3 km", home: teams.trovao, away: teams.cometas, startsAt: at(27), status: "upcoming", minute: 0, score: { home: 0, away: 0 }, featured: false, o: [1.55, 4.0, 5.5] },
    { id: "m7", sport: "futebol", league: "Copa Regional", venue: "Riverside Park · 0,6 km", home: teams.horizon, away: teams.tide, startsAt: at(50), status: "upcoming", minute: 0, score: { home: 0, away: 0 }, featured: false, o: [2.1, 3.3, 3.4] },
    { id: "m8", sport: "futebol", league: "Série Litoral", venue: "Arena Serra · 8 km", home: teams.serra, away: teams.spartans, startsAt: at(74), status: "upcoming", minute: 0, score: { home: 0, away: 0 }, featured: false, o: [2.8, 3.1, 2.5] },
  ];
  return new Map(list.map(({ o, ...m }) => [m.id, { ...m, markets: markets(m.id, ...o) }]));
}

export const popularTeams = Object.values(teams).slice(0, 6);
