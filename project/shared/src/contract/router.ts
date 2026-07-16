import { initTRPC } from "@trpc/server";
import type { TrpcContext } from "./context";
import {
  joinRoomInput,
  chooseCardInput,
  cardActionInput,
  declareHelpInput,
  resolveStepInput,
  chooseMissionActionInput,
} from "../intents";

// El router es la ÚNICA definición del contrato (ARCH-2.5, API-1.5). Vive en `shared`;
// sus resolvers solo DELEGAN en `ctx.app.*` (implementado por el backend). Ninguna
// regla del juego aquí: solo contrato y delegación (ARCH-5.4). Namespaces espejan el
// protocolo: room.* (API-2), game.* (API-3/12), day.* (API-6/8), night.* (API-10).
const t = initTRPC.context<TrpcContext>().create();

export const appRouter = t.router({
  room: t.router({
    create: t.procedure.mutation(({ ctx }) => ctx.app.roomCreate(ctx.playerId)),
    join: t.procedure
      .input(joinRoomInput)
      .mutation(({ ctx, input }) => ctx.app.roomJoin(ctx.playerId, input)),
    leave: t.procedure.mutation(({ ctx }) => ctx.app.roomLeave(ctx.playerId)),
    start: t.procedure.mutation(({ ctx }) => ctx.app.roomStart(ctx.playerId)),
  }),

  game: t.router({
    getState: t.procedure.query(({ ctx }) => ctx.app.getState(ctx.playerId)),
    onEvent: t.procedure.subscription(({ ctx }) => ctx.app.gameEvents(ctx.playerId)),
  }),

  day: t.router({
    chooseCard: t.procedure
      .input(chooseCardInput)
      .mutation(({ ctx, input }) => ctx.app.chooseCard(ctx.playerId, input)),
    sleepEarly: t.procedure.mutation(({ ctx }) => ctx.app.sleepEarly(ctx.playerId)),
    chooseCardAction: t.procedure
      .input(cardActionInput)
      .mutation(({ ctx, input }) => ctx.app.chooseCardAction(ctx.playerId, input)),
    declareHelp: t.procedure
      .input(declareHelpInput)
      .mutation(({ ctx, input }) => ctx.app.declareHelp(ctx.playerId, input)),
    resolveStep: t.procedure
      .input(resolveStepInput)
      .mutation(({ ctx, input }) => ctx.app.resolveStep(ctx.playerId, input)),
  }),

  night: t.router({
    chooseMissionAction: t.procedure
      .input(chooseMissionActionInput)
      .mutation(({ ctx, input }) => ctx.app.chooseMissionAction(ctx.playerId, input)),
  }),
});

// El cliente deriva sus tipos de aquí, importando SOLO de `shared` (API-1.5, ARCH-5.3).
export type AppRouter = typeof appRouter;
