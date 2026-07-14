# Protocol — Paleo

> **Estado:** v0.2 — Contrato de mensajes: procedures, subscriptions, eventos y errores. Enfocado en fase de día (revelación atómica) y decisiones colectivas. Identidad, reconexión y persistencia cerradas (`ARCH-9`); quedan `OQ-API-2/5/6`.
> **Alcance:** define **qué mensajes** cruzan el WebSocket entre cliente y servidor y **con qué semántica**, no su implementación. El motor de reglas vive en `Backend.md` (`BE-*`, pendiente); el estado del juego, en `GameRules.md` (`GR-*`). Los tipos de datos de carta son de `CardData.md` (`CD-*`).
> **Autoridad:** el backend es la **autoridad única** (`ARCH-1.3`). Todo intent del cliente es una **intención**, no un hecho: el servidor valida y decide. El cliente puede deshabilitar afordancias por UX, pero nunca aplica reglas.

## Convención de identificadores

IDs estables `API-<sección>.<número>`. No se renumeran ni se reutilizan; un procedure/evento retirado se marca `[OBSOLETO]` conservando su ID. Nombres de procedure, evento y campo en **inglés** (`ARCH-3.1`), respetando el glosario (`ARCH-3.3`).

---

## API-1. Transporte y forma del contrato

- **API-1.1** Transporte: **tRPC sobre WebSockets** (`ARCH-2.4`). Toda la interacción de partida —queries, mutations y subscriptions— va por WS; no hay HTTP polling.
- **API-1.2** **Tipado extremo a extremo** (`ARCH-2.5`): el router de tRPC es la **única** definición del contrato. Los tipos de esta spec son **normativos en semántica**, no en sintaxis: la forma exacta (TS) vive en el router (`project/backend/`) y los DTOs compartidos en `project/shared/`. El cliente **deriva** sus tipos del router; no se duplican a mano.
- **API-1.3** **`shared/` expone solo tipos de vista y de intent** (`ARCH-5.4`): los DTOs de la **vista serializada por jugador** (`API-4`) y los payloads de intent/evento. **Nunca** el estado interno del dominio ni tipos con información oculta (`ARCH-7.2`). El modelo interno del backend no cruza el límite `shared/`.
- **API-1.4** Tres clases de mensaje: **queries** (lectura sin efecto), **mutations** (intents que piden cambiar el estado) y **subscriptions** (flujo servidor→cliente de estado y eventos).

## API-2. Sesión, sala y jugadores

- **API-2.1** El juego se organiza en **salas** (`Room`), cada una con **una partida** (`Game`). Una sala tiene un código de acceso.
- **API-2.2** Cada conexión se asocia a un **jugador** (`Player`) dentro de una sala. La **política de identidad** está fijada en `ARCH-9.3`/`ARCH-9.4` (resuelto `OQ-ARCH-2`): **sesión efímera sin autenticación**. El cliente conserva un `playerId` opaco y lo presenta al conectar; ese token es la única credencial y basta para recuperar su silla.
- **API-2.3** **Un jugador = un grupo** (`Group`) en la v1: jugador y grupo **coinciden 1:1** (resuelve `OQ-API-1`). Nos apartamos deliberadamente de la variante de 4 jugadores / 3 grupos con grupo compartido (`GR-1.4`), **no soportada en v1**. El estado se indexa por grupo, cada grupo tiene exactamente un jugador, y vistas e intents se emiten por jugador.
- **API-2.4** Procedures de sala (mutations): `room.create`, `room.join({ code })`, `room.leave`. `room.start` inicia la partida (baraja y reparte con semilla, `ARCH-4.6`, `GR-3`). El detalle de lobby es `OQ-API-2`.

## API-3. Conexión, suscripción y reconexión

