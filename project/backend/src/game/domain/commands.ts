// Comandos: la forma INTERNA de un intent ya autenticado (BE-7). El caso de uso
// traduce el intent del protocolo (API-*) a un comando y lo pasa a `reduce` (BE-3.1).
import type { GroupId } from "@paleo/shared";

// Todo comando lleva quién lo emite (silla ya autenticada por playerId, ARCH-9.4).
interface CommandBase {
  groupId: GroupId;
}

export type Command =
  | (CommandBase & { type: "chooseCard"; chosenIndex: number; returnOrder: [number, number] }) // API-6.1
  | (CommandBase & { type: "sleepEarly" }) // API-6.3
  | (CommandBase & { type: "resolveOption"; optionId: string }) // API-8.1
  | (CommandBase & { type: "help"; targetGroupId: GroupId }) // API-8.1
  | (CommandBase & { type: "ignore" }) // API-8.1
  | (CommandBase & { type: "declareHelp"; targetGroupId: GroupId }) // API-8.2
  | (CommandBase & { type: "resolveStep"; stepId: string; choice: unknown }) // API-8.4 / BE-8
  | (CommandBase & { type: "chooseMissionAction"; missionCardId: string; optionId: string }); // API-10.3
