import { Module } from "@nestjs/common";
import { RoomModule } from "./modules/room/room.module";
import { GameModule } from "./modules/game/game.module";
import { ViewModule } from "./modules/view/view.module";

// Composición raíz. Clean Architecture primero por módulo (ARCH-4.1): room / game / view
// (BE-2). El router tRPC sobre WebSockets (ARCH-2.4, API-1) se montará en infrastructure.
@Module({
  imports: [RoomModule, GameModule, ViewModule],
})
export class AppModule {}
