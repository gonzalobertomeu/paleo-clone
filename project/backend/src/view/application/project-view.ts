import type { GameStateView, PlayerId } from "@paleo/shared";
import type { GameState } from "../../game/domain/state";

// Proyección por jugador (BE-11): GameState interno -> GameStateView filtrada.
// Es el ÚNICO lugar donde se aplica la regla de información oculta (BE-11.5, ARCH-7.2):
// se ocultan caras no reveladas (GR-5.2), descarte boca abajo (GR-7.8) y el contenido
// de los mazos ocultos (solo su tamaño, API-4.2). No muta estado ni decide reglas.
export function projectView(_state: GameState, _viewer: PlayerId): GameStateView {
  // TODO(BE-11): construir la vista filtrada a partir del estado.
  throw new Error("projectView pendiente (BE-11)");
}