- **API-3.1** Tras entrar en la sala, el cliente abre **una** subscription de partida (`API-12`) que emite un **snapshot inicial** de su vista (`API-4`) y luego eventos incrementales.
- **API-3.2** **Resync:** el cliente puede pedir en cualquier momento la vista completa con la query `game.getState` (`API-4`), p. ej. tras una reconexión de WS. La vista es **autosuficiente**: un snapshot basta para reconstruir la UI sin historial.
- **API-3.3** **Reconexión de jugador** (`ARCH-9.5`, resuelto `OQ-ARCH-5`): si un jugador cae a mitad de una fase de día simultánea, **la partida espera**. Su silla se conserva; no hay sustitución, ni expulsión, ni *timeout*: el resto no puede pasar de la revelación atómica (`API-7`) hasta que él elija. Al volver, presenta su `playerId` y `game.getState` reconstruye su vista.
- **API-3.4** Como el estado se persiste (`ARCH-9.1`), la reconexión funciona igual tras una caída **del servidor** que del cliente: `game.getState` sigue siendo autoritativo tras un reinicio del backend.

## API-4. Vista por jugador (serialización)

- **API-4.1** El servidor **nunca** envía a un cliente información que ese jugador no debe ver (`ARCH-7.1`). El filtrado ocurre **al serializar en el servidor** (`ARCH-7.2`); el cliente nunca recibe datos ocultos que "no deba mirar".
- **API-4.2** La vista (`GameStateView`) es **personalizada por jugador**. Lo que se **oculta**:
  - **Caras de cartas no reveladas** (`GR-5.2`): del propio mazo y del de los demás. El jugador ve **solo los dorsos** de su mazo (`back`, `CD-3`), en orden, porque puede consultarlos siempre (`GR-5.4`) — pero **jamás** las caras.
  - **Cartas elegidas y aún no reveladas** (`GR-5.2`, boca abajo): ni su propietario conoce su cara. Se revelan atómicamente en `API-7`.
  - **Pila de descarte boca abajo** (`GR-7.8`): contenido no consultable por nadie.
  - **Mazos ocultos**: Personas, Sueños, Ideas y **Secretos** (`ARCH-7.1`) — solo su tamaño, no su contenido.
- **API-4.3** Lo que es **visible para todos** sí va en la vista: recursos del almacén (`GR-7.3`), banco de trabajo con sus ideas (`GR-10.6`), grupos y sus personas con habilidades/heridas (`GR-9`), herramientas, tableros de Noche (calaveras, fichas de victoria), pila de descarte **boca arriba** (`GR-7.9`), y las **cartas reveladas** del turno en curso.
- **API-4.4** De los **demás jugadores** se ve: su grupo (público), el **tamaño** y estado de su mazo (despierto/dormido), y **los dorsos de sus 3 cartas superiores** — las candidatas a elegir (`GR-5.2`), que están expuestas. **No** se ve el resto de sus dorsos (hojear el mazo completo solo puede hacerlo su dueño, `GR-5.4`) ni **ninguna cara** (`GR-5.2`). Los dorsos no son información oculta (`GR-1.2`); lo que limita la vista ajena es qué cartas están expuestas, no el secreto. Resuelve `OQ-API-3`.
- **API-4.5** La vista incluye un bloque de **interacción en curso**: fase actual (`day`/`night`), sub-estado del turno (`choosing`/`resolving`), la **resolución activa** del turno si la hay (`API-9`) y, para el jugador, **qué intents son legales ahora** (afordancias) y si **aún conserva su carta** sin gastar. El backend es la fuente de legalidad (`ARCH-1.3`); el cliente solo la refleja.

## API-5. Modelo de interacción

