import { AnimatePresence, motion } from "motion/react";
import { WifiOff } from "lucide-react";
import { socket, useConnection } from "@/lib/socket";

/** Aparece quando o tempo real cai. Some sozinho quando reconecta. */
export function ConnectionBanner() {
  const conn = useConnection();
  const show = conn.status === "reconnecting" || conn.status === "offline";
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
          role="status"
        >
          <div className="mx-4 mt-2 flex items-center gap-2.5 rounded-2xl bg-[#2a1712] px-3.5 py-2.5 text-xs text-[#ffb59e]">
            <WifiOff className="size-4 shrink-0" />
            <span className="flex-1">
              Odds ao vivo pausadas. Reconectando{conn.attempt > 0 ? ` (tentativa ${conn.attempt})` : ""}…
            </span>
            <button className="font-semibold text-white underline-offset-2 hover:underline" onClick={() => socket.connect()}>
              Agora
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
