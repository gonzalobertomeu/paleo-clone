import { z } from "zod";

// Esquemas de entrada de los intents (API-5, API-1.5). `zod` es la fuente ÚNICA:
// valida en runtime en el backend y de él se infieren los tipos del contrato; no se
// duplican a mano (API-1.2). Un intent es una INTENCIÓN, no un hecho: el servidor
// valida y decide (ARCH-1.3).

// --- Sala (API-2.4) ---
export const joinRoomInput = z.object({ code: z.string() });
export type JoinRoomInput = z.infer<typeof joinRoomInput>;

// --- Día: elección (API-6) ---
export const chooseCardInput = z.object({
  // Índice (0..2) de las 3 superiores; se elige por posición (API-6.1, GR-5.2).
  chosenIndex: z.number().int().min(0),
  // Orden en que vuelven al tope las 2 no elegidas (GR-5.3).
  returnOrder: z.tuple([z.number().int(), z.number().int()]),
});
export type ChooseCardInput = z.infer<typeof chooseCardInput>;

// --- Día: resolución (API-8) ---
export const cardActionInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("resolveOption"), optionId: z.string() }), // API-8.1
  z.object({ action: z.literal("help"), targetGroupId: z.string() }), // GR-8.1 / GR-14.6
  z.object({ action: z.literal("ignore") }), // GR-6.4 (ilegal en hazard/mission)
]);
export type CardActionInput = z.infer<typeof cardActionInput>;

export const declareHelpInput = z.object({ targetGroupId: z.string() }); // API-8.2 (antes de dados, GR-11.3)
export type DeclareHelpInput = z.infer<typeof declareHelpInput>;

// Respuesta a un `pendingStep` dirigido por servidor (BE-8). El vocabulario exacto
// de pasos se cierra con el corpus A/B (OQ-BE-1); aquí solo la envoltura.
export const resolveStepInput = z.object({ stepId: z.string(), choice: z.unknown() });
export type ResolveStepInput = z.infer<typeof resolveStepInput>;

// --- Noche (API-10) ---
export const chooseMissionActionInput = z.object({
  missionCardId: z.string(),
  optionId: z.string(),
});
export type ChooseMissionActionInput = z.infer<typeof chooseMissionActionInput>;
