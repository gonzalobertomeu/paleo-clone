import { Module } from "@nestjs/common";
import { MulberryRng } from "./infrastructure/mulberry-rng";

// Módulo `game` (BE-2.2): motor de reglas y autoridad (ARCH-1.3). La DI de Nest vive
// solo aquí, en infrastructure (BE-2.5, ARCH-4.4): enlaza los puertos del dominio
// (Rng, GameRepository) con sus adaptadores. `domain` y `application` no importan Nest.
export const GAME_RNG = Symbol("GAME_RNG");

@Module({
  providers: [{ provide: GAME_RNG, useClass: MulberryRng }],
  exports: [GAME_RNG],
})
export class GameModule {}
