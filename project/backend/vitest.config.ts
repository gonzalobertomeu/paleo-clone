import { defineConfig } from "vitest/config";

// El dominio se testea SIN infraestructura (ARCH-8.2): sin contenedores, red ni Redis.
// Cada regla del dominio tiene al menos un test que la referencia por su ID (ARCH-8.1).
export default defineConfig({
  test: {
    include: ["src/**/*.spec.ts"],
    environment: "node",
  },
});
