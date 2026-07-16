import type { PlayerId } from "../domain/ids";
import type { AppService } from "./service";

// Contexto de tRPC (API-1.5, API-2.2). Lleva el `playerId` opaco (única credencial,
// ARCH-9.3/9.4) y el `app` que el backend inyecta con la implementación real de los
// resolvers. `shared` define la forma; `backend` provee el `app`.
export interface TrpcContext {
  playerId: PlayerId | null;
  app: AppService;
}
