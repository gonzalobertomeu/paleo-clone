// Estado interno del agregado (BE-6). Forma INTERNA: nunca sale del backend (BE-1.3);
// lo que ve el cliente es la GameStateView proyectada por el módulo `view` (BE-11).
// Serializable de forma plana (ids, números, enums) para persistir íntegro en Redis (BE-6.8).
import type { AbilityVector, CardId, GroupId, PlayerId, ResourcePool } from "@paleo/shared";
import type { DaySubState, NightSubState, Phase } from "./phase";

export interface PersonState {
  cardId: CardId;
  abilities: AbilityVector; // GR-9.1
  hearts: number; // capacidad (CD-10.2)
  wounds: number; // heridas colocadas (GR-9.2)
}

export interface GroupState {
  id: GroupId;
  playerId: PlayerId; // 1 jugador = 1 grupo en v1 (API-2.3)
  persons: PersonState[];
  tools: string[]; // fichas poseídas (GR-10.1)
  deck: CardId[]; // ordenado, boca abajo (GR-1.3)
  status: "awake" | "asleep"; // GR-5.9
  chosenCard: CardId | null; // elegida sin revelar (API-6.2)
  revealedCard: CardId | null; // revelada del turno (API-7)
  cardSpent: boolean; // GR-5.12
}

// Estado del stream de azar: semilla + nº de extracciones consumidas (BE-9.2).
export interface RngState {
  seed: number;
  draws: number;
}

export interface GameState {
  phase: Phase;
  subState: DaySubState | NightSubState | null;

  groups: Record<string, GroupState>;

  // Mazos ocultos: solo se expone su tamaño en la vista (API-4.2, BE-6.2).
  personDeck: CardId[];
  dreamDeck: CardId[];
  ideaDeck: CardId[];
  secretDeck: CardId[];

  storage: ResourcePool; // GR-7.3
  workbench: (CardId | null)[]; // huecos de idea (GR-10.6)
  skulls: number; // GR-4.2
  victoryTokens: number; // GR-4.1
  discardFaceDown: CardId[]; // GR-7.8 (no consultable)
  discardFaceUp: CardId[]; // GR-7.9 (consultable)
  cemetery: CardId[]; // fuera de la partida (GR-7.12)

  missions: CardId[]; // GR-3.7
  inPlay: CardId[]; // cartas permanentes (CD-5.9)

  rng: RngState; // BE-6.6

  // TODO(BE-6.5): contexto de turno (resolución activa, pendingStep).
  // TODO(BE-6.7): composición de módulos cargados.
}
