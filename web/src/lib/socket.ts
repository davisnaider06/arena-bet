import { io, type Socket } from "socket.io-client";
import { useSyncExternalStore } from "react";

export type ConnectionState = { status: "connecting" | "connected" | "reconnecting" | "offline"; attempt: number };

export const socket: Socket = io({
  path: "/socket.io",
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 800,
  reconnectionDelayMax: 6000,
});

let state: ConnectionState = { status: "connecting", attempt: 0 };
const listeners = new Set<() => void>();
const set = (next: ConnectionState) => {
  state = next;
  listeners.forEach((l) => l());
};

socket.on("connect", () => set({ status: "connected", attempt: 0 }));
socket.on("disconnect", (reason) => set({ status: reason === "io client disconnect" ? "offline" : "reconnecting", attempt: 0 }));
socket.io.on("reconnect_attempt", (attempt) => set({ status: "reconnecting", attempt }));
socket.on("connect_error", () => set({ status: "reconnecting", attempt: state.attempt }));

export function useConnection(): ConnectionState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}
