// DTOs de intent (API-5, API-1.3). Un intent es una INTENCIÓN, no un hecho:
// el servidor valida y decide (ARCH-1.3). El router tRPC es el contrato único (ARCH-2.5);
// estos tipos son normativos en semántica, la forma exacta vive en el router (API-1.2).

import type { GroupId } from "../domain/ids";

// --- Sala (API-2.4) ---
export interface JoinRoomInput {
  code: string;
}

// --- Día: elección (API-6) ---
export interface ChooseCardInput {
  // Índice (0..2) de las 3 superiores; las caras no se conocen, se elige por posición (API-6.1).
  chosenIndex: number;
  // Orden en que vuelven al tope las 2 no elegidas (GR-5.3).
  returnOrder: [number, number];
}

// --- Día: resolución (API-8) ---
export type CardActionInput =
  | { action: "resolveOption"; optionId: string } // API-8.1
  | { action: "help"; targetGroupId: GroupId } // GR-8.1 / GR-14.6
  | { action: "ignore" }; // GR-6.4 (ilegal en hazard/mission)

export interface DeclareHelpInput {
  targetGroupId: GroupId; // API-8.2; debe llegar antes de los dados (GR-11.3)
}

// Respuesta a un `pendingStep` dirigido por servidor (BE-8). El vocabulario exacto
// de pasos se cierra con el corpus A/B (OQ-BE-1); aquí solo la envoltura.
export interface ResolveStepInput {
  stepId: string;
  // payload discriminado por tipo de paso (assignWounds, payCost, ...). TODO(OQ-BE-1).
  choice: unknown;
}

// --- Noche (API-10) ---
export interface ChooseMissionActionInput {
  missionCardId: string;
  optionId: string;
}
