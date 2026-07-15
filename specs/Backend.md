# Backend — Paleo

> **Estado:** v0.1 — Motor de reglas y máquina de estados día/noche que ejecuta el protocolo. Módulos, puertos, reductor puro, resolución paso a paso, azar sembrado, persistencia y proyección por jugador. Cierra `OQ-API-5` (formato de `stateChanged`) y `OQ-API-6` (granularidad de `resolveStep`).
> **Alcance:** define **cómo** el backend implementa las reglas (`GR-*`) y sirve el contrato (`API-*`): qué módulos existen, qué puertos declara el dominio, cómo es la máquina de estados, cómo se resuelve una carta, cómo se inyecta el azar, cómo se persiste y cómo se serializa la vista por jugador. **No** redefine reglas (`GameRules.md`), ni el contrato de mensajes (`Protocol.md`), ni la forma de las cartas (`CardData.md`): los referencia.
> **Autoridad:** el backend es la **autoridad única** sobre estado y legalidad (`ARCH-1.3`). Todo intent es una intención que el servidor valida; el cliente nunca aplica reglas.

## Convención de identificadores

IDs estables `BE-<sección>.<número>`. No se renumeran ni se reutilizan; un elemento retirado se marca `[OBSOLETO]` conservando su ID. Todos los nombres de tipo, campo, caso de uso, puerto y evento se escriben **en inglés** (`ARCH-3.1`), respetando el glosario (`ARCH-3.3`).

---

## BE-1. Alcance y posición en la arquitectura

- **BE-1.1** El backend es NestJS + TypeScript (`ARCH-2.3`) y sigue **Clean Architecture: primero por módulo, dentro por capa** (`ARCH-4.1`, `ARCH-4.2`). Cada módulo tiene `domain/`, `application/`, `infrastructure/`, con dependencias siempre hacia adentro (`ARCH-4.3`).
- **BE-1.2** El backend es la **autoridad única** (`ARCH-1.3`): toda legalidad se decide aquí. El cliente puede deshabilitar afordancias por UX (`API-4.5`), pero la validación real es del backend (`API-5.1`).
- **BE-1.3** El backend depende solo de `shared` (`ARCH-5.3`), del que consume tipos de vista y de intent (`API-1.3`). El **modelo interno del dominio nunca cruza el límite `shared/`**: lo que sale es la vista serializada por jugador (`BE-11`).
- **BE-1.4** Esta spec es **normativa en semántica**, no en sintaxis: los nombres de tipo TS exactos viven en el código; aquí se fijan responsabilidades, límites y la máquina de estados.

## BE-2. Módulos del backend

Tres módulos, con un límite claro entre **quién juega**, **las reglas** y **qué ve cada quién** (resuelve la descomposición; `ARCH-4.1`):

- **BE-2.1** **`room`** — ciclo de vida de la **sala** y la **sesión efímera**. Posee: creación/entrada/salida de sala (`API-2.4`), el `playerId` opaco como única credencial (`ARCH-9.3`, `ARCH-9.4`), el estado de sala (esperando/en juego/terminada), la asociación conexión↔jugador↔silla y la reconexión (`ARCH-9.5`, `API-3.3`). Arranca la partida (`room.start`) invocando al módulo `game`. **No** contiene reglas del juego.
- **BE-2.2** **`game`** — el **motor de reglas**: entidades y value objects del dominio (`GR-*`), la **máquina de estados** día/noche (`BE-5`), el **reductor puro** (`BE-3`), los puertos (`BE-4`) y los casos de uso que ejecutan los intents (`BE-7`). Es la **autoridad** (`ARCH-1.3`). Su `domain/` es puro y determinista (`ARCH-4.5`).
- **BE-2.3** **`view`** — la **proyección por jugador**: transforma el estado interno de `game` en la `GameStateView` filtrada que cada jugador puede ver (`ARCH-7.1`, `ARCH-7.2`, `API-4`). Aísla en un solo lugar la regla de información oculta (`BE-11`). Depende de los **tipos de estado de `game`** (para leerlos) y de los **tipos de vista de `shared`** (para emitirlos); no muta estado ni decide reglas.
- **BE-2.4** **Dependencias entre módulos** (`ARCH-4.7`): la comunicación es a través de **casos de uso** o **eventos de dominio**, nunca alcanzando el `domain`/`infrastructure` ajeno. `room → game` (arranca y consulta la partida). `view → game` (lee el estado para proyectarlo). **Nunca** `game → room` ni `game → view`: el motor no sabe quién lo observa ni cómo se sirve.
- **BE-2.5** La **inyección de dependencias de NestJS vive solo en `infrastructure`** (`ARCH-4.4`). `domain` y `application` no importan NestJS.

## BE-3. El dominio como reductor puro

