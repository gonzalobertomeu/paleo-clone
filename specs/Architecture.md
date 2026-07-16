# Architecture — Paleo

> **Estado:** v1.2 — Stack, estructura, persistencia, sesión e infra definidos. Todas las `OQ-ARCH` cerradas. Backend organizado en `src/modules/*` (negocio) y `src/libs/*` (técnico) (`ARCH-5.8`–`ARCH-5.11`).
> **Alcance:** decisiones transversales de arquitectura: stack, capas, estructura de carpetas, infraestructura local y convenciones. Las reglas del juego están en `GameRules.md` (`GR-*`). El contrato de mensajes vivirá en `Protocol.md` (`API-*`).

## Convención de identificadores

IDs estables `ARCH-<sección>.<número>`. No se renumeran ni se reutilizan; una decisión revertida se marca `[OBSOLETA]` conservando su ID y enlazando a la que la sustituye.

---

## ARCH-1. Producto

- **ARCH-1.1** El producto es una **réplica jugable online multijugador** del juego de mesa Paleo.
- **ARCH-1.2** Multijugador **en red y en tiempo real**: varios clientes conectados a una misma partida servida por el backend. (Resuelve `OQ-3` de `GameRules.md`.)
- **ARCH-1.3** El backend es la **autoridad única** sobre el estado de la partida y sobre la legalidad de toda acción. El cliente nunca decide reglas.

## ARCH-2. Stack

- **ARCH-2.1** **Lenguaje:** TypeScript en todo el proyecto (frontend, backend y código compartido).
- **ARCH-2.2** **Frontend:** SPA en **React + TypeScript**, empaquetada con **Vite**.
- **ARCH-2.3** **Backend:** **NestJS** con TypeScript.
- **ARCH-2.4** **Comunicación front↔back:** **tRPC sobre WebSockets**. El transporte por defecto para toda la interacción de partida es WebSocket (subscriptions incluidas), no HTTP polling.
- **ARCH-2.5** **Tipado extremo a extremo:** el router de tRPC es la única definición del contrato. El cliente deriva sus tipos del router; no se duplican tipos de request/response a mano.
- **ARCH-2.6** **Infraestructura local:** **docker-compose**.
- **ARCH-2.7** **Router de comandos:** un **Makefile** en la raíz expone los comandos de docker compose. Es el punto de entrada único para levantar, parar y operar el entorno local.

## ARCH-3. Idioma

- **ARCH-3.1** **Todo el código se escribe en inglés**: identificadores, nombres de archivo, tipos, comentarios, mensajes de error y de log.
- **ARCH-3.2** Las **specs** (`specs/`) se escriben en español. Es la única excepción.
- **ARCH-3.3** Los términos de dominio se traducen de forma **consistente y fija**. Glosario normativo (español de las reglas → inglés del código):

| Reglas (es) | Código (en) |
|---|---|
| grupo | `Group` |
| persona | `Person` |
| mazo personal | `Deck` |
| carta de acción | `ActionCard` |
| carta de peligro | `HazardCard` |
| carta de misión | `MissionCard` |
| carta de secreto | `SecretCard` |
| sueño | `Dream` |
| idea | `Idea` |
| herramienta | `Tool` |
| recurso (comida/madera/piedra) | `Resource` (`Food`/`Wood`/`Stone`) |
| herida | `Wound` |
| calavera | `Skull` |
| ficha de victoria | `VictoryToken` |
| habilidad (fuerza/percepción/destreza) | `Ability` (`Strength`/`Awareness`/`Craftsmanship`) † |
| banco de trabajo | `Workbench` |
| cementerio | `Cemetery` |
| almacén | `Storage` |
| campamento base | `BaseCamp` |
| naturaleza | `Wilderness` |
| fase de día / de noche | `DayPhase` / `NightPhase` |
| ayudar | `help` |
| ignorar | `ignore` |
| dormir | `sleep` |
| craftear | `craft` |

