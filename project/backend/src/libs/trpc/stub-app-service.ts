import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import type { AppService, GameEvent } from "@paleo/shared";

// Marcador de método aún sin caso de uso (BE-7). Se irá sustituyendo por la
// invocación real a `reduce` + persistencia + publicación de la vista.
function ni(feature: string): never {
  throw new TRPCError({ code: "NOT_IMPLEMENTED", message: `${feature} pendiente` });
}

// Placeholder no-op del `AppService` (BE-2.7). Vive en `libs/trpc` de forma temporal
// para mantener los módulos libres de tRPC mientras no hay casos de uso: todo devuelve
// NOT_IMPLEMENTED. Cuando se escriba la lógica (validación, reduce, repositorio), la
// implementación real se moverá a `modules/*/application` y aquí solo quedará plumbing.
export class StubAppService implements AppService {
  roomCreate(): Promise<never> {
    return ni("room.create (BE-7.1)");
  }
  roomJoin(): Promise<never> {
    return ni("room.join");
  }
  roomLeave(): Promise<never> {
    return ni("room.leave");
  }
  roomStart(): Promise<never> {
    return ni("room.start (GR-3)");
  }

  getState(): Promise<never> {
    return ni("game.getState (BE-7.2)");
  }
  gameEvents() {
    // TODO(API-12 / BE-12): emitir snapshot + stateChanged filtrados por jugador.
    return observable<GameEvent>(() => () => {});
  }

  chooseCard(): Promise<never> {
    return ni("day.chooseCard");
  }
  sleepEarly(): Promise<never> {
    return ni("day.sleepEarly");
  }
  chooseCardAction(): Promise<never> {
    return ni("day.chooseCardAction");
  }
  declareHelp(): Promise<never> {
    return ni("day.declareHelp");
  }
  resolveStep(): Promise<never> {
    return ni("day.resolveStep");
  }

  chooseMissionAction(): Promise<never> {
    return ni("night.chooseMissionAction");
  }
}