- **BE-3.1** El corazón de `game/domain` es una **función de reducción pura** (`ARCH-4.5`):
  `reduce(state, command) → { state, events } | error`.
  A partir de un estado y un **comando** (la forma interna de un intent ya autenticado), produce el **nuevo estado** y la **lista de eventos de dominio** (`BE-12`), o un **error tipado** (`BE-13`) sin mutar nada (`API-5.1`).
- **BE-3.2** **Pureza total** (`ARCH-4.5`): sin I/O, sin reloj, sin aleatoriedad implícita, sin efectos secundarios. Todo lo que el dominio necesita del exterior es **argumento o parte del estado**, nunca una llamada oculta. En particular, el azar es **parte del estado** (`BE-9`): el reductor es función pura de `(state, command)`.
- **BE-3.3** El estado es un **agregado único** `GameState` (`BE-6`) por partida: coherente con que una partida sea un documento único en Redis (`ARCH-9.1`). No hay event sourcing en v1: se persiste el **estado materializado**, no un log de eventos (`BE-10`). Los eventos existen como **salida de `reduce`** para alimentar la subscription (`BE-12`), no como fuente de verdad reconstruible — esa es siempre la vista/snapshot (`API-12.8`).
- **BE-3.4** **Un comando se aplica de forma atómica y aislada** (`BE-14`): aunque la fase de día sea simultánea (`ARCH-7.3`) y varios intents lleguen a la vez, se **linealizan** y el reductor procesa **uno cada vez**. La concurrencia está en la *llegada*, no en la *aplicación*.
- **BE-3.5** Los datos de carta (`CD-*`) son **corpus estático** referenciado por `id` (`CD-2.1`); el `GameState` guarda **ids de carta**, no sus caras. El reductor consulta el corpus (inyectado como dato de solo lectura, `BE-4.5`) para conocer requisitos, costes, recompensas y efectos de una carta al resolverla.

## BE-4. Puertos (interfaces del dominio)

Todo lo que el motor necesita del mundo exterior se declara como **interfaz en `game/domain`** y se implementa en `game/infrastructure` (`ARCH-4.4`):

- **BE-4.1** **`GameRepository`** — persistencia del agregado (`ARCH-9.2`). Carga y guarda el `GameState` completo por identificador de partida. El dominio declara la interfaz; el **adaptador Redis** vive en `infrastructure` (`BE-10`). El dominio no sabe que Redis existe (`ARCH-9.2`).
- **BE-4.2** **`Rng`** — fuente de azar **sembrada y determinista** (`ARCH-4.6`). Es una **función pura** de `(seed, drawIndex) → valor`, no un generador con estado interno oculto. El **estado del stream** (semilla + nº de extracciones consumidas) vive en el `GameState` (`BE-9`), no en el puerto. Así se concilian `ARCH-4.6` (azar inyectado, sustituible en test) y `ARCH-4.5` (dominio puro): se **inyecta el algoritmo**, pero **evaluar el azar es una función pura del estado**.
- **BE-4.3** El dominio **no declara un puerto de reloj**: la reconexión espera sin *timeout* (`ARCH-9.5`), la fase de día no tiene reloj (`ARCH-9.5` motivo) y nada en las reglas depende del tiempo real. Si un módulo futuro lo exigiera, se añadiría como puerto (`ARCH-4.4`) y se documentaría aquí.
- **BE-4.4** El dominio **no llama a un puerto de publicación de eventos**: `reduce` **devuelve** los eventos como datos (`BE-3.1`), y la publicación filtrada por jugador es responsabilidad de `application`/`infrastructure` (`BE-12`). Esto mantiene el dominio puro (`ARCH-4.5`) sin renunciar a que la publicación sea un adaptador (`ARCH-4.4`).
- **BE-4.5** El **corpus de cartas** (`CD-*`) se inyecta al dominio como **dato de solo lectura** (un catálogo indexado por `id`), no como puerto de I/O: es constante durante la partida (`BE-3.5`). Su carga (fichero, formato, copyright) es `infrastructure` y queda fuera de esta spec (`OQ-CD-4`).

## BE-5. Máquina de estados día/noche

La partida es una **máquina de estados explícita**. El `GameState` lleva un discriminante `phase` y, dentro, un `subState`. Toda transición la dispara **un comando** (intent de jugador) **o un paso automático del servidor** (revelación, alimentación autoaplicada, nuevo día): el dominio marca la transición; nunca un cliente.

