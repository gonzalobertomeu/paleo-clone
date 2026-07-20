# TODO — Paleo

> Estado de trabajo y pendientes. Las decisiones cerradas viven en las specs (`specs/`); esto es solo el **índice de lo que falta** y dónde retomar. Actualizar al cerrar cada punto.

## Dónde retomamos

Última sesión: se **escribió `Backend.md` (`BE-*`, v0.1)** — el motor de reglas y la máquina de estados día/noche. Decisiones tomadas al escribirla:

- **Módulos:** tres — `room` (sala/sesión), `game` (motor de reglas, reductor puro, FSM) y `view` (proyección por jugador) (`BE-2`).
- **Dominio:** reductor puro `reduce(state, command) → {state, events}` sobre un agregado único `GameState` (`BE-3`, `BE-6`); sin event sourcing.
- **Resolución de carta:** **paso a paso dirigida por servidor** — un `pendingStep` cada vez, respondido con `resolveStep` (`BE-8`). **Cierra `OQ-API-6`.**
- **`stateChanged`:** **snapshot completo** por cambio; sin diffs en v1 (`BE-12.2`). **Cierra `OQ-API-5`.**
- **Azar:** **semilla + contador** (`rng = {seed, draws}`) en el estado; puerto `Rng` puro y determinista (`BE-9`); reconcilia dominio puro (`ARCH-4.5`) con azar inyectado (`ARCH-4.6`) y reproducibilidad tras reinicio (`ARCH-9.7`).
- **Persistencia:** `GameState` íntegro en Redis tras el puerto `GameRepository` (`BE-10`).

`Protocol` → v0.3 (solo queda `OQ-API-2`, lobby). Con `Protocol` + `Backend` cerrados, **`Frontend`/`Components`/`Styles` ya están desbloqueadas**.

Nuevas OQ abiertas en `Backend.md`: `OQ-BE-1` (vocabulario exacto de `pendingStep`, se cierra con el corpus A/B), `OQ-BE-3` (mecanismo del escritor único por partida, decisión de implementación), `OQ-BE-4` (lobby, = `OQ-API-2`). `OQ-BE-2` documenta la reversión posible del snapshot a diffs.

Próximo paso recomendado (a elegir): **`Frontend.md`** o **`Components.md`** (ya desbloqueadas), el **corpus A/B** (`OQ-1`/`OQ-CD-4`), o arrancar el **scaffolding** (`pnpm` workspace, `infra/`, módulos del backend).

## Specs

| Spec | Estado | Falta |
|---|---|---|
| `GameRules.md` | v1.1 ✅ | Solo `OQ-1` (corpus/copyright) |
| `Architecture.md` | v1.1 ✅ | Nada. Todas las OQ cerradas |
| `CardData.md` | v0.2 🚧 | Corpus de cartas A/B; cerrar `OQ-CD-1/2/3/4/6` |
| `Protocol.md` | v0.3 🚧 | Cerrar `OQ-API-2` (lobby) |
| `Backend.md` | v0.1 ✅ | OQ propias: `OQ-BE-1/3/4` (no bloquean; ver abajo) |
| `Frontend.md` | ⬜ Pendiente | **Desbloqueada.** Escribir desde cero |
| `Components.md` | ⬜ Pendiente | **Desbloqueada.** Escribir desde cero |
| `Styles.md` | ⬜ Pendiente | Escribir desde cero |

## Cuestiones abiertas (OQ) por resolver

*Ninguna bloquea `Backend.md`.*

### Datos de carta (`CardData`)
- [ ] `OQ-CD-1` — `symbols` de dorso y `possess`: ¿vocabulario cerrado por módulo o strings libres?
- [ ] `OQ-CD-2` — Encadenamiento de acciones: ¿hace falta noción de *secuencia* o basta `secretRef` + `place`?
- [ ] `OQ-CD-3` — Reparto de costes en acciones alternativas de cartas permanentes (`GR-14.6`)
- [ ] `OQ-CD-4` — Fuente/formato del corpus (JSON/YAML) y ubicación. *(Copyright resuelto por `OQ-1`: corpus original. Queda fijar formato/ubicación y el nombre/tema del reskin.)*
- [ ] `OQ-CD-6` — ¿Algún módulo tiene un dorso propio que cuente como peligro? (si sí, `red` → propiedad `isDanger`)

