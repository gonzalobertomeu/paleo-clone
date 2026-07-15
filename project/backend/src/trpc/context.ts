import type { CreateWSSContextFnOptions } from "@trpc/server/adapters/ws";
import type { PlayerId } from "@paleo/shared";

// Contexto de una conexión tRPC (API-2.2). El `playerId` opaco es la ÚNICA credencial
// (ARCH-9.3, ARCH-9.4): el cliente lo conserva localmente y lo presenta al conectar
// como connection param. No hay autenticación (ARCH-9.3).
export interface Context {
  playerId: PlayerId | null;
}

export function createContext(opts: CreateWSSContextFnOptions): Context {
  const params = opts.info.connectionParams as Record<string, string> | null;
  const raw = params?.playerId ?? null;
  return { playerId: raw as PlayerId | null };
}
