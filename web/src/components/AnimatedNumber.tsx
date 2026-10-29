import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";

/** Número que "conta" até o novo valor (saldo, retorno potencial). */
export function AnimatedNumber({ value, format }: { value: number; format: (v: number) => string }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => format(v));
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.6, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
  }, [mv, value]);
  return <motion.span className="tabular-nums">{text}</motion.span>;
}
