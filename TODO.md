# TODO — Paleo

> Estado de trabajo y pendientes. Las decisiones cerradas viven en las specs (`specs/`); esto es solo el **índice de lo que falta** y dónde retomar. Actualizar al cerrar cada punto.

## Dónde retomamos

Última sesión: se **cerraron todas las `OQ-ARCH`** (`Architecture.md` → v1.1). Como efecto lateral cayó también `OQ-API-7`. **El scaffolding ya no está bloqueado**, pero sigue sin haber código ni infra.

Decisiones tomadas: Redis tras un puerto de repositorio (`ARCH-9.1/9.2`) · sesión efímera sin auth (`ARCH-9.3`) · la partida espera al jugador caído (`ARCH-9.5`) · `pnpm` workspaces (`ARCH-5.6`) · targets `up`/`down`/`build`/`logs`/`sh`/`test` y puertos 5173/3000/6379 (`ARCH-6.7/6.8`) · *destreza* → **`Craftsmanship`** (`ARCH-3.3`).

También se cerraron **`OQ-CD-5`** y **`OQ-CD-8`** (modelo de dados). El dado es de **símbolos**: 6 caras `{habilidad, 1|2}`, y cada cara sube el requisito de **esa** habilidad concreta (`GR-11.5`, `GR-11.6`). El **número de dados lo pide cada acción** (`GR-11.7`, `CD-5.3`); el módulo solo **anuncia el máximo** que podrá pedir alguna de sus cartas, como ayuda de preparación (`GR-11.9`, `CD-12.4`). Con 2 dados, los resultados se **acumulan** (`GR-11.8`). `GameRules` → v1.1, `CardData` → v0.2.

Próximo paso recomendado: **escribir `Backend.md` (`BE-*`)** — la máquina de estados día/noche que ejecuta el protocolo. Es la única spec pendiente que **desbloquea otras**: al escribirla se cierran `OQ-API-5` (snapshot vs diffs, que depende del tamaño real de `GameStateView`) y `OQ-API-6` (granularidad de `resolveStep`). Frontend/Components/Styles dependen de que `Protocol` esté cerrado, y `Protocol` espera a `Backend`.

**Ya no hay nada que bloquee `Backend.md`.**

## Specs

| Spec | Estado | Falta |
|---|---|---|
| `GameRules.md` | v1.1 ✅ | Solo `OQ-1` (corpus/copyright) |
| `Architecture.md` | v1.1 ✅ | Nada. Todas las OQ cerradas |
| `CardData.md` | v0.2 🚧 | Corpus de cartas A/B; cerrar `OQ-CD-1/2/3/4/6` |
| `Protocol.md` | v0.2 🚧 | Cerrar `OQ-API-2/5/6` |
| `Backend.md` | ⬜ Pendiente | **Siguiente.** Escribir desde cero |
| `Frontend.md` | ⬜ Pendiente | Bloqueada por `Protocol` |
| `Components.md` | ⬜ Pendiente | Bloqueada por `Protocol` |
| `Styles.md` | ⬜ Pendiente | Escribir desde cero |

## Cuestiones abiertas (OQ) por resolver

*Ninguna bloquea `Backend.md`.*

### Datos de carta (`CardData`)
- [ ] `OQ-CD-1` — `symbols` de dorso y `possess`: ¿vocabulario cerrado por módulo o strings libres?
- [ ] `OQ-CD-2` — Encadenamiento de acciones: ¿hace falta noción de *secuencia* o basta `secretRef` + `place`?
- [ ] `OQ-CD-3` — Reparto de costes en acciones alternativas de cartas permanentes (`GR-14.6`)
- [ ] `OQ-CD-4` — Fuente/formato del corpus (JSON/YAML), ubicación y estrategia de copyright
- [ ] `OQ-CD-6` — ¿Algún módulo tiene un dorso propio que cuente como peligro? (si sí, `red` → propiedad `isDanger`)

### Protocolo (`Protocol`)
- [ ] `OQ-API-2` — Lobby y ciclo de sala; elección de módulos; nº de grupos
- [ ] `OQ-API-5` — `stateChanged`: ¿snapshot completo o diffs incrementales? *(se cierra con `Backend.md`)*
- [ ] `OQ-API-6` — Granularidad de `resolveStep`: ¿un intent por micro-elección o compuesto por carta? *(se cierra con `Backend.md`)*

### Dominio
- [ ] `OQ-1` (`GameRules`) — Corpus de las 124 cartas de módulo + implicaciones de copyright

## Código e infra (nada empezado, ya desbloqueado)

- [ ] `pnpm-workspace.yaml` en la raíz (`ARCH-5.7`)
- [ ] `infra/` — `compose.yaml` con servicios `frontend`, `backend` y `redis` (`ARCH-6.6`) + Dockerfiles
- [ ] `Makefile` raíz — targets `up`/`down`/`build`/`logs`/`sh`/`test` (`ARCH-6.7`)
- [ ] `project/shared/` — tipos de vista + DTOs de intent (contratos, sin lógica)
- [ ] `project/backend/` — módulos Clean Architecture (`domain`/`application`/`infrastructure`), router tRPC, puerto de azar sembrado, puerto de repositorio + adaptador Redis (`ARCH-9.2`)
- [ ] `project/frontend/` — SPA React + Vite

> Nota de orden: el scaffolding ya es legal, pero escribir `Backend.md` **antes** de crear los módulos del backend evita inventarse la máquina de estados sobre la marcha (SDD).

## Recordatorio de método (SDD)

- No se escribe código sin spec que lo respalde.
- Toda decisión se rastrea a un ID (`GR-*`, `ARCH-*`, `CD-*`, `API-*`).
- Si algo no está especificado, se pregunta; la duda vive como `OQ-*`.
- IDs estables: nunca se renumeran; lo revertido se marca `[OBSOLETA]`.
