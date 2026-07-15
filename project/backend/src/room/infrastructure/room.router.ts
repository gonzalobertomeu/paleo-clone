import { z } from "zod";
import { router, publicProcedure, notImplemented } from "../../trpc/trpc";

// Transporte del módulo `room` (BE-2.1): ciclo de vida de sala (API-2.4).
// Adaptador tRPC en infrastructure (BE-2.5); la lógica vivirá en application.
export const roomRouter = router({
  // room.create (API-2.4): abre una sala nueva.
  create: publicProcedure.mutation(() => notImplemented("room.create (BE-7.1)")),

  // room.join (API-2.4): entra a una sala por su código de acceso (API-2.1).
  join: publicProcedure
    .input(z.object({ code: z.string() }))
    .mutation(() => notImplemented("room.join")),

  // room.leave (API-2.4).
  leave: publicProcedure.mutation(() => notImplemented("room.leave")),

  // room.start (API-2.4): baraja y reparte con semilla (GR-3, ARCH-4.6).
  start: publicProcedure.mutation(() => notImplemented("room.start (GR-3)")),
});
