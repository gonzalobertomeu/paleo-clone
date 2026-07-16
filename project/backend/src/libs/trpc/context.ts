import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import type { AppService, PlayerId, TrpcContext } from "@paleo/shared";

// Construye el contexto de cada conexión tRPC (API-1.5, API-2.2). El `playerId` opaco
// es la ÚNICA credencial (ARCH-9.3/9.4): el cliente lo presenta como connection param.
// El `app` (implementación de los resolvers, BE-7) se inyecta desde el backend.
export function createContext(
  opts: CreateWSSContextFnOptions,
  app: AppService,
): TrpcContext {
  const params = opts.info.connectionParams as Record<string, string> | null;
  const raw = params?.playerId ?? null;
  return { playerId: raw as PlayerId | null, app };
}
