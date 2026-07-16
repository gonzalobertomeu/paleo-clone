// Contratos compartidos front <-> back (ARCH-5.4, API-1.3, API-1.5). Tipos del
// protocolo y el contrato del router; sin lógica de reglas (esa vive en `backend`,
// ARCH-1.3). `shared` no importa de `frontend` ni `backend`.
export * from "./domain/ability";
export * from "./domain/resource";
export * from "./domain/card";
export * from "./domain/ids";
export * from "./view/game-state-view";
export * from "./intents/index";
export * from "./events/index";
export * from "./errors/index";

// Contrato del router de tRPC (API-1.5). El cliente importa `type AppRouter` de aquí.
export * from "./contract/service";
export * from "./contract/context";
export * from "./contract/router";