† **Nota sobre *destreza*** (`OQ-ARCH-6`, resuelta). Se descartaron tres candidatos antes de `Craftsmanship`:
- `Skill` colisiona semánticamente con "ability" (skill ≈ ability en inglés): `Ability.Skill` se lee redundante.
- `Dexterity` connota **agilidad**, no fabricación, que es el uso real de la destreza en Paleo.
- `Tool`/`Tools` colisiona con `Tool` = **herramienta**, el objeto crafteable (`GR-10`); dos conceptos distintos separados solo por una `s`. `Worker` colisiona con `Person`.

`Craftsmanship` nombra la aptitud de fabricar sin chocar con `Tool` (el objeto) ni con `craft` (el verbo), y forma familia con él: se usa `Craftsmanship` para `craft`.

†† **Nota sobre *fuerza*.** Se mantiene `Strength` y se descartan `Attack`/`Hunting`: nombran un **uso** (cazar, pelear) y no la **capacidad**. La fuerza también se exige para acarrear, empujar o escalar; un nombre atado a la caza mentiría en esas cartas.

## ARCH-4. Clean Architecture

- **ARCH-4.1** La arquitectura por defecto es **Clean Architecture**, con **separación primero por módulo** y, dentro de cada módulo, por capa.
- **ARCH-4.2** Cada módulo tiene exactamente estas tres capas:

```
<module>/
├── domain/          # Entidades, value objects, reglas puras, puertos (interfaces).
├── application/     # Casos de uso. Orquesta el dominio. Depende solo de domain.
└── infrastructure/  # Adaptadores: tRPC, persistencia, WebSocket, RNG, reloj.
```

- **ARCH-4.3** **Regla de dependencia:** las dependencias apuntan **siempre hacia adentro**.
  `infrastructure → application → domain`. **Nunca al revés.**
  `domain` no importa nada de `application` ni de `infrastructure`, ni de NestJS, ni de tRPC, ni de ninguna librería de I/O.
- **ARCH-4.4** **Puertos y adaptadores:** todo lo que el dominio necesita del mundo exterior (persistencia, azar, tiempo, publicación de eventos) se declara como **interfaz en `domain`** y se implementa en `infrastructure` (matizado por `ARCH-5.11`). La inyección de dependencias de NestJS vive en el **anillo técnico externo** —la capa `infrastructure` de los módulos y los `libs/*` (`ARCH-5.10`)—, **nunca** en `domain` ni `application`.
- **ARCH-4.5** **El dominio es puro y determinista** (`estado + acción → nuevo estado`): sin I/O, sin reloj, sin aleatoriedad implícita, sin efectos secundarios.
- **ARCH-4.6** **La aleatoriedad se inyecta**: barajado (`GR-3.6`, `GR-13.1`) y dados (`GR-11.2`) pasan por un puerto de azar con semilla, para poder reproducir y testear partidas completas.
- **ARCH-4.7** La comunicación entre módulos se hace a través de sus **casos de uso** o de eventos de dominio, nunca alcanzando la capa `domain` o `infrastructure` de otro módulo.

## ARCH-5. Estructura de carpetas

```
paleo/
├── CLAUDE.md            # Ruteo, metodología y arquitectura para el agente.
├── Makefile             # Router de comandos de docker compose (ARCH-2.7).
├── specs/               # Fuente de verdad. Sin código.
├── infra/               # Infraestructura local (ARCH-6).
│   ├── compose.yaml
│   └── <Dockerfiles>
└── project/             # Todo el código de aplicación.
    ├── backend/         # NestJS. Autoridad de reglas y estado (ARCH-1.3).
    ├── frontend/        # SPA React + Vite.
    └── shared/          # Contratos y tipos comunes a front y back.
```

