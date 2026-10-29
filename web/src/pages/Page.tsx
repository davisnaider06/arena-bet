import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

export const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
export const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 30 } },
};

/** Container de página com transição de entrada. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-h-full"
    >
      {children}
    </motion.main>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="flex items-end justify-between px-4 pb-2 pt-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
