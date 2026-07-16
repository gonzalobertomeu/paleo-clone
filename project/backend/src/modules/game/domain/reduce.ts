import type { ErrorCode } from "@paleo/shared";
import type { GameState } from "./state";
import type { Command } from "./commands";
import type { DomainEvent } from "./events";
import type { Rng } from "./ports/rng";

// Error tipado del dominio (BE-13). Mapea la taxonomía del protocolo (API-13.2).
// No filtra información oculta (API-13.3).
export interface DomainError {
  code: ErrorCode | "NOT_IMPLEMENTED";
  message: string;
}

export type ReduceResult =
  | { ok: true; state: GameState; events: DomainEvent[] }
  | { ok: false; error: DomainError };

// Dependencias puras inyectadas al reductor. El azar se EVALÚA aquí pero su estado
// vive en GameState.rng (BE-9.2), así que reduce sigue siendo función pura de
// (state, command) (BE-3.2). El corpus de cartas se inyectará como dato de solo
// lectura (BE-4.5) cuando la resolución lo necesite.
export interface ReduceDeps {
  rng: Rng;
}

// Reductor puro (BE-3.1): (state, command) -> { state, events } | error.
// Sin I/O, sin reloj, sin aleatoriedad implícita (ARCH-4.5). Un comando ilegal
// devuelve error y NO muta el estado (API-5.1).
export function reduce(
  state: GameState,
  command: Command,
  _deps: ReduceDeps,
): ReduceResult {
  // Primera guardia: la legalidad depende de (phase, subState) (BE-5.10).
  // TODO(BE-5..BE-8): máquina de estados día/noche y resolución paso a paso.
  switch (command.type) {
    default:
      return {
        ok: false,
        error: {
          code: "NOT_IMPLEMENTED",
          message: `reduce("${command.type}") pendiente en fase "${state.phase}" (BE-5)`,
        },
      };
  }
}
