import "reflect-metadata";
import type { Server } from "node:http";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { attachTrpcWebSocket } from "./trpc/ws";

// Bootstrap del backend NestJS (ARCH-2.3). Puerto 3000 (ARCH-6.8).
// El transporte de partida es tRPC sobre WebSockets, adjunto al servidor HTTP (API-1.1).
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  attachTrpcWebSocket(app.getHttpServer() as Server);
}

void bootstrap();
