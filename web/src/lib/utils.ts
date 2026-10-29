import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const formatBRL = (v: number) => brl.format(v);
export const formatOdds = (v: number) => v.toFixed(2);

export function startsIn(iso: string, now = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "Agora";
  const min = Math.round(diff / 60_000);
  if (min < 60) return `Começa em ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Começa em ${h}h`;
  return new Date(iso).toLocaleDateString("pt-BR", { weekday: "short", hour: "2-digit", minute: "2-digit" });
}

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
