import type { ErrorCode } from "@paleo/shared";
import type { GameState, GroupState } from "./state";
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
// devuelve error y NO muta el estado (API-5.1). La primera guardia siempre es la
// fase/sub-estado (BE-5.10).
export function reduce(
  state: GameState,
  command: Command,
  _deps: ReduceDeps,
): ReduceResult {
  switch (command.type) {
    case "chooseCard":
      return chooseCard(state, command);
    case "sleepEarly":
      return sleepEarly(state, command);
    // TODO(BE-8): resolución paso a paso; TODO(BE-5.7): noche.
    default:
      return err("NOT_IMPLEMENTED", `reduce("${command.type}") pendiente en fase "${state.phase}" (BE-5)`);
  }
}

// --- Fase de día: elección (API-6, BE-5.3) ---

function chooseCard(
  state: GameState,
  cmd: Extract<Command, { type: "chooseCard" }>,
): ReduceResult {
  if (state.phase !== "day" || state.subState !== "choosing") {
    return err("NOT_YOUR_PHASE", "chooseCard solo es legal en day.choosing (BE-5.10)");
  }
  const group = state.groups[cmd.groupId];
  if (!group) return err("ILLEGAL_CHOICE", "grupo inexistente");
  if (group.status !== "awake") return err("NOT_AWAKE", "el grupo duerme (GR-5.9)");
  if (group.chosenCard !== null) return err("ILLEGAL_CHOICE", "el grupo ya eligió este turno");

  // GR-5.5: se elige entre las disponibles aunque queden menos de 3.
  const k = Math.min(3, group.deck.length);
  if (k === 0) return err("ILLEGAL_CHOICE", "el mazo está vacío");
  if (!Number.isInteger(cmd.chosenIndex) || cmd.chosenIndex < 0 || cmd.chosenIndex >= k) {
    return err("ILLEGAL_CHOICE", "índice de carta fuera de rango");
  }

  const nonChosen = range(k).filter((i) => i !== cmd.chosenIndex);
  if (!isPermutation(cmd.returnOrder, nonChosen)) {
    return err("ILLEGAL_CHOICE", "returnOrder debe ser una permutación de las no elegidas (GR-5.3)");
  }

  const top = group.deck.slice(0, k);
  const chosen = top[cmd.chosenIndex]!;
  // Las no elegidas vuelven al tope en el orden pedido (GR-5.3); el resto, debajo.
  const newTop = cmd.returnOrder.map((i) => top[i]!);
  const newDeck = [...newTop, ...group.deck.slice(k)];

  const next = withGroup(state, { ...group, deck: newDeck, chosenCard: chosen });
  return afterChoice(next);
}

function sleepEarly(
  state: GameState,
  cmd: Extract<Command, { type: "sleepEarly" }>,
): ReduceResult {
  if (state.phase !== "day" || state.subState !== "choosing") {
    return err("NOT_YOUR_PHASE", "sleepEarly solo es legal en day.choosing (BE-5.10)");
  }
  const group = state.groups[cmd.groupId];
  if (!group) return err("ILLEGAL_CHOICE", "grupo inexistente");
  if (group.status !== "awake") return err("NOT_AWAKE", "el grupo ya duerme (GR-5.9)");
  if (group.chosenCard !== null) return err("ILLEGAL_CHOICE", "no se puede dormir temprano tras elegir");

  // GR-5.10: descarta el resto del mazo boca abajo y SIN efecto (los dorsos rojos
  // así descartados NO causan heridas, a diferencia de GR-7.6) y se duerme.
  const next: GameState = {
    ...withGroup(state, { ...group, deck: [], status: "asleep" }),
    discardFaceDown: [...state.discardFaceDown, ...group.deck],
  };
  return afterChoice(next);
}

// Paso de servidor tras cada elección: autodormir por vaciado (GR-5.9) y, si todos
// los despiertos ya eligieron, revelación atómica (GR-5.6, BE-5.4).
function afterChoice(state: GameState): ReduceResult {
  const normalized = mapGroups(state, (g) =>
    g.status === "awake" && g.deck.length === 0 && g.chosenCard === null
      ? { ...g, status: "asleep" }
      : g,
  );

  const awake = groupList(normalized).filter((g) => g.status === "awake");
  const allChosen = awake.length > 0 && awake.every((g) => g.chosenCard !== null);
  if (!allChosen) {
    // TODO(BE-5.7): si awake.length === 0, todos duermen -> noche (GR-5.11).
    return ok(normalized, []);
  }

  // Revelación atómica (API-7.1): todas a la vez. Incluso con 1 despierto (API-7.4).
  const revealed = mapGroups(normalized, (g) =>
    g.status === "awake"
      ? { ...g, revealedCard: g.chosenCard, chosenCard: null, cardSpent: false }
      : g,
  );
  return ok({ ...revealed, subState: "resolving" }, [{ type: "revealed" }]);
}

// --- helpers puros ---

function ok(state: GameState, events: DomainEvent[]): ReduceResult {
  return { ok: true, state, events };
}
function err(code: DomainError["code"], message: string): ReduceResult {
  return { ok: false, error: { code, message } };
}

function withGroup(state: GameState, group: GroupState): GameState {
  return { ...state, groups: { ...state.groups, [group.id]: group } };
}

function mapGroups(state: GameState, fn: (g: GroupState) => GroupState): GameState {
  const groups: Record<string, GroupState> = {};
  for (const g of groupList(state)) groups[g.id] = fn(g);
  return { ...state, groups };
}

function groupList(state: GameState): GroupState[] {
  return Object.values(state.groups);
}

function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

function isPermutation(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}