- **ARCH-5.1** `infra/` está **al mismo nivel** que `project/` y `specs/`.
- **ARCH-5.2** El `Makefile` vive en la **raíz** del repositorio, aunque `compose.yaml` viva en `infra/`.
- **ARCH-5.3** **Dependencias permitidas:** `frontend → shared`, `backend → shared`. **Prohibidas:** `frontend → backend`, `backend → frontend`, y cualquier importación desde `shared` hacia `frontend` o `backend`.
- **ARCH-5.4** `shared/` contiene únicamente **contratos**: tipos del protocolo, DTOs y tipos de dominio expuestos al cliente. Sin lógica de reglas: el motor vive en `backend/` (`ARCH-1.3`).
- **ARCH-5.5** La estructura interna de `backend/` sigue `ARCH-4` (módulos con `domain`/`application`/`infrastructure`) y se organiza en dos raíces, `src/modules/*` y `src/libs/*` (`ARCH-5.8`). La estructura interna de `frontend/` se define en `Frontend.md` y `Components.md`.
- **ARCH-5.6** **Monorepo con `pnpm` workspaces** (resuelve `OQ-ARCH-3`). `frontend`, `backend` y `shared` son **paquetes reales** del workspace, y `shared` se consume como dependencia declarada, no por paths de TypeScript.
  **Motivo:** el gestor de paquetes hace cumplir `ARCH-5.3` por sí solo — un import prohibido (`frontend → backend`) falla al resolver porque no es una dependencia declarada, en lugar de compilar silenciosamente. `pnpm` sobre `npm` por su resolución estricta: sin *hoisting*, no existen dependencias fantasma.
- **ARCH-5.7** El workspace se declara en `pnpm-workspace.yaml` en la **raíz**, junto al `Makefile` (`ARCH-5.2`). Los `package.json` de cada paquete viven en `project/<paquete>/`.
- **ARCH-5.8** **Backend: `modules/` vs `libs/`.** El `src/` del backend se divide en dos raíces: **`src/modules/*`** (lógica de negocio) y **`src/libs/*`** (bloques técnicos: configuración, dependencias y adaptadores de librerías como tRPC, Redis o el generador de azar). **Toda regla del juego vive en `modules/*`** (`ARCH-1.3`); en `libs/*` no hay ninguna.
- **ARCH-5.9** **`modules/*`** son los módulos de Clean Architecture (`ARCH-4.2`): cada uno con `domain`/`application`/`infrastructure`. Un **adaptador que implementa un puerto del dominio** (repositorio, azar) vive en la **`infrastructure` de su módulo** y **usa** los `libs/*` que necesite.

```
backend/src/
├── modules/               # Lógica de negocio (ARCH-1.3)
│   ├── room/{domain,application,infrastructure}/
│   ├── game/
│   │   ├── domain/         # reduce, GameState, puertos (Rng, GameRepository)
│   │   ├── application/    # casos de uso
│   │   └── infrastructure/ # adaptadores: redis-game-repository, seeded-rng (usan libs/*)
│   └── view/application/   # proyección por jugador (BE-11)
├── libs/                  # Técnico y agnóstico de negocio (ARCH-5.10)
│   ├── trpc/              # contexto, adaptador WS, sirve el appRouter de shared
│   ├── redis/            # cliente/conexión Redis, genérico
│   ├── rng/             # PRNG puro (mulberry32), sin interfaz de dominio
│   └── config/         # configuración/entorno
├── app.module.ts       # composición Nest
└── main.ts             # composition root (cablea AppService en libs/trpc)
```

- **ARCH-5.10** **`libs/*`** son bloques **técnicos y agnósticos de negocio**: transporte (tRPC), clientes externos (Redis), configuración y utilidades genéricas (p. ej. un PRNG). **`libs/*` NUNCA importa `modules/*`**: es hoja, reusable y sin conocimiento del dominio. Dirección de dependencia: **`modules → libs → shared`**.
- **ARCH-5.11** **Regla de puertos revisada** (matiza `ARCH-4.4`): el **puerto** (interfaz) se declara en `domain`; el **adaptador** que lo implementa vive en la `infrastructure` del módulo (`ARCH-5.9`) y **delega en la capacidad genérica** que ofrece un `lib` (que **no** conoce el puerto). Así un `lib` (p. ej. `libs/rng`, `libs/redis`) expone una función o cliente **sin depender del dominio**, y el módulo lo **enchufa** a su puerto. Esto mantiene `libs/* ↛ modules/*` (`ARCH-5.10`) sin sacrificar la inversión de dependencias (`ARCH-4.4`).

