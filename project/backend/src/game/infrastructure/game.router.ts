import { z } from "zod";
import { observable } from "@trpc/server/observable";
import type { GameEvent, GameStateView } from "@paleo/shared";
import { router, publicProcedure, notImplemented } from "../../trpc/trpc";

// Transporte del módulo `game` (BE-2.2): consulta de estado y subscription de partida.
export const gameRouter = router({
  // game.getState (API-3.2): vista completa por jugador, autoritativa tras reconexión
  // de cliente o de servidor (API-3.4, ARCH-9.7). Anotamos el tipo de salida para que
  // el cliente derive GameStateView (API-1.2).
  getState: publicProcedure.query((): GameStateView => notImplemented("game.getState (BE-7.2)")),

  // game.onEvent (API-3.1, API-12): una subscription por partida que emite un snapshot
  // inicial y luego eventos incrementales, ya filtrados por jugador (API-4).
  onEvent: publicProcedure.subscription(() =>
    observable<GameEvent>(() => {
      // TODO(API-12 / BE-12): emitir snapshot + stateChanged filtrados por jugador.
      return () => {};
    }),
  ),
});

// Transporte de la fase de día (API-6, API-8). Elección concurrente + resolución
// paso a paso dirigida por servidor (BE-8).
export const dayRouter = router({
  // day.chooseCard (API-6.1): elige por posición entre las 3 superiores (GR-5.2) y
  // fija el orden de las 2 no elegidas (GR-5.3).
  chooseCard: publicProcedure
    .input(
      z.object({
        chosenIndex: z.number().int().min(0),
        returnOrder: z.tuple([z.number().int(), z.number().int()]),
      }),
    )
    .mutation(() => notImplemented("day.chooseCard")),

  // day.sleepEarly (API-6.3, GR-5.10): descarta el resto del mazo sin efecto y duerme.
  sleepEarly: publicProcedure.mutation(() => notImplemented("day.sleepEarly")),

  // day.chooseCardAction (API-8.1): resolver una opción, ayudar o ignorar (GR-6.4).
  chooseCardAction: publicProcedure
    .input(
      z.discriminatedUnion("action", [
        z.object({ action: z.literal("resolveOption"), optionId: z.string() }),
        z.object({ action: z.literal("help"), targetGroupId: z.string() }),
        z.object({ action: z.literal("ignore") }),
      ]),
    )
    .mutation(() => notImplemented("day.chooseCardAction")),

  // day.declareHelp (API-8.2): debe llegar antes de los dados (GR-11.3).
  declareHelp: publicProcedure
    .input(z.object({ targetGroupId: z.string() }))
    .mutation(() => notImplemented("day.declareHelp")),

  // day.resolveStep (API-8.4, BE-8): responde el `pendingStep` dirigido por servidor.
  resolveStep: publicProcedure
    .input(z.object({ stepId: z.string(), choice: z.unknown() }))
    .mutation(() => notImplemented("day.resolveStep")),
});

// Transporte de la fase de noche (API-10).
export const nightRouter = router({
  // night.chooseMissionAction (API-10.3): la tribu elige 1 opción por misión (GR-12.5);
  // no se puede ignorar (GR-12.4). Sin quórum: cualquier jugador la enacta (API-5.2).
  chooseMissionAction: publicProcedure
    .input(z.object({ missionCardId: z.string(), optionId: z.string() }))
    .mutation(() => notImplemented("night.chooseMissionAction")),
});
