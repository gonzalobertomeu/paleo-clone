# CardData — Paleo

> **Estado:** v0.2 — Esquema de datos (*action schema*). Modelo de dados cerrado (`CD-5.12`, `OQ-CD-5`). Sin corpus de cartas todavía.
> **Alcance:** define **la forma de una carta y de sus acciones** (requisitos, costes, recompensas, efectos, banderas): el vocabulario con el que el motor (`Backend.md`) y el protocolo (`Protocol.md`) se comunican sobre cartas. **No** contiene los datos concretos de las 124 cartas de módulo ni de las 222 del juego: eso es el *corpus*, diferido por copyright (`OQ-1` en `GameRules.md`).
> **Relación con las reglas:** cada elemento del esquema referencia la regla de dominio que lo motiva (`GR-*`). Si una regla no está cubierta aquí, el esquema es incompleto: se amplía la spec antes que el código (`CLAUDE.md` §metodología).

## Convención de identificadores

IDs estables `CD-<sección>.<número>`. No se renumeran ni se reutilizan; un campo retirado se marca `[OBSOLETO]` conservando su ID. Los nombres de campo y de literal se escriben **en inglés** (`ARCH-3.1`), respetando el glosario (`ARCH-3.3`).

---

## CD-1. Alcance y no-alcance

- **CD-1.1** Esta spec define **tipos de datos**, no instancias. La forma de "una carta"; no "la carta nº 47".
- **CD-1.2** El esquema debe ser **agnóstico de módulo** (`OQ-2`, resuelta: motor genérico A–J). Ningún campo asume el nivel 1. La restricción a Base + A + B en la v1 es de **corpus cargado**, no de esquema.
- **CD-1.3** **Corpus diferido:** los valores concretos de cada carta (requisitos, costes, recompensas, encadenamientos de secretos) viven en un dataset aparte, fuera de esta spec, y tienen implicaciones de copyright (`OQ-1`). Esta spec solo garantiza que **cualquier** carta del juego sea representable.
- **CD-1.4** **Criterio de completitud:** el esquema está completo cuando toda mecánica descrita en `GR-6`…`GR-14` puede expresarse como datos, sin lógica especial por carta. Las excepciones conocidas se listan como `OQ-CD-*`.

## CD-2. Anatomía de una carta

Toda carta comparte una envoltura común, independientemente de su tipo:

- **CD-2.1** `id` — identificador estable y único de la carta dentro del corpus. No es el `CD-*` de spec; es la clave de datos.
- **CD-2.2** `set` — a qué set pertenece (`GR-2.5`): `base`, `person`, `dream`, `idea`, `secret`, o un módulo `A`…`J`. Determina en qué mazo entra y bajo qué reglas de retiro (`GR-3.5`, `GR-15.4`).
- **CD-2.3** `back` — el **dorso** de la carta (`CD-3`). Determina qué ve el jugador al elegir (`GR-5.2`) y en qué mazo de descarte podría rebarajarse.
- **CD-2.4** `kind` — el **tipo de cara** (`CD-4`), que decide cómo se resuelve al revelarse.
- **CD-2.5** `face` — la carga útil según `kind`: el conjunto de acciones/opciones, o los datos de persona/sueño/idea/secreto. Definida en `CD-4` y siguientes.
- **CD-2.6** El dorso es una **pista, no una garantía** (`GR-6.1`): `back` y `kind` son independientes. Una carta de dorso normal puede tener cara de peligro y viceversa. El esquema no debe acoplarlos.

## CD-3. Dorsos (`back`)

