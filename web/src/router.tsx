import { createRootRoute, createRoute, createRouter, Outlet, useRouterState } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { BetSlip } from "@/components/BetSlip";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { useLiveUpdates } from "@/lib/live";
import { HomePage } from "@/pages/Home";
import { LivePage } from "@/pages/Live";
import { MatchPage } from "@/pages/MatchPage";
import { BetsPage } from "@/pages/Bets";
import { SearchPage } from "@/pages/SearchPage";
import { ProfilePage } from "@/pages/Profile";
import { EmptyState } from "@/components/ui";
import { Compass } from "lucide-react";
import { useEffect, useRef } from "react";

function RootLayout() {
  useLiveUpdates();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [path]);

  return (
    <div className="flex h-full items-center justify-center sm:p-6">
      {/* "Celular": tela cheia no mobile, moldura no desktop */}
      <div className="relative h-full w-full overflow-hidden bg-bg sm:h-[min(880px,100%)] sm:max-w-[420px] sm:rounded-[44px] sm:border-[10px] sm:border-black sm:shadow-[0_40px_120px_-20px_rgba(0,0,0,0.7)]">
        <div ref={scroller} className="no-scrollbar h-full overflow-y-auto">
          <ConnectionBanner />
          <Outlet />
        </div>
        <BetSlip />
        <BottomNav />
      </div>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: () => (
    <div className="p-6 pt-16"><EmptyState icon={Compass} title="Página não encontrada" /></div>
  ),
});

const routes = [
  createRoute({ getParentRoute: () => rootRoute, path: "/", component: HomePage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/ao-vivo", component: LivePage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/partida/$matchId", component: MatchPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/apostas", component: BetsPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/buscar", component: SearchPage }),
  createRoute({ getParentRoute: () => rootRoute, path: "/perfil", component: ProfilePage }),
];

export const router = createRouter({
  routeTree: rootRoute.addChildren(routes),
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
