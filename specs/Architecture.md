# Architecture — Paleo

> **Estado:** v1.0 — Stack y estructura definidos. Sin código todavía.
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
| habilidad (fuerza/percepción/destreza) | `Ability` (`Strength`/`Awareness`/`Skill`) † |
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

† `Skill` para *destreza* colisiona semánticamente con "ability" (skill ≈ ability en inglés) y puede leerse raro como `Ability.Skill`. Alternativa a evaluar: `Dexterity`. Ver `OQ-ARCH-6`.

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
- **ARCH-4.4** **Puertos y adaptadores:** todo lo que el dominio necesita del mundo exterior (persistencia, azar, tiempo, publicación de eventos) se declara como **interfaz en `domain`** y se implementa en `infrastructure`. La inyección de dependencias de NestJS vive únicamente en `infrastructure`.
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
- **ARCH-5.5** La estructura interna de `backend/` sigue `ARCH-4` (módulos con `domain`/`application`/`infrastructure`). La estructura interna de `frontend/` se define en `Frontend.md` y `Components.md`.

## ARCH-6. Infraestructura local

- **ARCH-6.1** El entorno local completo se levanta con **docker-compose**, definido en `infra/compose.yaml`.
- **ARCH-6.2** Los **Dockerfiles** necesarios (backend, frontend y los que se requieran) viven en `infra/`.
- **ARCH-6.3** El desarrollo local corre **dentro de contenedores**, con hot reload: código montado como volumen para frontend (Vite HMR) y backend (watch de Nest).
- **ARCH-6.4** El `Makefile` de la raíz es el **único punto de entrada** para operar el entorno. Ningún comando de docker compose se documenta o se ejecuta directamente en flujos normales de trabajo.
- **ARCH-6.5** Comandos mínimos que expone el `Makefile`: levantar, parar, reconstruir, ver logs, abrir shell en un servicio, y ejecutar tests. (Nombres exactos: `OQ-ARCH-4`.)

## ARCH-7. Información oculta y multijugador

- **ARCH-7.1** El backend **nunca envía a un cliente información que ese jugador no debe ver**: caras de cartas no reveladas (`GR-5.2`), contenido de la pila de descarte boca abajo (`GR-7.8`), mazo de secretos.
- **ARCH-7.2** El filtrado ocurre **al serializar en el servidor**, en `infrastructure`. Nunca en el cliente. El estado que sale del backend es una **vista personalizada por jugador**.
- **ARCH-7.3** La **fase de día es simultánea** (`GR-5.1`, `GR-5.6`): el modelo debe soportar elecciones concurrentes de varios jugadores y una **revelación atómica**. No es un modelo de turnos rotativos.
- **ARCH-7.4** El **orden de resolución de las cartas reveladas lo decide el grupo** (`GR-5.7`), igual que la elección de acción en las misiones (`GR-12.5`). Su modelo de interacción se define en `Protocol.md` (`API-9`): **coordinación por comunicación libre, sin quórum ni votación** — las decisiones son individuales y el servidor solo las serializa (`API-5.2`).

## ARCH-8. Testing

- **ARCH-8.1** **Cada regla del dominio tiene al menos un test que la referencia por su ID** (`GR-*`).
- **ARCH-8.2** El dominio se testea **sin infraestructura**: sin contenedores, sin red, sin base de datos.
- **ARCH-8.3** Gracias a `ARCH-4.6`, las partidas son **reproducibles con una semilla**: los tests de integración pueden replicar partidas completas de forma determinista.

---

## Cuestiones abiertas

- **OQ-ARCH-1** **Persistencia:** ¿el estado de partida vive solo en memoria del backend, o se persiste (Postgres/Redis)? Condiciona `infra/compose.yaml` y si hace falta un servicio de base de datos.
- **OQ-ARCH-2** **Identidad de jugador:** ¿hay autenticación, o basta con salas por código y un identificador efímero de sesión?
- **OQ-ARCH-3** **Monorepo:** ¿workspaces (pnpm/npm) con `shared` como paquete, o tres proyectos independientes con paths de TS? Condiciona los Dockerfiles.
- **OQ-ARCH-4** **Makefile:** nombres exactos de los targets y puertos expuestos (frontend, backend).
- **OQ-ARCH-5** **Reconexión:** ¿qué pasa si un jugador se desconecta a mitad de una fase de día? ¿La partida espera, se pausa, hay sustitución?
- **OQ-ARCH-6** **Nomenclatura de `Skill`:** *destreza* → `Skill` colisiona con "ability". ¿Se mantiene `Skill` o se renombra a `Dexterity` en el glosario (`ARCH-3.3`)? Barato de cambiar ahora, caro tras escribir código.