- **BE-5.1** **Fases:** `day` · `night` · `newDay` (transitoria, paso de servidor) · `ended` (terminal). El **lobby** previo al arranque es estado del módulo `room` (`BE-2.1`), no del motor: `game` nace en `day`.
- **BE-5.2** **`day` — sub-estados:** `choosing` (elección concurrente, `API-6`) y `resolving` (revelación atómica hecha, resolución carta a carta, `API-7`–`API-9`). Una fase de día son **múltiples turnos** (`GR-5.1`); cada turno recorre `choosing → resolving`.
- **BE-5.3** **`day.choosing`** (`API-6`): cada grupo **despierto** con cartas elige 1 de sus 3 superiores con `day.chooseCard` (`GR-5.2`, `API-6.1`); las 2 no elegidas vuelven al tope en el orden pedido (`GR-5.3`). La elegida queda **boca abajo** frente al grupo (aún oculta a todos, `API-4.2`). Un grupo puede **dormir temprano** con `day.sleepEarly` (`GR-5.10`, `API-6.3`). Un grupo sin cartas ya está **dormido** (`GR-5.9`, `API-6.4`): no elige.
- **BE-5.4** **Revelación atómica** (paso de servidor, `API-7`, `GR-5.6`): cuando **todos los grupos despiertos** han elegido, el dominio revela **todas las cartas a la vez**, emite `revealed` (`API-12.3`) y transiciona a `day.resolving`. No existe intent de revelar (`ARCH-7.3`). Si solo quedaba 1 despierto, se revela igual (`API-7.4`).
- **BE-5.5** **`day.resolving`** (`API-8`, `API-9`): las cartas reveladas se resuelven **de una en una** (`BE-8`). El **orden lo coordina el grupo fuera de banda** (`GR-5.7`, `API-9.1`): el servidor no lo impone; solo garantiza **una resolución activa a la vez** (`API-9.2`) y **serializa**. Cada grupo despierto gasta **exactamente una** carta revelada del turno resolviéndola, ayudando o ignorándola (`GR-5.12`, `API-8.7`).
- **BE-5.6** **Fin de turno:** cuando todos los grupos despiertos han **gastado** su carta revelada (`API-9.4`), termina el turno. Si algún grupo **sigue despierto** (conserva cartas), empieza un nuevo turno `day.choosing`. Si **todos duermen** (`GR-5.11`), transiciona a `night` (`BE-5.7`).
- **BE-5.7** **`night` — sub-estados:** `feeding` (`GR-12.2`) → `missions` (misiones y acciones nocturnas, `GR-12.3`, `GR-12.7`). La abre un `nightStarted` de servidor (`API-10.1`).
  - **`night.feeding`** (`API-10.2`): el servidor calcula la comida necesaria (1 por persona de cada grupo, `GR-12.2`). Si el almacén alcanza, **autoaplica** el pago y avanza. Si no alcanza, **quién queda sin alimentar lo coordina la tribu** y se enacta con intents individuales (sin quórum, `API-5.2`): cada persona sin alimentar coloca 1 calavera (`GR-4.2`) y **no muere**.
  - **`night.missions`** (`API-10.3`, `API-10.4`): se recorren las **cartas de misión** (`GR-12.3`) y las cartas en juego con **símbolo de luna** (`CD-5.10` `timing: night`, `GR-12.7`). Para cada una, la tribu elige **1 opción** con `night.chooseMissionAction` (sin quórum, cualquier jugador la enacta, `GR-12.5`) y se resuelve por la sub-máquina de `BE-8`. Las misiones **no se pueden ignorar** (`GR-12.4`) y **permanecen en juego** salvo que digan lo contrario (`GR-12.6`, `CD-5.8` `keep`).
- **BE-5.8** **`newDay`** (paso de servidor, transitorio, `API-11`, `GR-13`): baraja juntas ambas pilas de descarte con el `Rng` sembrado (`BE-9`, `GR-13.1`) y reparte de nuevo boca abajo lo más equitativamente posible (`GR-13.2`); las cartas del cementerio **no vuelven** (`GR-13.3`). Emite `newDayStarted` y transiciona a `day.choosing`.
- **BE-5.9** **`ended`** (terminal, `API-11.3`, `GR-4`): al colocarse la **5ª ficha de victoria** (victoria, `GR-4.1`) o la **5ª calavera** (derrota, `GR-4.2`). Puede dispararse **en cualquier transición**, no solo de noche. Empate simultáneo (5ª calavera y 5ª ficha a la vez) → **victoria** (`GR-4.3`). Emite `gameEnded` con el resultado. Ningún comando de partida es legal después.
- **BE-5.10** **La legalidad de un comando depende de `(phase, subState)`**: un intent fuera de su fase se rechaza con `NOT_YOUR_PHASE` (`API-13.2`). La máquina de estados es la primera guardia de validación (`BE-13`).

## BE-6. Modelo de estado interno (`GameState`)

Forma **interna** del agregado (nunca sale del backend, `BE-1.3`). Normativa en contenido, no en sintaxis:

