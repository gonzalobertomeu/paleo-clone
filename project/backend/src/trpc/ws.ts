import type { Server } from "node:http";
import { WebSocketServer } from "ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { appRouter } from "./app-router";
import { createContext } from "./context";

// Transporte de partida: tRPC sobre WebSockets (ARCH-2.4, API-1.1). Toda la
// interacción de partida va por WS; no hay HTTP polling. Se adjunta al servidor
// HTTP de Nest para compartir el puerto 3000 (ARCH-6.8).
export function attachTrpcWebSocket(server: Server): () => void {
  const wss = new WebSocketServer({ server });
  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext,
  });

  return () => {
    handler.broadcastReconnectNotification();
    wss.close();
  };
}
