import { cva, type VariantProps } from "class-variance-authority";
import { motion, type HTMLMotionProps } from "motion/react";
import { AlertTriangle, RotateCw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Botão no padrão do shadcn/ui (cva + variantes), com micro-interação de toque.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand/70 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        brand: "brand-gradient text-white shadow-lg shadow-brand/25",
        solid: "bg-brand text-white hover:bg-brand-deep",
        dark: "bg-black/85 text-white hover:bg-black",
        ghost: "bg-white/5 text-white hover:bg-white/10",
        outline: "border border-line text-white hover:bg-white/5",
      },
      size: { sm: "h-9 px-3 text-xs", md: "h-11 px-4 text-sm", lg: "h-13 px-5 text-base", icon: "size-11" },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

type ButtonProps = HTMLMotionProps<"button"> & VariantProps<typeof buttonVariants>;
export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-2xl", className)} aria-hidden />;
}

export function LiveDot({ className }: { className?: string }) {
  return <span className={cn("inline-block size-1.5 rounded-full bg-loss animate-live", className)} />;
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line px-6 py-10 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-white/5"><Icon className="size-6 text-muted" /></div>
      <div>
        <p className="font-semibold">{title}</p>
        {body && <p className="mt-1 text-sm text-muted">{body}</p>}
      </div>
      {action}
    </motion.div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <motion.div role="alert" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-3xl border border-loss/30 bg-loss/10 p-4">
      <AlertTriangle className="size-5 shrink-0 text-loss" />
      <p className="flex-1 text-sm">{message}</p>
      {onRetry && (
        <Button size="sm" variant="ghost" onClick={onRetry}>
          <RotateCw className="size-3.5" /> Tentar de novo
        </Button>
      )}
    </motion.div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="text-[15px] font-bold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}