- **BE-6.1** **`groups`** — indexado por `groupId` (1:1 con jugador en v1, `API-2.3`). Cada grupo: `playerId`, `persons[]` (cada persona: id de corpus, heridas colocadas, herramientas otorgadas ya tomadas), `tools[]` (fichas poseídas), `deck` (lista **ordenada** de ids boca abajo), `status` (`awake` | `asleep`), y por turno: `chosenCard?` (elegida sin revelar), `revealedCard?`, `cardSpent` (bool, `GR-5.12`).
- **BE-6.2** **Mazos ocultos** — `personDeck`, `dreamDeck`, `ideaDeck`, `secretDeck`: listas **ordenadas** de ids. De ellos la vista solo expone **tamaño**, nunca contenido (`API-4.2`).
- **BE-6.3** **Zonas comunes** — `storage` (`{ food, wood, stone }`, `GR-7.3`, límite por componente `GR-7.10`), `workbench` (huecos de idea visibles, `GR-10.6`), `nightBoard` (`{ skulls, victoryTokens }`, `GR-4`), `discardFaceDown[]` y `discardFaceUp[]` (pilas del tablero de Naturaleza, `GR-7.8`, `GR-7.9`), `cemetery[]` (fuera de la partida, `GR-7.12`).
- **BE-6.4** **En juego** — `missions[]` (cartas de misión boca arriba, `GR-3.7`) e `inPlay[]` (cartas permanentes con acciones reactivables, `CD-5.9`, `GR-14.5`), cada una con su zona.
- **BE-6.5** **Contexto de fase** — `phase`, `subState`, y el **contexto del turno de día**: cartas reveladas pendientes de gastar, la **resolución activa** si la hay (`activeResolution`, `BE-8`) y su `pendingStep`. En noche, la **cola de misiones/acciones** por resolver y su `activeResolution`.
- **BE-6.6** **`rng`** — `{ seed, draws }`: la semilla de la partida y el nº de extracciones ya consumidas (`BE-9`). Es parte del estado y se persiste (`BE-10`), garantizando reproducibilidad (`ARCH-8.3`) y continuidad tras reinicio del backend (`ARCH-9.7`).
- **BE-6.7** **`composition`** — qué módulos se cargaron (`base` + A/B en v1, `CD-12.3`) y sus retiros/misión (`CD-12.1`). Referencia el corpus (`BE-4.5`); no lo duplica.
- **BE-6.8** El `GameState` es **serializable de forma plana** (ids, números, enums): no contiene funciones, clases con comportamiento oculto ni referencias al corpus, para poder escribirse/leerse íntegro en Redis (`BE-10`).

## BE-7. Casos de uso (application) e intents

Cada mutation del protocolo (`API-*`) tiene **un caso de uso** en `application` que: (1) autentica el `playerId` contra la silla (`ARCH-9.4`), (2) traduce el intent a un **comando** de dominio, (3) invoca `reduce` (`BE-3.1`), (4) persiste el nuevo estado (`BE-10`) y (5) publica vista + eventos (`BE-12`). La **legalidad** la decide el dominio, no el caso de uso.

- **BE-7.1** **`room`** (`API-2.4`): `room.create`, `room.join`, `room.leave`, `room.start`. `room.start` construye el `GameState` inicial: baraja Personas/Sueños/Ideas y el mazo de día con el `Rng` sembrado (`GR-3.3`, `GR-3.5`, `GR-3.6`), reparte (`GR-3.4`, `GR-3.6`), coloca comida y banco inicial (`GR-3.1`, `GR-3.2`) y misiones (`GR-3.7`). El detalle de lobby es `OQ-API-2`.
- **BE-7.2** **Consulta** `game.getState` (query, `API-3.2`): sirve la `GameStateView` del jugador desde el repositorio (`BE-4.1`), autoritativa tras caída de cliente o de servidor (`API-3.4`, `ARCH-9.7`). No muta estado.
- **BE-7.3** **Día — elección:** `day.chooseCard` (`API-6.1`), `day.sleepEarly` (`API-6.3`). El dormir por vaciado (`GR-5.9`) y la revelación (`API-7`) son **pasos de servidor** dentro de `reduce`, no casos de uso invocables.
- **BE-7.4** **Día — resolución:** `day.chooseCardAction` (`resolveOption` | `help` | `ignore`, `API-8.1`), `day.declareHelp` (`API-8.2`) y `day.resolveStep` (`API-8.4`, `BE-8`). La **tirada de dados** es paso de servidor (`API-8.3`, `BE-9`), no intent.
- **BE-7.5** **Noche:** `night.chooseMissionAction` (`API-10.3`) y `day.resolveStep` reutilizado para los pasos de la resolución nocturna (`BE-8`). El reparto de "sin alimentar" (`API-10.2`) se enacta con intents individuales que el dominio serializa.
- **BE-7.6** Un caso de uso **nunca** confía en el cliente para una decisión de reglas: recalcula requisitos, pagabilidad, legalidad de opción y momento de la ayuda (`API-9.5`). Si el comando es ilegal, devuelve el error tipado (`BE-13`) y **no** persiste (`API-5.1`).

