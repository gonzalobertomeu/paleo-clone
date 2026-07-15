// Puerto de persistencia del agregado (BE-4.1, ARCH-9.2). El dominio declara la
// interfaz; el adaptador Redis vive en infrastructure (BE-10). El dominio no sabe
// que Redis existe (ARCH-9.2): carga/guarda el GameState completo por id de partida.
import type { GameState } from "../state";

export interface GameRepository {
  load(gameId: string): Promise<GameState | null>;
  save(gameId: string, state: GameState): Promise<void>;
}