- **CD-3.1** `terrain` — el tipo de dorso. Vocabulario **extensible por módulo** (`GR-6.8`), no cerrado. Núcleo del juego base (`GR-6.1`): `forest`, `river`, `mountain`, `camp`, `red`. `red` = dorso de peligro. `camp` agrupa personas/sueños/ideas (`GR-6.3`). Un módulo puede aportar dorsos propios (p. ej. `snow`, `cold_tree` de un módulo invernal), registrados en la composición del módulo (`CD-3.4`, `CD-12`).
- **CD-3.2** `symbols` — lista opcional de **símbolos de pista adicionales** en el dorso (p. ej. un mamut), que dan información extra sobre la cara (`GR-6.2`). Vocabulario abierto; se amplía con el corpus. Distinto de `terrain`: un símbolo es un *overlay* sobre un dorso, no un tipo de dorso.
- **CD-3.3** El dorso **rojo** es la única señal de peligro visible antes de revelar, y es la que dispara heridas al descartarse como coste (`GR-7.6`). Debe ser un dato inequívoco, no inferido de la cara. Su semántica de peligro es **reservada**: un dorso de módulo (`CD-3.4`) no puede redefinir `red` (`GR-6.8`).
- **CD-3.4** **Dorsos de módulo:** los `terrain` que no son del núcleo se **declaran por módulo** junto al resto de su composición (`CD-12.1`), con su orientación temática. Un dorso de módulo es, por defecto, un dorso **no peligroso** (no dispara `GR-7.6`); si un módulo quisiera un dorso peligroso propio, ver `OQ-CD-6`.

## CD-4. Tipos de cara (`kind`)

Enumeración cerrada; cada valor fija la forma de `face`:

- **CD-4.1** `action` — **carta de acción** (`ActionCard`, fondo azul, `GR-6.4`). `face` es una lista de opciones (`CD-5`). El jugador elige **exactamente una**, o `help` (`GR-8`), o `ignore` (`GR-6.4`).
- **CD-4.2** `hazard` — **carta de peligro** (`HazardCard`, `GR-6.5`). Igual que `action` pero **no admite `ignore`**; hay que resolver una acción aunque sea negativa, y si no se puede completar, se resuelve todo lo posible.
- **CD-4.3** `person` — **carta de persona** (`Person`, fondo verde, `GR-6.6`). `face` son datos de persona (`CD-10`). Al revelarse se une al grupo; colocarla **cuenta como resolver la carta** (`GR-14.4`).
- **CD-4.4** `mission` — **carta de misión** (`MissionCard`, `GR-3.7`, `GR-12.3`). Boca arriba desde el inicio, permanente (`GR-12.6`). Solo se resuelve el área bajo el símbolo de luna (`CD-8` bandera `night`).
- **CD-4.5** `secret` — **carta de secreto** (`SecretCard`, `GR-14.1`). Se revela por referencia numérica desde una recompensa; una vez revelada, se resuelve como una carta más y no puede re-revelarse (`GR-14.2`).
- **CD-4.6** `dream` — **sueño** (`Dream`, `GR-14.3`). No se resuelve al obtenerse: se coloca boca abajo en el tope del mazo personal y se resolverá como carta normal al robarse.
- **CD-4.7** `idea` — **idea** (`Idea`, `GR-10.5`). No es una carta de mazo personal: vive en el banco de trabajo y habilita un crafteo (`CD-11`).
- **CD-4.8** Una carta puede quedar **en juego con acciones permanentes** tras resolverse (`GR-14.5`, `GR-14.6`). Esto es una propiedad de sus acciones (`CD-5` bandera `permanent`), no un `kind` aparte.
- **CD-4.9** **Carta de hoguera (bonfire):** es una carta de día con dorso `camp` (`GR-6.3`) que agrupa **acciones de campamento** como opciones. Se modela como `kind: action` **sin `kind` propio**; lo distintivo son sus opciones, cuyas recompensas típicas son `craft` (`CD-8.3`), `idea` (`CD-8.4`), `dream` (`CD-8.5`) y `recruitPerson` (`CD-8.12`), cada una con su propio coste (`CD-5.2`). Ejemplo de que el **coste es por-opción**: la opción `craft` no añade coste propio (se paga solo la receta del objeto, `CD-8.3`), mientras reclutar o descubrir sí tienen coste.