## BE-8. Resolución de una carta — sub-máquina de pasos (`pendingStep`)

Resolver una carta **no es un único intent**: es una **secuencia dirigida por el servidor** (cierra `OQ-API-6`). En cada momento hay **como mucho un `pendingStep`** por resolución activa; el servidor lo publica en la vista (`API-4.5`), el jugador responsable lo responde con `day.resolveStep`, y el servidor computa el **siguiente paso** o cierra la carta. Es la granularidad **fina, dirigida por servidor**: máxima validabilidad y soporte natural de resolución parcial (`API-8.5`).

- **BE-8.1** **Apertura** (`API-8.1`, `API-9.2`): el propietario elige con `day.chooseCardAction`:
  - `resolveOption({ optionId })` → la resolución se vuelve **activa** (`resolutionOpened`, `API-12.6`); mientras haya una activa, abrir otra se rechaza con `RESOLUTION_IN_PROGRESS` (`API-9.2`).
  - `help({ targetGroupId })` → gasta la carta ayudando (`GR-8.1`) o activando una acción alternativa de carta permanente (`GR-14.6`).
  - `ignore` → descarta boca arriba sin efecto; **ilegal** en peligro (`kind: hazard`, `GR-6.5`) y misión (`GR-12.4`) → `CANNOT_IGNORE`.
- **BE-8.2** **Ventana de ayuda** (`API-8.2`, `GR-11.3`): tras `resolveOption`, el `pendingStep` del propietario es **cerrar la ventana** (`confirmHelp`). Mientras siga abierta, otros grupos con carta sin gastar pueden `day.declareHelp` (aportan habilidades/ventajas, `GR-8.2`, y pueden asumir heridas, `GR-8.3`). Cuando el propietario cierra la ventana, **declarar ayuda después se rechaza** con `HELP_TOO_LATE` (`GR-8.7`). Cerrar la ventana es el punto de sincronización **antes de los dados**.
- **BE-8.3** **Dados** (paso de servidor, `API-8.3`, `BE-9`): cerrada la ventana, si la opción lleva `dice > 0` (`CD-5.3`) el servidor tira con el `Rng` sembrado, emite `diceRolled` (`API-12.4`) y **aumenta el vector de requisitos** de la opción según las caras (`CD-5.12`, `GR-11.6`, `GR-11.8`). La legalidad se reevalúa **contra el requisito ya aumentado** (`CD-6.3`), sumando las habilidades del grupo y de quien ayude (`GR-7.1`, `GR-8.2`).
- **BE-8.4** **Fallback por dados** (`GR-11.4`): si los dados hacen la opción **irresoluble** (requisito no cubierto, o coste impagable sin remedio), el propietario debe **caer en una opción `negative`** de la misma carta si existe (`pendingStep: chooseFallbackOption` con las negativas legales) o, si no hay ninguna y la carta es ignorable, se **ignora** (`GR-6.5`, `API-8.5`).
- **BE-8.5** **Pipeline de resolución** — tras fijar la opción efectiva, el servidor avanza por etapas; cada etapa que requiera una elección publica un `pendingStep` dirigido a **quién debe actuar**; las que no, se **autoaplican**:
  1. **Costes** (`CD-7`): `resource`/`tool` los puede pagar cualquiera (`CD-7.4`, `GR-7.11`) → el paso nombra al **pagador**; `discardTop` lo paga **siempre el dueño del mazo** (`CD-7.3`, `GR-7.7`), se toma del **tope sin elección**, y cada carta de dorso `red` descartada inflige 1 herida (`GR-7.6`) que abre un `assignWounds`. Coste impagable → `UNPAYABLE_COST`.
  2. **Efectos negativos** (`CD-9`): `wounds` → `assignWounds` (el propietario reparte, o el ayudante que las asume, `GR-8.3`, `GR-9.2`; el desborde mata, `GR-9.3`, y roba persona si el grupo queda vacío, `GR-9.5`); `skull` → autoaplica (`GR-4.2`); pagos forzosos como sus equivalentes de coste.
  3. **Recompensas** (`CD-8`): `resource` → autoaplica al almacén (`GR-7.10`); `tool` → autoaplica; `heal` → `assignHeal` (`GR-9.7`); `idea` sin hueco → `evictIdea` (`GR-10.6`); `place` → `placeCard` (`GR-14.4`, cuenta como resolver, `CD-4.3`); `recruitPerson` → roba del mazo de Personas (`GR-9.8`, autoaplica salvo herramientas a tomar); `craft` → `chooseCraftTarget` + pagar la **receta del objeto** (`CD-8.3`, `GR-10.5`); `secret` → el servidor **revela** el secreto de `secretRef` y lo encola como **resolución encadenada** (`GR-14.1`); `victoryToken`/`removeSkull` → autoaplican (posible `ended`, `BE-5.9`).
  4. **Reparto con ayudantes** (`GR-8.5`): si hubo ayuda, las recompensas se reparten entre grupo ayudado y ayudante → `splitRewards`.
