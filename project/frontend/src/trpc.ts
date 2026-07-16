import { createTRPCClient, createWSClient, wsLink } from "@trpc/client";
// El cliente deriva sus tipos del contrato importando SOLO de `shared` (API-1.5,
// ARCH-5.3): nunca importa `backend`. `AppRouter` es un tipo (se borra al compilar),
// así que no arrastra el router al bundle del cliente.
import type { AppRouter } from "@paleo/shared";

// Transporte de partida: tRPC sobre WebSockets (ARCH-2.4, API-1.1). El `playerId`
// opaco (única credencial, ARCH-9.3/9.4) se conserva en el cliente y se presenta al
// conectar como connection param (API-2.2).
function backendUrl(): string {
  const host = window.location.hostname;
  return `ws://${host}:3000`;
}

export function createGameClient(getPlayerId: () => string | null) {
  const wsClient = createWSClient({
    url: backendUrl(),
    connectionParams: () => {
      const playerId = getPlayerId();
      return playerId ? { playerId } : {};
    },
  });

  return createTRPCClient<AppRouter>({
    links: [wsLink({ client: wsClient })],
  });
}

export type GameClient = ReturnType<typeof createGameClient>;