## CD-5. Anatomía de una acción / opción

El corazón del esquema. Una carta de `kind` `action`/`hazard`/`mission` ofrece una o más **opciones**; el jugador resuelve una (`GR-5.7`). Cada opción tiene:

- **CD-5.1** `requirements` — condiciones que deben **cumplirse** para poder resolver la opción, sin gastarse (`CD-6`). Si no se cumplen (ni con ayuda ni con dados), la opción no es legal.
- **CD-5.2** `costs` — lo que hay que **pagar** para resolver (`CD-7`). Si no se puede o no se quiere pagar, la opción no se resuelve (`GR-7.2`).
- **CD-5.3** `dice` — **número de dados a tirar**: `0` (sin tirada, por defecto), `1` o `2` (`GR-11.2`, `GR-11.7`). Es propiedad **de la opción**, no del módulo ni del *setup*: dos opciones de la misma partida pueden pedir distinto número de dados. Los dados **aumentan los requisitos de habilidad** de la opción (`CD-5.12`); se declara ayuda **antes** de tirar (`GR-11.3`). El azar se inyecta (`ARCH-4.6`).
- **CD-5.4** `rewards` — lo que se **obtiene** al resolver con éxito (`CD-8`).
- **CD-5.5** `effects` — pérdidas **impuestas** por una opción negativa (heridas, calaveras, pagos forzosos), con o sin compensación parcial (`CD-9`, `GR-6.7`).
- **CD-5.6** `polarity` — `positive` | `negative`. Una opción negativa (`GR-6.7`) normalmente no da recompensa. Relevante para `GR-6.5`/`GR-11.4`: cuando una acción se vuelve irresoluble, hay que caer en una opción `negative` de la misma carta si existe.
- **CD-5.7** `partial` — booleano. Si `true`, la opción admite **resolución parcial** cuando no puede completarse (`GR-6.5`: "se resuelve todo lo posible"). Por defecto `false` (todo o nada).
- **CD-5.8** `disposal` — destino de la carta tras resolver: `discard` (boca arriba, `GR-7.13`, por defecto), `remove` (al cementerio, fuera de la partida, símbolo "eliminar", `GR-7.12`), o `keep` (permanece en juego, `CD-5.9`).
- **CD-5.9** `permanent` — booleano. Si `true`, la carta queda en juego y la opción puede **reactivarse** sin consumir la opción del turno (`GR-14.5`); su activación puede requerir gastar la opción `help` (`GR-14.6`). Implica `disposal: keep`.
- **CD-5.10** `timing` — `day` (por defecto) o `night`. Las opciones bajo símbolo de luna se resuelven en la fase de noche (`GR-12.3`, `GR-12.7`). Una misma carta puede tener opciones de día y de noche.
- **CD-5.11** `secretRef` — referencia numérica opcional a una carta de secreto que esta opción revela como recompensa (`GR-14.1`; ver también `CD-8`).
- **CD-5.12** **Caras del dado** (`GR-11.5`). El dado es de **símbolos**, no numérico: 6 caras, cada una un par `{ ability, amount }` con `ability ∈ {strength, awareness, craftsmanship}` y `amount ∈ {1, 2}`. Cada cara **aumenta el requisito de esa habilidad concreta** en esa cantidad (`GR-11.6`); no es un modificador genérico. Con 2 dados, ambos resultados se **acumulan**: se suman si coinciden en habilidad, y suben dos requisitos a la vez si no (`GR-11.8`).
  **Consecuencia para el motor:** la tirada transforma el **vector de requisitos** de la opción, y puede **introducir un requisito que la carta no pedía** — una opción sin requisito de destreza puede acabar exigiéndola. La legalidad (`CD-6.3`) se evalúa siempre contra el requisito **ya aumentado**, nunca contra el impreso en la carta.

## CD-6. Vocabulario de requisitos (`requirements`)

No se pagan ni se gastan: basta con tenerlos (`GR-7.1`). Una opción puede tener varios, todos exigidos (AND):