- **BE-8.6** **Resolución parcial** (`API-8.5`, `GR-6.5`, `CD-5.7`): si la opción es `partial: true` y no puede completarse, el servidor aplica **todo lo posible** y descarta; si es `partial: false`, o se completa o (según `polarity`/`kind`) cae en `BE-8.4`.
- **BE-8.7** **Cierre** (`API-8.6`): aplicado todo, el servidor ejecuta el **destino** de la carta (`CD-5.8`: `discard`/`remove`/`keep`), emite `cardResolved` (`API-12.5`), marca la carta **gastada** (`GR-5.12`) y cierra la resolución activa → `idle`. Gastar es **irreversible** (`API-8.7`); un intent sobre una carta ya gastada → `ALREADY_COMMITTED`.
- **BE-8.8** **Actor de cada `pendingStep`:** el paso lleva **quién** debe responderlo (propietario, un ayudante concreto, o "cualquier jugador" en pasos de tribu como `assignUnfed` o el pago de una misión). La vista traduce esto a afordancias por jugador (`API-4.5`); un `resolveStep` de quien no corresponde se rechaza (`ILLEGAL_CHOICE`).
- **BE-8.9** El **vocabulario concreto** de `pendingStep` (`assignWounds`, `payCost`, `assignHeal`, `evictIdea`, `placeCard`, `splitRewards`, `chooseFallbackOption`, `chooseCraftTarget`, `assignUnfed`, `confirmHelp`…) se **fija contra el corpus A/B** al cargarlo (`OQ-BE-1`); lo **normativo y cerrado** es el **mecanismo**: un paso pendiente cada vez, dirigido por servidor, respondido por `resolveStep`, con el servidor calculando el siguiente.

## BE-9. Azar sembrado y reproducibilidad

- **BE-9.1** Todo el azar (barajado `GR-3.6`/`GR-13.1`, robos de mazos ocultos, tiradas de dados `GR-11.2`) pasa por el puerto `Rng` (`BE-4.2`, `ARCH-4.6`). No hay `Math.random` ni fuentes implícitas (`ARCH-4.5`).
- **BE-9.2** **Persistencia del stream = semilla + contador** (cierra la decisión de reproducibilidad): el `GameState` guarda `rng = { seed, draws }` (`BE-6.6`). Extraer azar es `Rng(seed, draws) → valor` e **incrementa `draws`** en el nuevo estado. Reanudar tras un reinicio del backend es reconstruir el stream avanzando `draws` pasos: no se re-deriva el pasado (ya está materializado en el estado, `BE-3.3`); solo se garantiza que el **futuro** es determinista dado `(seed, draws)`.
- **BE-9.3** **Reproducibilidad** (`ARCH-8.3`): fijada la semilla y la secuencia de comandos, una partida completa se replica de forma determinista. Los tests de integración pueden reproducir partidas enteras (`BE-15`).
- **BE-9.4** **Dado de símbolos** (`GR-11.5`, `CD-5.12`): cada tirada produce, por dado, una cara `{ ability, amount }` con `ability ∈ {strength, awareness, craftsmanship}` y `amount ∈ {1,2}`. Con 2 dados los resultados se **acumulan** sobre el vector de requisitos (`GR-11.8`). El nº de dados lo pide la **opción** (`dice: 0|1|2`, `CD-5.3`), nunca el módulo (`GR-11.7`); `maxDice` es informativo y **derivable**, no se almacena en el estado (`CD-12.4`).

## BE-10. Persistencia (adaptador Redis)

- **BE-10.1** El `GameState` se persiste **íntegro** en Redis (`ARCH-9.1`), como **documento único** por partida, detrás del puerto `GameRepository` (`BE-4.1`, `ARCH-9.2`). No hay base de datos relacional ni historial (`ARCH-6.6`).
- **BE-10.2** **Cuándo se escribe:** tras cada comando que muta estado (`BE-7`), de forma **atómica** con la emisión (`BE-12`): o se persiste y se publica el nuevo estado, o no cambia nada (`API-5.1`).
- **BE-10.3** **Supervivencia a reinicio** (`ARCH-9.1`, `ARCH-9.7`): como el estado (incluido `rng`, `BE-9.2`) vive en Redis, `game.getState` es autoritativo tras caída de cliente **o** de servidor (`API-3.4`). La vista por jugador es autosuficiente: un snapshot reconstruye la UI sin historial (`ARCH-9.6`).
- **BE-10.4** **Clave e identidad:** una partida se localiza por el código de sala (`API-2.1`); el `playerId` opaco recupera la silla (`ARCH-9.4`). La gestión de esas claves es de `room`/`infrastructure` (`BE-2.1`).
- **BE-10.5** El adaptador Redis serializa/deserializa el `GameState` plano (`BE-6.8`). Ninguna regla vive en el adaptador (`ARCH-9.2`): solo persistencia.

