import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

// Bootstrap del backend NestJS (ARCH-2.3). Puerto 3000 (ARCH-6.8).
// TODO(API-1): montar el adaptador tRPC sobre WebSockets como transporte de partida.
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3000);
}

void bootstrap();