- **CD-6.1** `ability` — umbral de habilidad: `{ ability: strength|awareness|craftsmanship, amount: n }` (`ARCH-3.3`). Se suman las de **todas las personas del grupo** y de los grupos que ayuden (`GR-7.1`, `GR-8.2`). Los dados suman al umbral requerido (`GR-11.2`).
- **CD-6.2** `possess` — exige **poseer** algo sin gastarlo: p. ej. una `tent` (`GR-10.8`), una herramienta concreta, o cierto estado del grupo. Distinto de pagarlo (`CD-7`).
- **CD-6.3** Los requisitos determinan la **legalidad** de la opción (autoridad del backend, `ARCH-1.3`), y son la base de las afordancias que el frontend puede deshabilitar por UX sin duplicar reglas.

## CD-7. Vocabulario de costes (`costs`)

Lo que se entrega para resolver. Todos los de una opción se pagan (AND). El backend valida que se puedan pagar (`GR-7.2`):

- **CD-7.1** `resource` — `{ resource: food|wood|stone, amount: n }`, desde el almacén común, devuelto a la reserva (`GR-7.3`). Limitado por componente (`GR-7.10`).
- **CD-7.2** `tool` — pagar una ficha de herramienta que ya se posee, devolviéndola a la reserva (`GR-7.4`). **No** puede usarse el efecto de una herramienta y pagarse con ella a la vez.
- **CD-7.3** `discardTop` — descartar `n` cartas del **tope del propio mazo**, boca abajo, sin mirar (`GR-7.5`). Cada carta de dorso rojo así descartada causa **1 herida** al grupo (`GR-7.6`). Lo paga **siempre el dueño del mazo**; nadie puede ayudar a pagarlo (`GR-7.7`, `GR-8.4`).
- **CD-7.4** Los costes de recurso/herramienta **sí** pueden ser cubiertos por otros jugadores en el mismo turno / por ayudantes (`GR-7.11`, `GR-8.5`); solo `discardTop` está atado al dueño del mazo. El esquema debe marcar esta distinción (quién puede pagar).

## CD-8. Vocabulario de recompensas (`rewards`)

Lo que se obtiene al resolver con éxito. Una opción puede otorgar varias:

- **CD-8.1** `resource` — `{ resource: food|wood|stone, amount: n }` al almacén común; limitado por componente (`GR-7.10`). Usable por otros en el mismo turno (`GR-7.11`).
- **CD-8.2** `tool` — obtener una ficha de herramienta (`GR-10.1`), usable en cuanto se obtiene (`GR-10.2`).
- **CD-8.3** `craft` — permite **craftear un objeto** cuya idea ya esté en el banco de trabajo (`GR-10.5`). Solo disponible cuando una carta ofrece esta opción (la hoguera, `CD-4.9`); no en cualquier momento. La opción `craft` **no añade coste propio**: el coste es la **receta del objeto**, definida en su idea (`CD-11.1`) — recursos y requisitos que se pagan al craftear. Su resultado es obtener el `tool` correspondiente.
- **CD-8.4** `idea` — robar del mazo de Ideas y colocar visible en el banco de trabajo; si no hay hueco, eliminar una idea al cementerio (no la recién robada) (`GR-10.6`).
- **CD-8.5** `dream` — robar del mazo de Sueños al tope del mazo personal (`GR-14.3`).
- **CD-8.6** `secret` — revelar la carta de secreto referida por `secretRef` (`CD-5.11`); el que la revela la resuelve, y pueden ayudarle (`GR-14.1`).
- **CD-8.7** `victoryToken` — colocar una ficha de victoria en el tablero de Noche (`GR-4.1`).
- **CD-8.8** `removeSkull` — retirar una calavera del tablero de Noche a la reserva (`GR-4.4`).
- **CD-8.9** `heal` — retirar `n` fichas de herida ya colocadas, repartibles entre personas (`GR-9.7`).
- **CD-8.10** `preventWounds` — evitar `n` heridas que se sufran **ahora** (no retira heridas ya colocadas) (`GR-9.6`). Suele ir atada a pagar una herramienta.
- **CD-8.11** `place` — colocar una carta nueva en una zona (grupo, banco de trabajo, noche…) (`GR-14.4`). Colocarla cuenta como resolver la carta.
- **CD-8.12** `recruitPerson` — **añadir una persona al grupo** robando la carta superior del mazo de Personas, boca arriba (`GR-9.8`); se toman las herramientas que otorgue (`GR-10.4`, `CD-10.3`). Distinto de `place`: no coloca una carta ya conocida, sino que roba de un mazo oculto.

