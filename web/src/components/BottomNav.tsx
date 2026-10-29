import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { House, Radio, Receipt, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", icon: House, label: "Início" },
  { to: "/ao-vivo", icon: Radio, label: "Ao vivo" },
  { to: "/apostas", icon: Receipt, label: "Apostas" },
  { to: "/buscar", icon: Search, label: "Buscar" },
  { to: "/perfil", icon: UserRound, label: "Perfil" },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="absolute inset-x-0 bottom-0 z-30 border-t border-white/5 bg-[#0e0e10]/90 px-5 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur-xl">
      <ul className="flex items-center justify-between">
        {items.map(({ to, icon: Icon, label }) => {
          const active = to === "/" ? path === "/" : path.startsWith(to);
          return (
            <li key={to}>
              <Link to={to} aria-label={label} aria-current={active ? "page" : undefined} className="relative grid size-12 place-items-center rounded-full">
                {active && (
                  <motion.span layoutId="nav-active" transition={{ type: "spring", stiffness: 500, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-brand shadow-lg shadow-brand/40" />
                )}
                {!active && <span className="absolute inset-0 rounded-full bg-surface-2" />}
                <Icon className={cn("relative size-5", active ? "text-white" : "text-white/80")} strokeWidth={2} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
