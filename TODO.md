# TODO — Paleo

> Estado de trabajo y pendientes. Las decisiones cerradas viven en las specs (`specs/`); esto es solo el **índice de lo que falta** y dónde retomar. Actualizar al cerrar cada punto.

## Dónde retomamos

Última sesión: se escribió el esquema de `CardData` (v0.1, sin corpus) y `Protocol` (v0.1), y se cerraron varias OQ (alcance v1, modo de juego, grupos 1:1, decisiones sin quórum, dorsos ajenos). **Aún no hay código ni infra.**

Próximo paso a elegir (cualquiera de estos):
- [ ] **Iterar `CardData` con el corpus real de A/B** — sacar más primitivas de carta (p. ej. las "otras acciones" de la hoguera) y cerrar `OQ-CD-*`.
- [ ] **Escribir `Backend.md` (`BE-*`)** — máquina de estados día/noche que ejecuta el protocolo. El motor detrás de `Protocol`.
- [ ] **Cerrar OQ del protocolo** — `OQ-API-2/5/6/7`.

## Specs

| Spec | Estado | Falta |
|---|---|---|
| `GameRules.md` | v1.0 ✅ | Solo `OQ-1` (corpus/copyright) |
| `Architecture.md` | v1.0 ✅ | OQ de scaffolding (ver abajo) |
| `CardData.md` | v0.1 🚧 | Corpus de cartas A/B; cerrar `OQ-CD-*` |
| `Protocol.md` | v0.1 🚧 | Cerrar `OQ-API-2/5/6/7` |
| `Backend.md` | ⬜ Pendiente | Escribir desde cero |
| `Frontend.md` | ⬜ Pendiente | Escribir desde cero |
| `Components.md` | ⬜ Pendiente | Escribir desde cero |
| `Styles.md` | ⬜ Pendiente | Escribir desde cero |

## Cuestiones abiertas (OQ) por resolver

### Bloquean el scaffolding / infra
- [ ] `OQ-ARCH-1` — Persistencia: ¿estado en memoria o Postgres/Redis? (condiciona `compose.yaml` y `OQ-API-7`)
- [ ] `OQ-ARCH-2` — Identidad de jugador: ¿auth o sesión efímera por código de sala?
- [ ] `OQ-ARCH-3` — Monorepo: ¿workspaces (pnpm/npm) con `shared` como paquete, o 3 proyectos con paths TS?
- [ ] `OQ-ARCH-4` — Makefile: nombres de targets y puertos (frontend/backend)
- [ ] `OQ-ARCH-5` — Reconexión: ¿qué pasa si un jugador cae a mitad de la fase de día?

### Glosario / dominio
- [ ] `OQ-ARCH-6` — Nomenclatura `Skill` vs `Dexterity` para *destreza* (barato ahora, caro tras escribir código)
- [ ] `OQ-1` (`GameRules`) — Corpus de las 124 cartas de módulo + implicaciones de copyright

### Datos de carta (`CardData`)
- [ ] `OQ-CD-1` — `symbols` de dorso y `possess`: ¿vocabulario cerrado por módulo o strings libres?
- [ ] `OQ-CD-2` — Encadenamiento de acciones: ¿hace falta noción de *secuencia* o basta `secretRef` + `place`?
- [ ] `OQ-CD-3` — Reparto de costes en acciones alternativas de cartas permanentes (`GR-14.6`); se cierra junto con `Protocol`
- [ ] `OQ-CD-4` — Fuente/formato del corpus (JSON/YAML), ubicación y estrategia de copyright
- [ ] `OQ-CD-5` — Modelo exacto de dados (`GR-11.2`): ¿suman al requisito o se comparan? Rango del dado
- [ ] `OQ-CD-6` — ¿Algún módulo tiene un dorso propio que cuente como peligro? (si sí, `red` → propiedad `isDanger`)

### Protocolo (`Protocol`)
- [ ] `OQ-API-2` — Lobby y ciclo de sala; elección de módulos; nº de grupos
- [ ] `OQ-API-5` — `stateChanged`: ¿snapshot completo o diffs incrementales?
- [ ] `OQ-API-6` — Granularidad de `resolveStep`: ¿un intent por micro-elección o compuesto por carta?
- [ ] `OQ-API-7` — Cómo se sirve `game.getState` según la persistencia (`OQ-ARCH-1`)

## Código e infra (nada empezado)

Bloqueado hasta cerrar los `OQ-ARCH-*`. Cuando se desbloquee:
- [ ] `infra/` — `compose.yaml` + Dockerfiles (backend, frontend)
- [ ] `Makefile` raíz — targets de docker compose (`OQ-ARCH-4`)
- [ ] `project/shared/` — tipos de vista + DTOs de intent (contratos, sin lógica)
- [ ] `project/backend/` — módulos Clean Architecture (`domain`/`application`/`infrastructure`), router tRPC, puerto de azar sembrado
- [ ] `project/frontend/` — SPA React + Vite

## Recordatorio de método (SDD)

- No se escribe código sin spec que lo respalde.
- Toda decisión se rastrea a un ID (`GR-*`, `ARCH-*`, `CD-*`, `API-*`).
- Si algo no está especificado, se pregunta; la duda vive como `OQ-*`.
- IDs estables: nunca se renumeran; lo revertido se marca `[OBSOLETA]`.
