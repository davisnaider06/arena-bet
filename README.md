# Arena — apostas esportivas em tempo real (demo)

App mobile-first de apostas esportivas com odds e placares ao vivo. Projeto de portfólio: **dinheiro fictício, times e ligas inventados**. Nenhum valor real é depositado, apostado ou sacado.

## Stack

| Camada | Tecnologias |
|---|---|
| Front | React 19, TypeScript, Vite, TanStack Router, TanStack Query, Axios, Socket.IO client, Tailwind CSS v4, Motion, componentes no padrão do shadcn/ui (cva + tailwind-merge) |
| API | Node.js, Express, Socket.IO, TypeScript (tsx), Vitest |

## Rodando

```bash
npm install          # instala raiz, server e web
npm run dev          # API em :3001 e front em :5173
```

Abra http://localhost:5173. No desktop o app aparece dentro de uma moldura de celular; no celular ocupa a tela toda.

Testes da API: `npm test`. Checagem de tipos: `npm run typecheck`.

## O que tem

- **Início**: saudação com saldo animado, busca, seletor de dia, cards em destaque (ao vivo primeiro), próximos jogos e times populares.
- **Ao vivo**: placares e odds mudando a cada ~2,5 s via Socket.IO. A odd pisca verde quando sobe e vermelho quando cai, e o número troca com animação.
- **Partida**: placar grande, barra de progresso do jogo e três mercados (resultado, total de gols e ambos marcam).
- **Cupom**: simples ou múltipla, com valor rápido (+10/+25/+50/+100), retorno potencial animado e opção de aceitar mudança de odd automaticamente. A folha arrasta para fechar.
- **Minhas apostas**: abertas e finalizadas. A liquidação é automática quando a partida termina, com toast de ganhou/perdeu.
- **Perfil**: saldo demo, botão de restaurar R$ 1.000 e estatísticas.

## Decisões de engenharia

**O cache do TanStack Query é a fonte de verdade da tela.** A busca inicial vem por REST (Axios). Depois disso, os eventos do Socket.IO (`odds:update`, `match:update`, `wallet:update`, `bets:settled`) alteram o cache com `setQueriesData`, e todas as telas que leem aquela partida atualizam juntas. Isso fica em `web/src/lib/live.ts`.

**Conexão, erro e reconexão são estados de primeira classe.** `web/src/lib/socket.ts` expõe o estado da conexão (`connected`, `reconnecting` com número da tentativa, `offline`) via `useSyncExternalStore`. Um banner avisa quando as odds ao vivo pausam. Ao reconectar, o app invalida todas as queries, porque os eventos que aconteceram durante a queda foram perdidos.

**A odd que o usuário viu é a odd que ele aposta.** O cupom guarda a odd do momento em que a seleção entrou. Se o servidor recebe uma odd diferente da atual, responde `409 ODDS_CHANGED` com as odds novas, e o front pede confirmação. Com "aceitar automaticamente" ligado, o cupom acompanha a odd atual. A regra está em `server/src/domain.ts` e tem testes.

**Toda tela trata loading, erro e vazio.** Há skeletons com shimmer, `ErrorState` com "tentar de novo" e `EmptyState` com uma próxima ação. A API tem latência artificial de 200–600 ms para esses estados aparecerem de verdade.

**Acessibilidade e movimento.** Os botões de odd têm `aria-pressed` e `aria-label`, os toasts usam `aria-live` e o switch usa `role="switch"`. As animações respeitam `prefers-reduced-motion`.

## Estrutura

```
server/src/
  domain.ts        regras de aposta, validação e liquidação (sem I/O)
  domain.test.ts   testes das regras
  seed.ts          partidas e times fictícios
  index.ts         REST + Socket.IO + simulação ao vivo
web/src/
  lib/             api (Axios), socket, live (socket → cache), tipos, utils
  state/           cupom (useReducer + context) e toasts
  components/      OddsButton, cards, cupom, nav, banner de conexão, ui
  pages/           Início, Ao vivo, Partida, Apostas, Buscar, Perfil
  router.tsx       rotas do TanStack Router (code-based)
```

## Próximos passos

- Testes de componente (Testing Library) para o cupom e o `OddsButton`
- Code splitting por rota (`lazy` do TanStack Router)
- Autenticação e carteira por usuário na API