## CD-9. Vocabulario de efectos negativos (`effects`)

Pérdidas impuestas por opciones `negative` (`GR-6.7`). No se eligen: se sufren al resolver esa opción:

- **CD-9.1** `wounds` — infligir `n` heridas al grupo; el jugador reparte en corazones vacíos, y el desborde mata (`GR-9.2`, `GR-9.3`). Un ayudante puede sufrirlas en su lugar (`GR-8.3`).
- **CD-9.2** `skull` — colocar `n` calaveras en el tablero de Noche (`GR-4.2`).
- **CD-9.3** `payResource` / `payTool` / `discardTop` — pago **forzoso** (no opcional) de recursos, herramientas o cartas del tope. Comparte forma con `CD-7` pero es impuesto, no elegido.
- **CD-9.4** Una opción negativa puede incluir **compensación parcial** (`GR-6.7`): entonces lleva también `rewards`. El esquema no prohíbe combinar `effects` y `rewards` en la misma opción.

## CD-10. Datos de persona (`kind: person`)

- **CD-10.1** `abilities` — habilidades que aporta al grupo: cantidades de `strength`/`awareness`/`craftsmanship` (`GR-9.1`, `GR-7.1`, `ARCH-3.3`).
- **CD-10.2** `hearts` — número de espacios de corazón (capacidad de heridas antes de morir) (`GR-9.1`, `GR-9.3`).
- **CD-10.3** `grantsTool` — herramienta otorgada **una única vez** al unirse al grupo; se conserva aunque la persona muera (`GR-10.4`).

## CD-11. Datos de idea, sueño y secreto

- **CD-11.1** `idea` — una idea referencia el **objeto crafteable** que habilita y su receta (requisitos + costes), reutilizando `CD-6`/`CD-7`. Se empieza con 3 ideas iniciales: `torch`, `stone_axe`, `spear` (`GR-3.2`).
- **CD-11.2** `dream` — un sueño es, a efectos de datos, una carta normal (`kind` real de su cara) que llega al mazo por `GR-14.3`. No necesita forma propia más allá de su pertenencia al set `dream`.
- **CD-11.3** `secret` — una carta de secreto tiene un **número de referencia** (destino de `secretRef`, `CD-5.11`) y una cara resoluble como cualquier acción. Puede encadenar a otros secretos vía sus propias recompensas (`GR-14.1`).

## CD-12. Composición de mazos y retiro por módulo

- **CD-12.1** El corpus debe declarar, por módulo, qué cartas **se retiran** antes de barajar (`GR-3.5`, `GR-15.4`) y qué **carta de misión** aporta (`GR-15.5`). Es metadato de composición, no de carta individual.
- **CD-12.2** Reglas propias de módulo (p. ej. las balsas del módulo H, `GR-10.9`) pueden requerir **vocabulario adicional** en este esquema. Se añaden como `CD-*` nuevos cuando se cargue ese módulo, no antes.
- **CD-12.3** La v1 solo carga composición de `base` + `A` + `B` (`OQ-2`, resuelta). El esquema no lo asume (`CD-1.2`).
- **CD-12.4** `maxDice` — máximo de dados que alguna carta del módulo puede pedir (`GR-11.9`, `GR-15.6`). Es **informativo, para la preparación** (cuántos dados poner en la mesa); **no** es autoritativo en resolución: la cantidad real de cada tirada la dice la opción (`CD-5.3`). Con varios módulos, la preparación usa el **máximo** de los anunciados.
  **Nota de modelado:** `maxDice` es **derivable** del corpus — es `max(dice)` sobre las opciones de las cartas del módulo. Conviene **calcularlo, no almacenarlo**; si se almacena, debe validarse contra el corpus, o quedará desincronizado en cuanto cambie una carta.

