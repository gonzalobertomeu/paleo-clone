import { Module } from "@nestjs/common";
import { RoomModule } from "./room/room.module";
import { GameModule } from "./game/game.module";
import { ViewModule } from "./view/view.module";

// Composición raíz. Clean Architecture primero por módulo (ARCH-4.1): room / game / view
// (BE-2). El router tRPC sobre WebSockets (ARCH-2.4, API-1) se montará en infrastructure.
@Module({
  imports: [RoomModule, GameModule, ViewModule],
})
export class AppModule {}