## ARCH-6. Infraestructura local

- **ARCH-6.1** El entorno local completo se levanta con **docker-compose**, definido en `infra/compose.yaml`.
- **ARCH-6.2** Los **Dockerfiles** necesarios (backend, frontend y los que se requieran) viven en `infra/`.
- **ARCH-6.3** El desarrollo local corre **dentro de contenedores**, con hot reload: código montado como volumen para frontend (Vite HMR) y backend (watch de Nest).
- **ARCH-6.4** El `Makefile` de la raíz es el **único punto de entrada** para operar el entorno. Ningún comando de docker compose se documenta o se ejecuta directamente en flujos normales de trabajo.
- **ARCH-6.5** Comandos mínimos que expone el `Makefile`: levantar, parar, reconstruir, ver logs, abrir shell en un servicio, y ejecutar tests. Nombres exactos en `ARCH-6.7`.
- **ARCH-6.6** **Servicios de `compose.yaml`:** `frontend`, `backend` y `redis` (`ARCH-9.1`). No hay servicio de base de datos relacional.
- **ARCH-6.7** **Targets del `Makefile`** (resuelve `OQ-ARCH-4`), verbos cortos alineados con la nomenclatura de docker compose:

| Target | Efecto |
|---|---|
| `make up` | Levanta todos los servicios |
| `make down` | Para y limpia |
| `make build` | Reconstruye las imágenes |
| `make logs` | Logs de todos los servicios |
| `make sh s=<servicio>` | Abre una shell en un servicio |
| `make test` | Ejecuta los tests |

- **ARCH-6.8** **Puertos expuestos:** `frontend` **5173** (por defecto de Vite), `backend` **3000** (por defecto de Nest), `redis` **6379**.

## ARCH-7. Información oculta y multijugador

- **ARCH-7.1** El backend **nunca envía a un cliente información que ese jugador no debe ver**: caras de cartas no reveladas (`GR-5.2`), contenido de la pila de descarte boca abajo (`GR-7.8`), mazo de secretos.
- **ARCH-7.2** El filtrado ocurre **al serializar en el servidor**, en `infrastructure`. Nunca en el cliente. El estado que sale del backend es una **vista personalizada por jugador**.
- **ARCH-7.3** La **fase de día es simultánea** (`GR-5.1`, `GR-5.6`): el modelo debe soportar elecciones concurrentes de varios jugadores y una **revelación atómica**. No es un modelo de turnos rotativos.
- **ARCH-7.4** El **orden de resolución de las cartas reveladas lo decide el grupo** (`GR-5.7`), igual que la elección de acción en las misiones (`GR-12.5`). Su modelo de interacción se define en `Protocol.md` (`API-9`): **coordinación por comunicación libre, sin quórum ni votación** — las decisiones son individuales y el servidor solo las serializa (`API-5.2`).

## ARCH-8. Testing

- **ARCH-8.1** **Cada regla del dominio tiene al menos un test que la referencia por su ID** (`GR-*`).
- **ARCH-8.2** El dominio se testea **sin infraestructura**: sin contenedores, sin red, sin base de datos.
- **ARCH-8.3** Gracias a `ARCH-4.6`, las partidas son **reproducibles con una semilla**: los tests de integración pueden replicar partidas completas de forma determinista.

## ARCH-9. Persistencia, sesión y reconexión

- **ARCH-9.1** **El estado de partida se persiste en Redis** (resuelve `OQ-ARCH-1`). No hay base de datos relacional: el estado de una partida es, en el fondo, un documento único, y no se necesitan consultas ni historial en v1.
  **Consecuencia:** el estado **sobrevive a un reinicio del backend**, no solo a una caída del cliente.