## BE-11. Proyección por jugador (módulo `view`)

- **BE-11.1** El módulo `view` transforma `GameState` → `GameStateView(playerId)`: la **vista personalizada** que ese jugador puede ver (`API-4.2`, `ARCH-7.2`). El **filtrado ocurre aquí, en el servidor**, nunca en el cliente (`ARCH-7.1`).
- **BE-11.2** **Se oculta** (`API-4.2`): caras de cartas no reveladas (propias y ajenas, `GR-5.2`) —del propio mazo el jugador ve **solo los dorsos en orden** (`CD-3`, `GR-5.4`), jamás las caras—; cartas elegidas sin revelar (`API-6.2`); contenido del descarte boca abajo (`GR-7.8`); y de los mazos ocultos (`personDeck`/`dreamDeck`/`ideaDeck`/`secretDeck`) **solo su tamaño** (`API-4.2`).
- **BE-11.3** **Es visible** (`API-4.3`, `API-4.4`): almacén, banco de trabajo con sus ideas, grupos con personas/habilidades/heridas/herramientas, tablero de Noche, descarte boca arriba, cartas **reveladas** del turno; y de los demás jugadores, su grupo, el **tamaño y estado** (despierto/dormido) de su mazo y los **dorsos de sus 3 cartas superiores** (las candidatas, `GR-5.2`), no el resto de su mazo ni ninguna cara.
- **BE-11.4** **Bloque de interacción** (`API-4.5`): la vista incluye `phase`/`subState`, la **resolución activa** si la hay (`BE-8`), el `pendingStep` actual con **quién debe actuar**, si el jugador **conserva su carta** sin gastar, y **qué intents son legales ahora** (afordancias). El backend es la fuente de legalidad (`ARCH-1.3`); el cliente solo la refleja.
- **BE-11.5** El módulo `view` **no muta estado ni decide reglas** (`BE-2.3`): lee `GameState` y produce DTOs de `shared` (`API-1.3`). Es el **único** lugar donde se aplica la regla de información oculta, para no dispersarla.

## BE-12. Emisión de eventos y snapshots

- **BE-12.1** `reduce` **devuelve** los eventos de dominio (`BE-3.1`); `application`/`infrastructure` los **filtra por jugador** (`view`, `BE-11`) y los publica por la subscription (`API-12`). El dominio no publica (`BE-4.4`).
- **BE-12.2** **`stateChanged` = snapshot completo** (cierra `OQ-API-5`): cada cambio reemite la `GameStateView` completa del jugador. Coherente con que la vista sea **autosuficiente y reconstruible** (`ARCH-9.6`, `API-12.8`) y con que `GameState` sea pequeño (`BE-6`). Se descarta *diffs* incrementales en v1 por complejidad y riesgo de desincronía; si el tamaño de la vista lo exigiera, se reconsideraría como optimización (`OQ-BE-2`).
- **BE-12.3** Los **eventos discretos** (`revealed`, `diceRolled`, `cardResolved`, `resolutionOpened`, `nightStarted`, `newDayStarted`, `gameEnded`, `API-12`) se emiten **además** del snapshot, como señales para animación/log de la UI; la **fuente de verdad** es siempre la vista (`API-12.8`). Ningún evento discreto filtra información oculta (`ARCH-7.1`, `API-13.3`).
- **BE-12.4** `snapshot` (`API-12.1`) es el primer evento de la subscription y la respuesta a resync (`API-3.2`); es idéntico en forma a `stateChanged` (`BE-12.2`).

## BE-13. Validación y errores

- **BE-13.1** La validación es **por capas**, toda dentro del backend (`ARCH-1.3`): (1) **estado/fase** — `(phase, subState)` admite el comando (`BE-5.10`); (2) **actor** — el `playerId` corresponde a la silla y, en resolución, al actor del `pendingStep` (`BE-8.8`); (3) **reglas** — requisitos (`CD-6`), pagabilidad (`CD-7`), momento de la ayuda (`GR-11.3`), legalidad de la opción (`GR-6.5`). Un fallo en cualquier capa **rechaza sin mutar** (`API-5.1`).
- **BE-13.2** Los errores son **tipados** y mapean la taxonomía del protocolo (`API-13.2`): `NOT_YOUR_PHASE`, `NOT_AWAKE`, `ILLEGAL_CHOICE`, `CANNOT_IGNORE`, `UNPAYABLE_COST`, `HELP_TOO_LATE`, `REQUIREMENT_NOT_MET`, `ALREADY_COMMITTED`, `RESOLUTION_IN_PROGRESS`. El dominio produce el error como valor (`BE-3.1`); `infrastructure` lo traduce a error tRPC.
- **BE-13.3** Un error **no filtra información oculta** (`API-13.3`, `ARCH-7.1`): nunca revela caras ni contenido de mazos ocultos. Un rechazo por requisito informa **qué** faltó (habilidad/recurso), no datos que el jugador no deba ver.

