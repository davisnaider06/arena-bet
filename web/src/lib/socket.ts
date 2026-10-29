import { io, type Socket } from "socket.io-client";
import { useSyncExternalStore } from "react";

export type ConnectionState = { status: "connecting" | "connected" | "reconnecting" | "offline"; attempt: number };

export const DEMO = import.meta.env.VITE_DEMO === "1";
const API_URL = import.meta.env.VITE_API_URL as string | undefined;

async function createSocket(): Promise<Socket> {
  if (DEMO) return (await import("./demo")).demoSocket as unknown as Socket;
  return io(API_URL ?? "", {
    path: "/socket.io",
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 6000,
  });
}

// Top-level await: o resto do app só roda com o transporte escolhido.
export const socket: Socket = await createSocket();

let state: ConnectionState = { status: DEMO ? "connected" : "connecting", attempt: 0 };
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
