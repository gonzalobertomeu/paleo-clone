// Eventos de dominio: SALIDA de `reduce` (BE-3.1, BE-12.1). El dominio no publica
// (BE-4.4): application/infrastructure los filtran por jugador y los emiten por la
// subscription (API-12). Se mapean a los GameEvent de `shared` en el borde.
export type DomainEvent =
  | { type: "revealed" } // API-7 / GR-5.6
  | { type: "diceRolled" } // API-8.3
  | { type: "resolutionOpened" } // API-9.2
  | { type: "cardResolved" } // API-8.6
  | { type: "nightStarted" } // API-10.1
  | { type: "newDayStarted" } // API-11
  | { type: "gameEnded"; won: boolean }; // API-11.3 (empate -> victoria, GR-4.3)