## BE-14. Concurrencia y simultaneidad

- **BE-14.1** La fase de día es **simultánea** (`ARCH-7.3`, `GR-5.1`): varios jugadores emiten intents a la vez. El backend los **linealiza por partida** — un **único escritor lógico por `GameState`**— y aplica el reductor **de uno en uno** (`BE-3.4`). La simultaneidad del juego está en la *llegada* y en que **no hay turnos rotativos**, no en la aplicación concurrente del estado.
- **BE-14.2** La **revelación es el punto de sincronización** (`API-7`, `BE-5.4`): la elección concurrente converge en un paso atómico de servidor. No hay ventana en que un cliente conozca una cara antes que otro (`API-7.1`).
- **BE-14.3** Durante `resolving`, **una sola resolución activa** (`API-9.2`, `BE-8.1`) evita carreras entre clientes; el resto de intents legales (ayudar la activa, ignorar la propia) se serializan. El servidor **valida y serializa**, no arbitra acuerdos humanos (`API-9.5`, `API-5.2`).
- **BE-14.4** **Reconexión sin *timeout*** (`ARCH-9.5`, `API-3.3`): si un jugador cae, su silla se conserva y la partida **espera**; el resto no puede pasar de la revelación atómica hasta que él elija. Al volver, `game.getState` reconstruye su vista (`ARCH-9.6`). No hay sustitución ni expulsión.
- **BE-14.5** El mecanismo exacto del escritor único por partida (cola en memoria, lock en Redis, actor por sala) es de `infrastructure` y se decide al implementar (`OQ-BE-3`); lo **normativo** es la **linealización por partida** (`BE-14.1`) y que el dominio permanezca puro (`BE-3.2`).

## BE-15. Testing

- **BE-15.1** **Cada regla del dominio tiene al menos un test que la referencia por su ID** (`ARCH-8.1`, `GR-*`). Los tests del reductor citan el `GR-*`/`BE-*` que ejercen.
- **BE-15.2** El dominio se testea **sin infraestructura** (`ARCH-8.2`): sin contenedores, red, Redis ni tRPC. Se prueba `reduce(state, command)` con estados construidos a mano y un corpus de test (`BE-4.5`).
- **BE-15.3** Con `Rng` sembrado (`BE-9`), los tests de integración **reproducen partidas completas** de forma determinista (`ARCH-8.3`): misma semilla + misma secuencia de comandos → mismo resultado.
- **BE-15.4** La **información oculta** se testea en `view` (`BE-11`): que una `GameStateView` **nunca** contiene caras no reveladas ni contenido de mazos ocultos (`ARCH-7.1`), para ningún jugador y en ninguna fase.

---

## Cuestiones abiertas

- **OQ-BE-1** **Vocabulario de `pendingStep`** (`BE-8.9`): el conjunto exacto de tipos de paso (`assignWounds`, `payCost`, `evictIdea`, `splitRewards`, `chooseCraftTarget`…) se **cierra contra el corpus A/B** (`OQ-1`, `OQ-CD-2`). El **mecanismo** (un paso dirigido por servidor cada vez) ya es normativo (`BE-8`); solo falta enumerar los pasos que las cartas reales exigen.
- **OQ-BE-2** **`stateChanged` como snapshot** (`BE-12.2`, cierra `OQ-API-5`): decidido — **snapshot completo** por cambio. Si al medir `GameStateView` con el corpus cargado el tráfico resultara excesivo, se reevaluaría un modo *diff* como optimización, conservando el snapshot como fuente de verdad (`API-12.8`).
- **OQ-BE-3** **Escritor único por partida** (`BE-14.5`): el mecanismo de linealización (cola en memoria vs lock en Redis vs actor por sala) se decide al implementar `infrastructure`. No afecta al dominio (puro, `BE-3.2`) ni al contrato (`API-*`).
- **OQ-BE-4** **Lobby y ciclo de sala** (`BE-2.1`, `BE-7.1`): la máquina de estados de la **sala** (esperando/en juego/terminada), la elección de módulos (`GR-15.3`) y el número de grupos siguen abiertos como `OQ-API-2`. `Backend.md` fija que son responsabilidad de `room`; el detalle se cierra con `Protocol.md`.
