import { router } from "./trpc";
import { roomRouter } from "../room/infrastructure/room.router";
import { gameRouter, dayRouter, nightRouter } from "../game/infrastructure/game.router";

// Router raíz: la ÚNICA definición del contrato (ARCH-2.5, API-1.2). Los namespaces
// espejan el protocolo: room.* (API-2), game.* (API-3/12), day.* (API-6/8), night.* (API-10).
export const appRouter = router({
  room: roomRouter,
  game: gameRouter,
  day: dayRouter,
  night: nightRouter,
});

// El cliente deriva sus tipos de aquí (API-1.2). Cómo llega este tipo al frontend
// sin violar `frontend -> shared` (ARCH-5.3) es una decisión de wiring pendiente.
export type AppRouter = typeof appRouter;
