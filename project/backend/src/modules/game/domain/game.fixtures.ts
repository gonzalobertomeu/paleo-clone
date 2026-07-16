// Constructores de estado para tests del dominio (ARCH-8.2: sin infraestructura).
// Excluido del build (tsconfig.build.json): solo lo consumen los .spec.
import type { CardId, GroupId, PlayerId } from "@paleo/shared";
import type { GameState, GroupState } from "./state";

export function gid(id: string): GroupId {
  return id as GroupId;
}

export function cards(...ids: string[]): CardId[] {
  return ids as CardId[];
}

// Un grupo despierto con el mazo dado (deck[0] = tope). `extra` sobreescribe campos.
export function makeGroup(
  id: string,
  deck: string[],
  extra: Partial<GroupState> = {},
): GroupState {
  return {
    id: id as GroupId,
    playerId: id as PlayerId,
    persons: [],
    tools: [],
    deck: cards(...deck),
    status: "awake",
    chosenCard: null,
    revealedCard: null,
    cardSpent: false,
    ...extra,
  };
}

// Partida en day/choosing con los grupos dados. `overrides` ajusta el resto.
export function makeGame(groups: GroupState[], overrides: Partial<GameState> = {}): GameState {
  const groupMap: Record<string, GroupState> = {};
  for (const g of groups) groupMap[g.id] = g;
  return {
    phase: "day",
    subState: "choosing",
    groups: groupMap,
    personDeck: [],
    dreamDeck: [],
    ideaDeck: [],
    secretDeck: [],
    storage: { food: 0, wood: 0, stone: 0 },
    workbench: [],
    skulls: 0,
    victoryTokens: 0,
    discardFaceDown: [],
    discardFaceUp: [],
    cemetery: [],
    missions: [],
    inPlay: [],
    rng: { seed: 1, draws: 0 },
    ...overrides,
  };
}