- **API-5.1** Todo cambio de estado nace de un **intent** (mutation) de un jugador, validado por el servidor. Un intent legal produce nuevos eventos y una vista actualizada; uno ilegal produce un error (`API-13`) y **no** altera el estado.
- **API-5.2** **Todas las decisiones son individuales; no hay votación ni quórum.** Cada jugador decide **sobre su propia carta** (`GR-5.8`): resolver una opción, ayudar o ignorar (`GR-6.4`). Lo que las reglas llaman decisiones "colectivas" (orden de resolución `GR-5.7`, acción de misión `GR-12.5`) **emerge de la coordinación** por comunicación libre (`GR-1.2`) y se **enacta con intents individuales**; el servidor solo los **serializa** y valida, sin exigir acuerdo formal (`ARCH-7.4`, `API-9`).
- **API-5.3** **Concurrencia:** la fase de día es **simultánea** (`ARCH-7.3`, `GR-5.1`). Varios jugadores pueden emitir intents de elección a la vez; el servidor los acepta de forma independiente y sincroniza en la **revelación** (`API-7`).

## API-6. Fase de día — elección (concurrente)

- **API-6.1** `day.chooseCard` (mutation) — implementa `GR-5.2`/`GR-5.3`. Input: la carta elegida de entre las **3 superiores** (por posición, ya que las caras no se conocen) y el **orden** en que se devuelven las **2 no elegidas** al tope del mazo. Efecto: la elegida se coloca **boca abajo** frente al jugador; las 2 vuelven al tope en el orden pedido. El servidor valida que haya elección pendiente y que los índices sean legales (`GR-5.5`: si hay menos de 3, se elige entre las disponibles).
- **API-6.2** El jugador **no** recibe la cara de la carta elegida (`API-4.2`). Consultar los dorsos del propio mazo (`GR-5.4`) no necesita procedure: van en la vista (`API-4.2`), que no permite reordenar.
- **API-6.3** `day.sleepEarly` (mutation) — implementa `GR-5.10`: descarta el resto del mazo **boca abajo y sin efecto** (las cartas rojas así descartadas **no** causan heridas, a diferencia de `GR-7.6`) y el jugador se **duerme**.
- **API-6.4** **Dormir por vaciado** (`GR-5.9`): cuando un jugador se queda sin cartas, el servidor lo marca dormido automáticamente; no hay intent.
- **API-6.5** Un jugador dormido no puede emitir `day.chooseCard` ni ayudar (`GR-5.9`); sus intents de día se rechazan (`API-13`).

## API-7. Fase de día — revelación atómica

- **API-7.1** La **revelación es del servidor, no un intent** (`ARCH-7.3`, `GR-5.6`): cuando **todos los jugadores despiertos** han elegido su carta del turno, el servidor revela **todas a la vez** y emite un evento `revealed` (`API-12`) con sus caras. No hay ventana en la que un cliente conozca una cara antes que otro.
- **API-7.2** El evento `revealed` entrega, por cada carta revelada, su cara completa (`CD-*`) y sus opciones (`CD-5`). A partir de aquí las caras son **públicas** para todos (`API-4.3`).
- **API-7.3** Tras revelar, el turno pasa a sub-estado **`resolving`**: el grupo **coordina** el orden de resolución (`API-9`, `GR-5.7`) y se resuelve **carta por carta, de una en una** (`API-8`).
- **API-7.4** Si en el momento de revelar solo quedaba 1 jugador despierto, se revela igualmente su carta; el orden colectivo es trivial.

## API-8. Fase de día — resolución de una carta

Se resuelve **una carta a la vez**, en el orden fijado (`API-9`). La resolución de una carta es una **secuencia**, no un único intent, porque la ayuda debe declararse **antes** de los dados (`GR-11.3`) y algunos pasos requieren elecciones:

- **API-8.1** `day.chooseCardAction` (mutation) — el **propietario** de la carta en curso elige, de forma **individual** (`GR-5.8`), una de (`GR-6.4`):
  - `resolveOption({ optionId })` — resolver una opción de la carta (`CD-5`).
  - `help({ targetGroupId })` — gastar su carta ayudando a otro grupo (`GR-8.1`) o activando una acción alternativa de carta permanente (`GR-14.6`).
  - `ignore` — descartar boca arriba sin efecto (`GR-6.4`). **Ilegal** si la carta es de peligro (`kind: hazard`, `GR-6.5`) o de misión (`GR-12.4`).
  El servidor valida la legalidad (p. ej. `ignore` prohibido en peligro; opción con requisitos incumplibles, `CD-6`).
