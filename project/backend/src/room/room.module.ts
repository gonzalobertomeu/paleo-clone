import { Module } from "@nestjs/common";
import { GameModule } from "../game/game.module";

// Módulo `room` (BE-2.1): ciclo de vida de la sala y la sesión efímera (ARCH-9.3).
// Arranca la partida invocando al módulo `game` (BE-2.4). No contiene reglas del juego.
// TODO(OQ-API-2 / BE-7.1): create/join/leave/start, estado de sala, reconexión.
@Module({
  imports: [GameModule],
})
export class RoomModule {}
