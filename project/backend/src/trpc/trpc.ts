import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";

// Inicialización de tRPC (API-1). El router es la ÚNICA definición del contrato
// (ARCH-2.5): el cliente deriva sus tipos de él, no se duplican a mano (API-1.2).
const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Marcador de procedure aún sin caso de uso (BE-7). Se irá sustituyendo por la
// invocación real a `reduce` + persistencia + publicación de la vista.
export function notImplemented(feature: string): never {
  throw new TRPCError({ code: "NOT_IMPLEMENTED", message: `${feature} pendiente` });
}