- **API-8.2** `day.declareHelp` (mutation) — otro jugador ofrece ayuda a la carta en curso (`GR-8`). Debe llegar **antes** de que se tiren los dados (`GR-8.7`, `GR-11.3`); después, se rechaza (`API-13`). Aporta las habilidades y ventajas de su grupo (`GR-8.2`) y puede **asumir las heridas** en su lugar (`GR-8.3`). Varios pueden ayudar a la vez (`GR-8.6`). El ayudante **no** puede pagar costes de descarte ajenos (`GR-8.4`, `CD-7.3`); sí recursos/herramientas (`CD-7.4`).
- **API-8.3** **Dados** (`GR-11.2`): si la opción los lleva (`CD-5.3`), el servidor los tira con el **puerto de azar sembrado** (`ARCH-4.6`) tras cerrarse la ventana de ayuda, y emite un evento `diceRolled`. Los dados **aumentan el umbral de requisitos** de la opción (modelo exacto: `OQ-CD-5`). No hay intent de "tirar": lo hace el servidor para garantizar imparcialidad y reproducibilidad.
- **API-8.4** `day.resolveStep` (mutation) — el/los jugadores aportan las **elecciones que la resolución requiera**: qué recursos/herramientas se pagan y quién los pone (`CD-7`, `GR-7.11`), a qué persona se asignan las heridas (`GR-9.2`), cómo se reparte una curación (`GR-9.7`), colocación de cartas nuevas (`GR-14.4`), reparto de recompensas entre grupo ayudado y ayudante (`GR-8.5`), etc. Puede requerir varios pasos según la opción.
- **API-8.5** **Resolución parcial** (`GR-6.5`, `CD-5.7`): si una opción negativa no puede completarse, el servidor resuelve **todo lo posible** y descarta. Si los dados hacen imposible la opción, el propietario debe caer en una opción `negative` de la misma carta, o ignorarla si no hay ninguna (`GR-11.4`).
- **API-8.6** Al terminar una carta, el servidor aplica su **destino** (`CD-5.8`: `discard`/`remove`/`keep`), emite `cardResolved` y pasa a la siguiente. Cuando se agotan las cartas del turno, si algún jugador sigue despierto empieza un **nuevo turno** (`API-6`); si todos duermen, arranca la **noche** (`GR-5.11`, `API-10`).
- **API-8.7** **Compromiso** (`GR-5.12`): gastar la carta revelada —`resolveOption`, `help` o `ignore` (`API-8.1`)— es **irreversible**. Ayudar (`API-8.2`) **gasta** la carta igual que resolver (`GR-8.1`), así que quien resuelve su propia opción **ya no puede ayudar** ese turno, y viceversa. Cada jugador aporta **exactamente una** carta-acción por turno. Esperar antes de gastarla —por si un compañero necesita ayuda— es decisión estratégica individual; un intent que intente cambiar una carta ya gastada se rechaza (`ALREADY_COMMITTED`, `API-13`).

## API-9. Orden y coordinación del turno (sin quórum)

No hay decisiones colectivas formales: no existe votación, propuesta ni confirmación (`API-5.2`, `ARCH-7.4`). El orden y la coordinación se resuelven por **comunicación libre** (`GR-1.2`) y se **enactan con intents individuales** que el servidor **serializa**.