---

## Cuestiones abiertas

- **OQ-CD-1** **Vocabulario abierto vs cerrado:** `symbols` de dorso (`CD-3.2`) y los objetos de `possess` (`CD-6.2`) son extensibles. ¿Se enumeran exhaustivamente al cargar cada módulo, o se dejan como strings libres validados contra el corpus?
- **OQ-CD-2** **Encadenamiento de acciones:** algunas cartas de módulo pueden encadenar efectos (resolver A habilita B) más allá de secretos. ¿El esquema necesita una noción de *secuencia* o basta con `secretRef` + `place`? A confirmar al ver el corpus de A/B.
- **OQ-CD-3** **Acciones alternativas de cartas permanentes** (`GR-14.6`): el reparto de costes de descarte entre dueño del mazo y activador necesita que el esquema distinga "quién paga cada coste". `CD-7.4` lo marca a alto nivel; el detalle exacto se cierra junto con `Protocol.md` (`ARCH-7.4`).
- **OQ-CD-4** **Fuente del corpus y copyright** (`OQ-1`): formato del dataset (JSON/YAML), ubicación (¿`shared/`?, ¿`backend/`?) y estrategia legal para no distribuir texto con copyright. Bloquea la carga de datos reales, no el esquema.
- **OQ-CD-5** [RESUELTA → `GR-11.5`–`GR-11.9`, `CD-5.3`, `CD-5.12`] **Dados y umbral:** decidido — el dado es de **símbolos**, 6 caras, cada una `{ability, amount}` con `amount ∈ {1,2}` sobre las tres habilidades. Cada cara **aumenta el requisito de esa habilidad concreta**; no es un modificador numérico genérico. El **número de dados lo pide cada acción** (`dice: 0|1|2` en la opción, `CD-5.3`), no el módulo. Con 2 dados los resultados se **acumulan** (`GR-11.8`).
- **OQ-CD-8** [RESUELTA → `GR-11.7`, `GR-11.9`, `CD-5.3`, `CD-12.4`] **Composición de dados entre módulos:** la pregunta partía de una premisa falsa (que el módulo *fijaba* el número de dados de la partida). No es así: **el número de dados lo pide cada acción** (`GR-11.7`), y el módulo solo **anuncia el máximo** que alguna de sus cartas podrá pedir, como ayuda de preparación (`GR-11.9`). Por tanto **no hay conflicto que resolver** entre módulos: cada carta tira lo que pide. Cuando hay varios módulos, la preparación toma el **máximo** de los anunciados.
- **OQ-CD-6** **Peligro en dorsos de módulo:** por defecto un dorso de módulo (`CD-3.4`) es no peligroso y solo `red` dispara heridas al descartarse (`GR-7.6`). ¿Existe algún módulo con un dorso propio que **cuente como peligro** (dispare heridas / no se pueda ignorar)? Si es así, la semántica de peligro deja de estar atada al literal `red` y pasa a ser una **propiedad** del dorso (`isDanger`). A confirmar al cargar módulos más allá de A/B.
- **OQ-CD-7** [RESUELTA] **Coste del crafteo en la hoguera vs `GR-10.5`:** decidido — la opción `craft` **no añade coste propio**; lo que se paga es la **receta del objeto** (definida en su idea, `CD-11.1`). Además, el crafteo solo está disponible cuando una carta ofrece la acción de crafteo (`GR-10.5`, `CD-4.9`), no en cualquier momento. Sin contradicción con `GR-10.5`.
