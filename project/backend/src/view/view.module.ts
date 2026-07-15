import { Module } from "@nestjs/common";

// Módulo `view` (BE-2.3): proyección por jugador. Depende de los tipos de estado de
// `game` (para leerlos) y de los tipos de vista de `shared` (para emitirlos); nunca
// muta estado ni decide reglas (BE-11.5). Aísla la información oculta (ARCH-7.2).
@Module({})
export class ViewModule {}
