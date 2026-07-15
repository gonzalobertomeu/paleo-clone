// Eventos de la subscription (API-12). Unión discriminada, servidor -> cliente,
// ya filtrados por jugador (API-4). La fuente de verdad es siempre la vista/snapshot;
// los eventos discretos sirven de registro para la UI (API-12.8).

import type { GameStateView } from "../view/game-state-view";

export type GameEvent =
  | { type: "snapshot"; view: GameStateView } // API-12.1
  | { type: "stateChanged"; view: GameStateView } // API-12.2 (snapshot completo, BE-12.2)
  | { type: "revealed" } // API-12.3 (revelación atómica; caras públicas tras esto)
  | { type: "diceRolled" } // API-12.4
  | { type: "cardResolved" } // API-12.5
  | { type: "resolutionOpened" } // API-12.6
  | { type: "nightStarted" } // API-12.7
  | { type: "newDayStarted" } // API-12.7
  | { type: "gameEnded"; won: boolean }; // API-12.7 / API-11.3 (empate -> victoria, GR-4.3)
