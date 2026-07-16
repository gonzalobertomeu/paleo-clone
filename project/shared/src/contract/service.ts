import type { Observable } from "@trpc/server/observable";
import type { PlayerId, RoomCode } from "../domain/ids";
import type { GameStateView } from "../view/game-state-view";
import type { GameEvent } from "../events";
import type {
  ChooseCardInput,
  CardActionInput,
  DeclareHelpInput,
  ResolveStepInput,
  ChooseMissionActionInput,
  JoinRoomInput,
} from "../intents";

// AppService: la interfaz que el backend implementa y que los resolvers del router
// invocan (API-1.5). Los resolvers solo DELEGAN aquí; toda la lógica de reglas vive
// en `backend` (ARCH-1.3, ARCH-5.4). Cada método recibe el `playerId` del contexto
// (la única credencial, ARCH-9.3/9.4) y devuelve tipos de `shared`.
export interface AppService {
  // --- room (API-2.4) ---
  roomCreate(playerId: PlayerId | null): Promise<{ code: RoomCode; playerId: PlayerId }>;
  roomJoin(playerId: PlayerId | null, input: JoinRoomInput): Promise<{ playerId: PlayerId }>;
  roomLeave(playerId: PlayerId | null): Promise<void>;
  roomStart(playerId: PlayerId | null): Promise<void>;

  // --- game (API-3, API-12) ---
  getState(playerId: PlayerId | null): Promise<GameStateView>;
  gameEvents(playerId: PlayerId | null): Observable<GameEvent, unknown>;

  // --- day (API-6, API-8) ---
  chooseCard(playerId: PlayerId | null, input: ChooseCardInput): Promise<void>;
  sleepEarly(playerId: PlayerId | null): Promise<void>;
  chooseCardAction(playerId: PlayerId | null, input: CardActionInput): Promise<void>;
  declareHelp(playerId: PlayerId | null, input: DeclareHelpInput): Promise<void>;
  resolveStep(playerId: PlayerId | null, input: ResolveStepInput): Promise<void>;

  // --- night (API-10) ---
  chooseMissionAction(playerId: PlayerId | null, input: ChooseMissionActionInput): Promise<void>;
}
