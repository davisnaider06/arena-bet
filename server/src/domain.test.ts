import { describe, expect, it } from "vitest";
import { BetError, placeBet, settleBets, type Wallet } from "./domain.js";
import { seedMatches } from "./seed.js";

const now = new Date("2026-10-29T12:00:00Z");

function setup() {
  const matches = seedMatches(now);
  const wallet: Wallet = { balance: 100, currency: "BRL" };
  const m4 = matches.get("m4")!;
  const home = m4.markets[0].selections[0];
  return { matches, wallet, m4, home };
}

describe("placeBet", () => {
  it("cria aposta simples e desconta o saldo", () => {
    const { matches, wallet, home } = setup();
    const bet = placeBet(matches, wallet, { stake: 10, selections: [{ matchId: "m4", selectionId: home.id, odds: home.odds }] }, now, "b1");
    expect(bet.potentialReturn).toBeCloseTo(10 * home.odds, 2);
    expect(wallet.balance).toBe(90);
  });

  it("recusa quando a odd mudou e não mexe no saldo", () => {
    const { matches, wallet, home } = setup();
    const call = () => placeBet(matches, wallet, { stake: 10, selections: [{ matchId: "m4", selectionId: home.id, odds: home.odds + 0.5 }] }, now, "b1");
    expect(call).toThrowError(BetError);
    try { call(); } catch (e) { expect((e as BetError).code).toBe("ODDS_CHANGED"); }
    expect(wallet.balance).toBe(100);
  });

  it("recusa saldo insuficiente e valor inválido", () => {
    const { matches, wallet, home } = setup();
    const sel = [{ matchId: "m4", selectionId: home.id, odds: home.odds }];
    expect(() => placeBet(matches, wallet, { stake: 500, selections: sel }, now, "b")).toThrow(/Saldo/);
    expect(() => placeBet(matches, wallet, { stake: 0, selections: sel }, now, "b")).toThrow(/valor/);
  });

  it("não aceita duas seleções da mesma partida", () => {
    const { matches, wallet, m4 } = setup();
    const [a, b] = m4.markets[0].selections;
    expect(() =>
      placeBet(matches, wallet, { stake: 5, selections: [
        { matchId: "m4", selectionId: a.id, odds: a.odds },
        { matchId: "m4", selectionId: b.id, odds: b.odds },
      ] }, now, "b"),
    ).toThrow(/mesma|partida/);
  });
});

describe("settleBets", () => {
  it("paga a múltipla só quando todas as partidas terminam e acertam", () => {
    const { matches, wallet, m4, home } = setup();
    const bet = placeBet(matches, wallet, { stake: 10, selections: [{ matchId: "m4", selectionId: home.id, odds: home.odds }] }, now, "b1");
    expect(settleBets([bet], matches, wallet)).toHaveLength(0);
    m4.status = "finished";
    m4.score = { home: 2, away: 1 };
    const settled = settleBets([bet], matches, wallet);
    expect(settled[0].status).toBe("won");
    expect(wallet.balance).toBeCloseTo(90 + bet.potentialReturn, 2);
  });
});
