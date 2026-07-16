import type { Server } from "node:http";
import { WebSocketServer } from "ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { appRouter, type AppService } from "@paleo/shared";
import { createContext } from "./context";

// Transporte de partida: tRPC sobre WebSockets (ARCH-2.4, API-1.1). Sirve el `appRouter`
// definido en `shared` (API-1.5), inyectando la implementación de los resolvers (`app`).
// Se adjunta al servidor HTTP de Nest para compartir el puerto 3000 (ARCH-6.8).
export function attachTrpcWebSocket(server: Server, app: AppService): () => void {
  const wss = new WebSocketServer({ server });
  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: (opts) => createContext(opts, app),
  });

  return () => {
    handler.broadcastReconnectNotification();
    wss.close();
  };
}