### Protocolo (`Protocol`)
- [ ] `OQ-API-2` — Lobby y ciclo de sala; elección de módulos; nº de grupos *(= `OQ-BE-4`)*
- [x] `OQ-API-5` — [RESUELTA → `BE-12.2`] `stateChanged` = **snapshot completo** en v1
- [x] `OQ-API-6` — [RESUELTA → `BE-8`] `resolveStep` = **un paso por micro-elección**, dirigido por servidor

### Backend (`Backend`)
- [ ] `OQ-BE-1` — Vocabulario exacto de `pendingStep` (`assignWounds`, `payCost`, `evictIdea`…). El mecanismo ya está fijado (`BE-8`); los pasos concretos se cierran con el corpus A/B
- [ ] `OQ-BE-3` — Mecanismo del escritor único por partida (cola en memoria vs lock Redis vs actor). Decisión de implementación; no afecta al dominio ni al contrato
- [ ] `OQ-BE-4` — Lobby y ciclo de sala (= `OQ-API-2`)
- *(`OQ-BE-2` no es una duda: documenta que el snapshot podría revertirse a diffs si el corpus hace crecer la vista)*

### Dominio
- [x] `OQ-1` (`GameRules`) — [RESUELTA] **reskin de contenido original**: no se distribuye contenido de Paleo; el corpus cargado es propio (nota legal de `CLAUDE.md`). Queda **autorar** el corpus original (trabajo de contenido, no bloqueo legal).

## Código e infra (rama `coding`)

Scaffolding y transporte hechos y verificados (`pnpm install`, typecheck, `nest build`, 5/5 tests, y una llamada WS end-to-end `game.getState → NOT_IMPLEMENTED`):

- [x] `pnpm-workspace.yaml` + raíz (`ARCH-5.6/5.7`), `.gitignore`, `.npmrc`, `tsconfig.base.json`
- [x] `infra/` — `compose.yaml` (`frontend`/`backend`/`redis`, `ARCH-6.6/6.8`) + Dockerfiles de dev
- [x] `Makefile` raíz — `up`/`down`/`build`/`logs`/`sh`/`test` (`ARCH-6.7`)
- [x] `project/shared/` — glosario, `GameStateView` (`API-4`), intents (`zod`), eventos, errores, y **el contrato del router** (`API-1.5`: `AppService`/`TrpcContext`/`appRouter`)
- [x] `project/backend/` — módulos `room`/`game`/`view` (`BE-2`); `game/domain` con `reduce` (esqueleto), `GameState`, puertos `Rng`/`GameRepository`; dados testeados (`GR-11`); adaptador tRPC/WS (`API-1`) sirviendo el router de `shared` con `StubAppService`
- [x] `project/frontend/` — SPA React + Vite; cliente tRPC/WS que deriva `AppRouter` solo de `shared`

Pendiente (siguiente carne, sobre `coding`):

- [ ] **`game/domain`: la máquina de estados** — implementar `reduce` (`BE-5`): `day.chooseCard`, revelación atómica, resolución paso a paso (`BE-8`). Sustituye los stubs de `StubAppService`.
- [ ] **`view`: `projectView`** — proyección por jugador con filtrado de info oculta (`BE-11`) + tests (`BE-15.4`).
- [ ] **`game/application` + casos de uso reales** — cablear `reduce` + repositorio + publicación de vista/eventos; reemplazar `StubAppService` por la impl vía DI del módulo `game`.
- [ ] **`GameRepository` adaptador Redis** (`BE-10`, `ARCH-9.2`) + puerto de azar como provider DI.
- [ ] **Lobby / ciclo de sala** (`OQ-API-2`/`OQ-BE-4`): `room.*` real.
- [ ] **HMR de `shared` en dev**: el backend lee `shared` desde `dist`; hoy se construye una vez al arrancar. Para live-reload, correr `pnpm --filter @paleo/shared dev` (tsc -w) junto al backend.

> Nota: el contrato del router vive en `shared` (`API-1.5`); el backend implementa los resolvers (`AppService`). Así el cliente deriva `AppRouter` sin romper `frontend → shared` (`ARCH-5.3`).

## Recordatorio de método (SDD)

- No se escribe código sin spec que lo respalde.
- Toda decisión se rastrea a un ID (`GR-*`, `ARCH-*`, `CD-*`, `API-*`).
- Si algo no está especificado, se pregunta; la duda vive como `OQ-*`.
- IDs estables: nunca se renumeran; lo revertido se marca `[OBSOLETA]`.
