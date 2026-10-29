import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";

/** Uma seleção no cupom guarda a odd do momento em que foi adicionada. */
export interface SlipItem {
  matchId: string;
  selectionId: string;
  odds: number;
  label: string;
  marketName: string;
  matchLabel: string;
}

interface State { items: SlipItem[]; open: boolean }
type Action =
  | { type: "toggle"; item: SlipItem }
  | { type: "remove"; selectionId: string }
  | { type: "accept"; odds: Record<string, number> }
  | { type: "clear" }
  | { type: "open"; open: boolean };

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "toggle": {
      if (state.items.some((i) => i.selectionId === a.item.selectionId))
        return { ...state, items: state.items.filter((i) => i.selectionId !== a.item.selectionId) };
      // Uma seleção por partida: escolher outra da mesma partida substitui a anterior.
      return { ...state, items: [...state.items.filter((i) => i.matchId !== a.item.matchId), a.item] };
    }
    case "remove": {
      const items = state.items.filter((i) => i.selectionId !== a.selectionId);
      return { items, open: items.length ? state.open : false };
    }
    case "accept":
      return { ...state, items: state.items.map((i) => ({ ...i, odds: a.odds[i.selectionId] ?? i.odds })) };
    case "clear":
      return { items: [], open: false };
    case "open":
      return { ...state, open: a.open };
  }
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);

export function BetSlipProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], open: false });
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBetSlip() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBetSlip fora do BetSlipProvider");
  return ctx;
}
