# Paleo — Implementación digital

Réplica jugable **online multijugador** del juego de mesa cooperativo **Paleo** (Peter Rustemeyer / Hans im Glück, ed. española de Devir).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React + TypeScript, SPA con Vite |
| Backend | NestJS + TypeScript |
| Protocolo | tRPC sobre WebSockets |
| Arquitectura | Clean Architecture: primero por módulo, dentro por capa |
| Infra local | docker-compose (`infra/`), operado vía `Makefile` en la raíz |

**Todo el código se escribe en inglés** (identificadores, comentarios, logs, errores). Las specs se escriben en español. Glosario de traducción de términos de dominio: `ARCH-3.3`.

## Metodología: Spec-Driven Development (SDD)

**Las specs son la fuente de verdad. El código es su consecuencia.**

1. **No se escribe código sin una spec que lo respalde.** Si una tarea no está cubierta, primero se escribe o amplía la spec.
2. **Toda decisión de implementación se rastrea a un ID de spec** (`GR-5.2`, `ARCH-4.3`, `API-3.1`…). Los tests y módulos referencian el ID que implementan.
3. **Si la spec está mal o es ambigua, se corrige la spec** y luego el código. Nunca al revés.
4. **Si algo no está especificado, se pregunta.** No inventar reglas de negocio ni decisiones de arquitectura. Las dudas conocidas viven como `OQ-*` al final de cada spec.
5. **IDs estables:** nunca se renumeran ni se reutilizan. Una regla o decisión revertida se marca `[OBSOLETA]` conservando su ID.

## Ruteo: dónde vive cada cosa

```
paleo/
├── CLAUDE.md            # Este archivo. Ruteo, stack y metodología.
├── Makefile             # Router de comandos de docker compose. Único punto de entrada.
├── specs/               # Fuente de verdad. Sin código.
├── infra/               # Infra local: compose.yaml + Dockerfiles.
└── project/             # Todo el código de aplicación.
    ├── backend/         # NestJS. Autoridad de reglas y estado.
    ├── frontend/        # SPA React + Vite.
    └── shared/          # Contratos y tipos comunes a front y back.
```

### `specs/` — la fuente de verdad

Sin código. Un documento por dominio, cada uno con su prefijo de ID:

| Spec | Prefijo | Alcance | Estado |
|---|---|---|---|
| `GameRules.md` | `GR-*` | Reglas del juego. Dominio puro, agnóstico de tecnología. | v1.0 ✅ |
| `Architecture.md` | `ARCH-*` | Stack, capas, estructura de carpetas, infra, idioma, testing. | v1.0 ✅ |
| `CardData.md` | `CD-*` | Datos de las cartas: requisitos, costes, recompensas, secretos. | v0.1 🚧 (esquema; sin corpus) |
| `Backend.md` | `BE-*` | Módulos, casos de uso, máquina de estados, persistencia. | Pendiente |
| `Frontend.md` | `FE-*` | Estructura del cliente, estado de UI, flujos de interacción. | Pendiente |
| `Protocol.md` | `API-*` | Router tRPC: procedures, subscriptions, eventos, errores. | v0.1 🚧 |
| `Components.md` | `CMP-*` | Componentización, jerarquía y contratos de componentes. | Pendiente |
| `Styles.md` | `ST-*` | Sistema de diseño: tokens, tipografía, color, espaciado, temas. | Pendiente |

Al crear una spec nueva, **añadirla a esta tabla**.

### `project/` — el código

- **`backend/`** — Autoridad única sobre el estado de la partida y sobre la legalidad de toda acción (`ARCH-1.3`). Ninguna regla del juego se implementa fuera de aquí.
- **`frontend/`** — Presenta el estado que emite el backend y envía intenciones del jugador. No duplica lógica de reglas: puede deshabilitar afordancias por UX, pero la validación real siempre es del backend.
- **`shared/`** — Solo contratos: tipos del protocolo y DTOs. Sin lógica de reglas.

**Dependencias permitidas:** `frontend → shared`, `backend → shared`. **Nunca** `frontend → backend`, `backend → frontend`, ni `shared → *` (`ARCH-5.3`).

### `infra/` — infraestructura local

`compose.yaml` y los Dockerfiles. Se opera **siempre a través del `Makefile` de la raíz** (`ARCH-6.4`): no se ejecutan comandos de docker compose a mano.

## Invariantes de arquitectura

No negociables sin cambiar `Architecture.md` primero:

- **Clean Architecture, módulo → capa.** Cada módulo del backend tiene `domain/`, `application/`, `infrastructure/`. Dependencias siempre hacia adentro: `infrastructure → application → domain` (`ARCH-4.3`).
- **`domain` es puro.** No importa NestJS, ni tRPC, ni ninguna librería de I/O. Estado + acción → nuevo estado (`ARCH-4.5`).
- **El azar se inyecta.** Barajado y dados pasan por un puerto con semilla: las partidas son reproducibles (`ARCH-4.6`).
- **La información oculta se filtra en el servidor**, al serializar. El estado que sale del backend es una vista por jugador (`ARCH-7.1`, `ARCH-7.2`).
- **La fase de día es simultánea**, no por turnos: elecciones concurrentes y revelación atómica (`ARCH-7.3`).
- **Cada regla del dominio tiene un test que la referencia por ID** (`ARCH-8.1`).

## Estado actual

> **Pendientes y dónde retomar: [`TODO.md`](TODO.md)** (índice vivo de OQ abiertas, specs por escribir y scaffolding).


Specs de reglas y arquitectura cerradas. **Aún no se ha escrito código ni levantado infra.**

**Alcance v1 (`OQ-2`, resuelta):** motor genérico preparado para A–J; en v1 solo se cargan los datos de Base + módulos A y B.

Cuestiones abiertas que bloquean el scaffolding: persistencia (`OQ-ARCH-1`), identidad de jugador (`OQ-ARCH-2`), monorepo/workspaces (`OQ-ARCH-3`), targets del Makefile y puertos (`OQ-ARCH-4`), reconexión (`OQ-ARCH-5`).

## Nota legal

El texto y los datos de las cartas son material con copyright de Hans im Glück / Z-Man / Devir. Proyecto de uso personal y educativo; la distribución del contenido de las cartas requiere consideración aparte (`OQ-1` en `specs/GameRules.md`).
