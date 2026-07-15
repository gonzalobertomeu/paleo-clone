// Vista por jugador serializada (API-4, BE-11). Es lo ÚNICO que sale del backend
// hacia el cliente: el modelo interno del dominio nunca cruza este límite (BE-1.3).
// El filtrado de información oculta ocurre en el servidor, en el módulo `view` (ARCH-7.2).

import type { AbilityVector } from "../domain/ability";
import type { ResourcePool } from "../domain/resource";
import type { CardBack, CardKind } from "../domain/card";
import type { GroupId, PlayerId } from "../domain/ids";

export type Phase = "day" | "night" | "newDay" | "ended";
export type DaySubState = "choosing" | "resolving";
export type NightSubState = "feeding" | "missions";

// Una persona tal y como la ven todos (pública, API-4.3).
export interface PersonView {
  abilities: AbilityVector; // GR-9.1
  hearts: number; // capacidad total (CD-10.2)
  wounds: number; // heridas colocadas (GR-9.2)
}

// El propio grupo del jugador.
export interface OwnGroupView {
  id: GroupId;
  persons: PersonView[];
  tools: string[]; // fichas poseídas (GR-10.1)
  asleep: boolean; // GR-5.9
  // Dorsos del propio mazo, en orden; nunca las caras (GR-5.4, API-4.2).
  deckBacks: CardBack[];
  // La carta ya elegida está oculta incluso para su dueño hasta revelar (API-4.2, API-6.2).
  hasChosen: boolean;
  // ¿conserva su carta revelada sin gastar? (API-4.5, GR-5.12)
  hasUnspentCard: boolean;
}

// Un grupo ajeno: público, pero con el mazo limitado (API-4.4).
export interface OtherGroupView {
  id: GroupId;
  persons: PersonView[];
  tools: string[];
  asleep: boolean;
  deckSize: number; // solo el tamaño (API-4.4)
  topBacks: CardBack[]; // los dorsos de las 3 superiores, las candidatas (GR-5.2)
  hasChosen: boolean;
}

// Bloque de interacción en curso (API-4.5). El `pendingStep` es dirigido por servidor (BE-8).
export interface InteractionView {
  phase: Phase;
  subState: DaySubState | NightSubState | null;
  // TODO(BE-8): resolución activa, pendingStep con su actor, y afordancias legales.
}

// La vista completa que recibe un jugador (API-4.2). Autosuficiente: un snapshot
// basta para reconstruir la UI sin historial (ARCH-9.6, BE-12.2).
export interface GameStateView {
  you: PlayerId;
  phase: Phase;
  storage: ResourcePool; // almacén común (GR-7.3)
  workbench: string[]; // ideas crafteables visibles (GR-10.6)
  skulls: number; // tablero de Noche (GR-4.2)
  victoryTokens: number; // tablero de Noche (GR-4.1)
  ownGroup: OwnGroupView;
  otherGroups: OtherGroupView[];
  discardFaceUp: CardKind[]; // pila consultable (GR-7.9); las de dorso abajo NO van aquí
  hiddenDeckSizes: {
    person: number;
    dream: number;
    idea: number;
    secret: number;
  }; // solo tamaños de los mazos ocultos (API-4.2)
  interaction: InteractionView;
}