- **API-9.1** El **orden** en que se resuelven las cartas reveladas (`GR-5.7`) lo coordina el grupo **fuera de banda** (chat/voz). El servidor **no impone** un orden ni ofrece un intent para "fijarlo": solo garantiza que las resoluciones ocurran **de una en una**.
- **API-9.2** **Una resolución activa a la vez:** iniciar `resolveOption` (`API-8.1`) sobre la propia carta la **abre** como la **resolución activa** del turno. Mientras haya una activa, el servidor **rechaza** abrir otra (`RESOLUTION_IN_PROGRESS`, `API-13`). Los demás pueden `declareHelp` sobre ella antes de los dados (`API-8.2`, `GR-11.3`).
- **API-9.3** Un jugador con su carta **sin gastar** puede, en cualquier momento del turno: **iniciar** su resolución (si no hay otra activa), **ayudar** la activa (`API-8.2`), o **ignorar** su carta (`API-8.1`, si es legal). Cada una es un **compromiso irreversible** (`API-8.7`).
- **API-9.4** El turno de resolución termina cuando **todos los jugadores despiertos** han gastado su carta revelada. Entonces empieza un **nuevo turno** de elección (`API-6`) si alguien conserva mazo, o la **noche** (`GR-5.11`, `API-10`).
- **API-9.5** El papel del servidor es **validar y serializar** (legalidad de la opción, pagabilidad, momento de la ayuda), evitando carreras entre clientes concurrentes — no arbitrar acuerdos, que son humanos.

## API-10. Fase de noche

- **API-10.1** La noche empieza cuando todos duermen (`GR-5.11`) y la abre el servidor con un evento `nightStarted`.
- **API-10.2** **Alimentar** (`GR-12.2`): cada grupo paga **1 comida por persona** del almacén común. Si el almacén no alcanza para todos, **quién queda sin alimentar lo coordina la tribu** (`GR-1.2`) y se **enacta con intents individuales** (sin quórum, `API-5.2`); cada persona sin alimentar coloca **1 calavera** (`GR-4.2`) pero **no muere**. Si alcanza para todos, el servidor lo autoaplica.
- **API-10.3** **Misiones** (`GR-12.3`): tras alimentar, se resuelve cada carta de misión boca arriba. Solo cuenta el área bajo el **símbolo de luna** (`CD-5.10` `timing: night`). La tribu elige **1 opción** por misión, coordinada verbalmente y **enactada por un intent** de cualquier jugador (`night.chooseMissionAction`), sin quórum (`API-5.2`, `GR-12.5`); **no se puede ignorar** y siempre hay una opción negativa (`GR-12.4`). Cualquier jugador puede pagar los costes (`GR-12.5`, `CD-7.4`).
- **API-10.4** **Acciones nocturnas** (`GR-12.7`): las cartas en juego con símbolo de luna (`CD-5.10`) se resuelven igual que las misiones.
- **API-10.5** Las cartas de misión **permanecen en juego** tras resolverse salvo que digan lo contrario (`GR-12.6`, `CD-5.8` `keep`).

## API-11. Nuevo día

- **API-11.1** Es un paso **del servidor**, sin intents (`GR-13`): baraja juntas ambas pilas de descarte (`GR-13.1`) con el **puerto de azar sembrado** (`ARCH-4.6`) y reparte de nuevo boca abajo (`GR-13.2`). Las cartas del cementerio **no** vuelven (`GR-13.3`).
- **API-11.2** Emite `newDayStarted` con las vistas actualizadas (tamaños de mazo, dorsos propios) y arranca la siguiente fase de día (`API-6`). Nadie ve las caras (`GR-13.2`).
- **API-11.3** **Fin de partida** (`GR-4`): al colocarse la 5ª ficha de victoria (`GR-4.1`) o la 5ª calavera (`GR-4.2`) el servidor emite `gameEnded` con el resultado (empate simultáneo → victoria, `GR-4.3`). Puede ocurrir en cualquier momento, no solo de noche.

## API-12. Eventos (subscription)

La subscription de partida emite una **unión discriminada** de eventos. Todos son **servidor→cliente** y ya vienen **filtrados por jugador** (`API-4`):