- **ARCH-9.2** **La persistencia es un puerto, no una dependencia del dominio** (`ARCH-4.4`). El dominio declara una interfaz de repositorio de partida; el adaptador de Redis vive en `infrastructure`. El dominio sigue siendo puro y determinista (`ARCH-4.5`): no sabe que Redis existe.
- **ARCH-9.3** **Identidad efímera, sin autenticación** (resuelve `OQ-ARCH-2`). No hay registro, contraseñas ni tabla de usuarios. Una sala se identifica por un **código de acceso** (`API-2.1`) y un jugador por un **`playerId` opaco** que el cliente conserva localmente y presenta al conectar.
- **ARCH-9.4** El `playerId` es la **única credencial**: quien lo presenta recupera esa silla. Es un identificador de sesión, no una identidad verificada; es adecuado para partidas privadas entre personas que ya se conocen, y **no** resiste un atacante que adivine o robe el token. Elevar esto a autenticación real es un cambio de producto, no un detalle de implementación.
- **ARCH-9.5** **Reconexión: la partida espera** (resuelve `OQ-ARCH-5`). Si un jugador se desconecta, **su silla se conserva** y la partida no avanza sin él. No hay sustitución, no hay expulsión y **no hay temporizador**.
  **Motivo:** la fase de día es simultánea con revelación atómica (`ARCH-7.3`, `GR-5.6`): el resto no puede pasar de la revelación hasta que él elija. Y en un cooperativo, una elección automática por *timeout* puede perder la partida de los demás; el juego físico tampoco tiene reloj.
- **ARCH-9.6** Al reconectar, el cliente presenta su `playerId` y **rehace la vista completa** con `game.getState` (`API-3.2`). La vista por jugador es **autosuficiente**: un snapshot basta para reconstruir la UI sin reproducir historial de eventos.
- **ARCH-9.7** Gracias a `ARCH-9.1`, la reconexión funciona igual tras una caída **del servidor** que del cliente. (Resuelve `OQ-API-7` de `Protocol.md`.)

---

## Cuestiones abiertas

*(Ninguna abierta. Se conservan los IDs de las resueltas: nunca se renumeran ni se reutilizan.)*

- **OQ-ARCH-1** [RESUELTA → `ARCH-9.1`, `ARCH-9.2`] **Persistencia:** decidido — **Redis**, detrás de un puerto de repositorio. Sin base de datos relacional. `compose.yaml` incorpora un servicio `redis` (`ARCH-6.6`).
- **OQ-ARCH-2** [RESUELTA → `ARCH-9.3`, `ARCH-9.4`] **Identidad de jugador:** decidido — **sesión efímera**, sin autenticación: código de sala + `playerId` opaco conservado por el cliente.
- **OQ-ARCH-3** [RESUELTA → `ARCH-5.6`, `ARCH-5.7`] **Monorepo:** decidido — **`pnpm` workspaces** con `shared` como paquete real, para que la regla de dependencias (`ARCH-5.3`) la haga cumplir el gestor de paquetes.
- **OQ-ARCH-4** [RESUELTA → `ARCH-6.7`, `ARCH-6.8`] **Makefile:** decidido — targets `up`/`down`/`build`/`logs`/`sh`/`test`; puertos 5173 (frontend), 3000 (backend), 6379 (redis).
- **OQ-ARCH-5** [RESUELTA → `ARCH-9.5`, `ARCH-9.6`] **Reconexión:** decidido — **la partida espera**. La silla se conserva, sin sustitución ni *timeout*; al volver, resync por snapshot completo.
- **OQ-ARCH-6** [RESUELTA → `ARCH-3.3`] **Nomenclatura de *destreza*:** decidido — **`Craftsmanship`**. Se descartan `Skill` (redundante con "ability"), `Dexterity` (connota agilidad, no fabricación) y `Tool`/`Tools` (colisiona con la herramienta crafteable). *Fuerza* se mantiene como **`Strength`**: nombra la capacidad, no su uso.
