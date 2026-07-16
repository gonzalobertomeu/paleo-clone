import "reflect-metadata";
import type { Server } from "node:http";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { attachTrpcWebSocket } from "./trpc/ws";
import { StubAppService } from "./trpc/app-service";

// Bootstrap del backend NestJS (ARCH-2.3). Puerto 3000 (ARCH-6.8).
// El transporte de partida es tRPC sobre WebSockets, adjunto al servidor HTTP (API-1.1).
// TODO(BE-7): reemplazar StubAppService por la implementación real (reduce + repositorio),
// provista por DI del módulo `game`.
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  attachTrpcWebSocket(app.getHttpServer() as Server, new StubAppService());
}

void bootstrap();