- **API-12.1** `snapshot` — vista completa (`GameStateView`); primer evento y respuesta a resync (`API-3.2`).
- **API-12.2** `stateChanged` — vista actualizada tras un intent (puede ser diff o snapshot; formato en `OQ-API-5`).
- **API-12.3** `revealed` — revelación atómica del turno con las caras (`API-7`).
- **API-12.4** `diceRolled` — resultado de dados (`API-8.3`).
- **API-12.5** `cardResolved` — una carta terminó de resolverse (`API-8.6`).
- **API-12.6** `resolutionOpened` — una carta pasó a ser la **resolución activa** del turno (`API-9.2`).
- **API-12.7** `nightStarted` / `newDayStarted` / `gameEnded` — transiciones de fase (`API-10`, `API-11`).
- **API-12.8** Los eventos sirven también de **registro** para la UI (animaciones, log); la vista (`snapshot`/`stateChanged`) es siempre la fuente de verdad reconstruible.

## API-13. Errores

- **API-13.1** Todo intent ilegal se rechaza con un **error tipado** y **no** modifica el estado (`API-5.1`). El backend es la autoridad (`ARCH-1.3`); el cliente no debe asumir que un intent tuvo efecto hasta ver el `stateChanged`.
- **API-13.2** Taxonomía mínima: `NOT_YOUR_PHASE` (intent fuera de la fase/sub-estado), `NOT_AWAKE` (`GR-5.9`), `ILLEGAL_CHOICE` (índice/opción inexistente), `CANNOT_IGNORE` (`GR-6.5`/`GR-12.4`), `UNPAYABLE_COST` (`GR-7.2`), `HELP_TOO_LATE` (`GR-11.3`), `REQUIREMENT_NOT_MET` (`CD-6`), `ALREADY_COMMITTED` (intento de cambiar una carta ya gastada, `GR-5.12`), `RESOLUTION_IN_PROGRESS` (abrir una resolución con otra activa, `API-9.2`).
- **API-13.3** Los errores **no filtran información oculta**: un rechazo nunca revela caras ni contenido de mazos ocultos (`ARCH-7.1`).

---

## Cuestiones abiertas

- **OQ-API-1** [RESUELTA → `API-2.3`] **Grupos compartidos** (`GR-1.4`): decidido — **1 jugador = 1 grupo** en la v1; jugador y grupo coinciden 1:1. La variante 4 jugadores / 3 grupos con grupo compartido **no se soporta**.
- **OQ-API-2** **Lobby y ciclo de sala** (`API-2.4`): estados de sala (esperando/en juego/terminada), reconexión al lobby, elección de módulos (`GR-15.3`), número de grupos. La identidad ya no bloquea (`ARCH-9.3`); queda el ciclo de vida de la sala.
- **OQ-API-3** [RESUELTA → `API-4.4`] **Dorsos ajenos:** decidido — se ven los dorsos de las **3 cartas superiores** de cada compañero (las candidatas a elegir, `GR-5.2`), no el resto de su mazo ni ninguna cara.
- **OQ-API-4** [RESUELTA → `API-5.2`, `API-9`] **Quórum de decisión colectiva:** decidido — **no hay quórum ni votación**. Las decisiones son individuales, coordinadas por comunicación libre (`GR-1.2`) y serializadas por el servidor.
- **OQ-API-5** **Formato de `stateChanged`** (`API-12.2`): ¿snapshot completo por cambio (simple, más tráfico) o diffs incrementales (menos tráfico, más complejidad)? Depende del tamaño real de `GameStateView`.
- **OQ-API-6** **Granularidad de `day.resolveStep`** (`API-8.4`): ¿un intent por micro-elección (más idas y vueltas, más validable) o un intent compuesto por carta (menos mensajes, más difícil de validar parcialmente)? A afinar contra las opciones reales del corpus A/B.
- **OQ-API-7** [RESUELTA → `API-3.4`, `ARCH-9.1`, `ARCH-9.7`] **Persistencia y autoridad del snapshot:** decidido — el estado **se persiste en Redis**, así que sobrevive al reinicio del backend. `game.getState` se sirve desde el repositorio de partida (puerto en `domain`, adaptador Redis en `infrastructure`, `ARCH-9.2`) y es autoritativo tanto tras una caída del cliente como del servidor.
