# GameRules — Paleo

> **Estado:** v1.0 — Reglas base (nivel 1, módulos A+B).
> **Fuente:** Reglamento oficial de Paleo (Peter Rustemeyer, Hans im Glück / Z-Man Games; ed. española de Devir).
> **Alcance:** este documento describe **el dominio del juego**, no su implementación. Frontend, backend, protocolos y persistencia se especifican en otros documentos de `specs/` y deben referenciar las reglas por su ID (p. ej. `GR-5.2`).

## Convención de identificadores

Cada regla tiene un ID estable `GR-<sección>.<número>`. Los IDs **no se reutilizan ni se renumeran**: si una regla se elimina, se marca como `[OBSOLETA]` pero conserva su ID.

---

## GR-1. Visión general

- **GR-1.1** Paleo es un juego **cooperativo** para 1–4 jugadores. Todos ganan o pierden juntos.
- **GR-1.2** La comunicación es **libre**: los jugadores pueden discutir estrategia y compartir información sin restricciones. La única información oculta es la cara de las cartas que nadie ha revelado.
- **GR-1.3** Cada jugador controla un **grupo** de personas y posee un **mazo personal** de cartas. El mazo representa a la vez el entorno a explorar y el tiempo disponible en el día.
- **GR-1.4** Con 4 jugadores, la partida recomendada usa **3 grupos** (dos jugadores comparten un grupo). El número de *grupos*, no de jugadores, es lo que define el estado del juego.
- **GR-1.5** La partida se juega en rondas. Cada ronda = **fase de día** (`GR-5`) + **fase de noche** (`GR-12`).

## GR-2. Componentes

- **GR-2.1** Tres tableros: **Campamento Base**, **Naturaleza** (Wilderness) y **Noche**.
- **GR-2.2** Recursos (limitados por componente, `GR-7.10`): **20 comida**, **12 madera**, **8 piedra**.
- **GR-2.3** 48 fichas de herramienta, 40 fichas de herida, **5 calaveras**, **5 fichas de victoria**, 2 dados.
- **GR-2.4** Zonas auxiliares: **banco de trabajo** (ideas crafteables) y **cementerio** (cartas y personas eliminadas de la partida).
- **GR-2.5** 222 cartas repartidas en sets: Base (32), Personas (20), Sueños (16), Ideas (8), Secretos (22), Módulos A–J (124).

## GR-3. Preparación

- **GR-3.1** Se colocan 5 comidas en el área de almacenamiento del Campamento Base.
- **GR-3.2** El banco de trabajo comienza con las 3 ideas iniciales disponibles para craftear: **antorcha**, **hacha de piedra** y **lanza** (5 fichas de cada una).
- **GR-3.3** Los mazos de **Personas**, **Sueños** e **Ideas** se barajan por separado y se colocan boca abajo en el Campamento Base.
- **GR-3.4** Cada jugador roba **2 personas** y las coloca boca arriba frente a sí. Ese es su grupo inicial. Toma también las fichas de herramienta indicadas en esas cartas de persona (`GR-10.4`).
- **GR-3.5** Se toma el set de cartas Base (32) y se le añaden las cartas de los **2 módulos** elegidos (retirando de cada módulo las cartas que su reglamento indique). Todo se baraja junto.
- **GR-3.6** El mazo resultante se reparte **boca abajo y lo más equitativamente posible** entre los jugadores. Nadie mira las caras. Cada porción es el **mazo personal** de ese jugador. Un reparto desigual no afecta al equilibrio.
- **GR-3.7** Las cartas de **misión** de cada módulo (1 por módulo) se colocan boca arriba desde el inicio y permanecen en juego (`GR-12.3`).

## GR-4. Condiciones de fin de partida

- **GR-4.1** **Victoria:** los jugadores ganan inmediatamente al colocar la **5ª ficha de victoria** en el tablero de Noche (se completa la pintura rupestre).
- **GR-4.2** **Derrota:** los jugadores pierden inmediatamente al colocar la **5ª calavera** en el tablero de Noche.
- **GR-4.3** Si en una misma acción se colocarían la 5ª calavera y la 5ª ficha de victoria, **los jugadores ganan**.
- **GR-4.4** Ciertos efectos permiten **retirar** una calavera del tablero de Noche, devolviéndola a la reserva.

## GR-5. Fase de día

- **GR-5.1** La fase de día consta de múltiples turnos. Todos los jugadores juegan **en simultáneo**.
- **GR-5.2** **Elegir carta:** el jugador mira los **dorsos** de las 3 cartas superiores de su mazo, elige 1 y la coloca boca abajo frente a sí. Nunca puede mirar las caras.
- **GR-5.3** Las 2 cartas no elegidas vuelven **al tope del mazo, en el orden que el jugador quiera**.
- **GR-5.4** Un jugador puede mirar los dorsos de **todas** las cartas de su mazo en cualquier momento, pero **no puede alterar su orden**.
- **GR-5.5** Si quedan menos de 3 cartas en el mazo, se elige igualmente entre las disponibles.
- **GR-5.6** **Revelación:** cuando todos han elegido, todas las cartas se revelan **simultáneamente**.
- **GR-5.7** Cada jugador elige **exactamente 1 opción** de su carta y la resuelve. El **grupo decide colectivamente el orden** en que se resuelven las cartas reveladas.
- **GR-5.8** El grupo puede discutir qué carta elegir, pero **la decisión final sobre la propia carta es individual**.
- **GR-5.9** **Dormir:** cuando un jugador se queda sin cartas en su mazo, se duerme y deja de participar en el día. No puede resolver cartas ni ayudar a otros.
- **GR-5.10** **Dormir temprano:** en lugar de revelar y resolver una carta, un jugador puede **descartar el resto de su mazo boca abajo y sin efecto**, durmiéndose de inmediato. Las cartas rojas descartadas así **no causan heridas**.
- **GR-5.11** La fase de día termina cuando **todos** los jugadores están dormidos.

## GR-6. Dorsos y tipos de carta

- **GR-6.1** Los dorsos son **pistas, no garantías**: bosque, río, montaña, persona, sueño, idea, y dorso **rojo** (peligro). Puede aparecer un peligro tras un dorso normal, y algo positivo tras un dorso rojo.
- **GR-6.2** Algunos dorsos llevan **símbolos adicionales** (p. ej. un mamut) que dan pistas extra sobre la cara.
- **GR-6.3** Orientación temática: en el **bosque** suele haber madera y comida; en el **río**, comida y pieles; en la **montaña**, piedra y pieles; en el **campamento**, personas, sueños e ideas.
- **GR-6.4** **Cartas de acción** (fondo azul): el jugador debe elegir **exactamente una** de estas opciones:
  1. Resolver una de las acciones y obtener sus recompensas.
  2. **Ayudar** a otro jugador (`GR-8`).
  3. **Ignorar** la carta, descartándola boca arriba.
- **GR-6.5** **Cartas de peligro** (fondo rojo o símbolo de peligro): **no se pueden ignorar**. Hay que resolver una acción, aunque sea negativa. Si no se puede resolver por completo una acción negativa, se resuelve **todo lo posible**.
- **GR-6.6** **Cartas de persona** (fondo verde): se añaden al grupo del jugador (`GR-9`).
- **GR-6.7** **Acciones negativas:** normalmente no otorgan recompensa; imponen una pérdida (heridas, pagos, calaveras). Algunas ofrecen una compensación parcial.

## GR-7. Requisitos, costes y recompensas

- **GR-7.1** **Habilidades (requisitos):** **fuerza**, **percepción** y **destreza**. Se suman las de **todas las personas del grupo**. No se pagan ni se gastan: basta con tenerlas.
- **GR-7.2** **Costes (pagos):** recursos, fichas de herramienta o descarte de cartas. Si no se pueden o no se quieren pagar, la acción no se puede resolver.
- **GR-7.3** Los recursos se pagan desde el **almacén común** del Campamento Base, devolviéndolos a la reserva.
- **GR-7.4** Al pagar una **ficha de herramienta**, se devuelve a la reserva. Hay que tenerla ya en el grupo. **No se puede usar el efecto de una herramienta y pagarla con ella a la vez.**
- **GR-7.5** **Descartar cartas (coste):** se descartan N cartas **del tope del propio mazo**, boca abajo y **sin mirar las caras**. No se puede reordenar el mazo: siempre se pagan las cartas de arriba.
- **GR-7.6** **Por cada carta de dorso rojo descartada como coste, el grupo sufre 1 herida** (`GR-9`).
- **GR-7.7** El coste de descartar cartas **lo paga siempre el propietario del mazo**; nadie puede ayudarle a pagarlo (`GR-8.4`).
- **GR-7.8** **Descarte boca abajo:** va a la pila izquierda del tablero de Naturaleza. **No se puede consultar.**
- **GR-7.9** **Descarte boca arriba:** va a la pila derecha del tablero de Naturaleza. **Se puede consultar en cualquier momento.**
- **GR-7.10** **Recompensas de recurso:** comida, madera y piedra van al almacén común. Están **limitados por componente**: si no quedan en la reserva, no se pueden obtener.
- **GR-7.11** Los recursos obtenidos **pueden ser usados por otro jugador en el mismo turno**.
- **GR-7.12** **Símbolo "eliminar":** tras resolver la acción, la carta va al **cementerio** en lugar de al descarte: queda **fuera de la partida** (los descartes se rebarajan cada día, `GR-13`).
- **GR-7.13** **Limpieza:** tras resolver una acción, la carta se descarta **boca arriba**.

## GR-8. Ayudar

- **GR-8.1** Toda carta de acción incluye la opción de **ayudar a otro grupo**. Es la opción que el ayudante gasta en su turno; su carta se descarta.
- **GR-8.2** Al ayudar, el ayudante **suma las habilidades y ventajas de su grupo** a las del grupo ayudado para resolver la carta de éste.
- **GR-8.3** El ayudante puede **sufrir las heridas en lugar** del grupo ayudado.
- **GR-8.4** El ayudante **no puede descartar cartas de su mazo** para pagar costes ajenos (`GR-7.7`).
- **GR-8.5** El grupo ayudado y el ayudante **se reparten las recompensas** de la acción.
- **GR-8.6** Varios jugadores pueden ayudar a un mismo jugador simultáneamente.
- **GR-8.7** La ayuda debe declararse **antes de tirar los dados** (`GR-11.3`).
- **GR-8.8** Curar a personas de otro grupo solo es posible si hay una relación de ayuda entre ambos grupos (`GR-9.7`).

## GR-9. Personas, heridas y muerte

- **GR-9.1** Cada persona tiene una o varias habilidades (`GR-7.1`) y un número de **espacios de corazón**.
- **GR-9.2** Cuando un grupo sufre heridas, **el jugador elige a una persona** de su grupo y coloca 1 ficha de herida por herida sufrida en un corazón vacío.
- **GR-9.3** Si no quedan corazones vacíos y hay que colocar más heridas, se coloca 1 herida en el **espacio de calavera** de esa carta: **esa persona muere**. Las heridas restantes se **ignoran**.
- **GR-9.4** Al morir una persona: se devuelven sus fichas de herida a la reserva, la carta va al **cementerio** (fuera de la partida) y se coloca **1 calavera** en el tablero de Noche.
- **GR-9.5** Si muere la **última** persona de un grupo, tras colocar la calavera el jugador **roba inmediatamente una nueva persona** del mazo de Personas.
- **GR-9.6** **Prevenir heridas:** ciertos efectos (normalmente pagando una herramienta) evitan heridas que se estén sufriendo **ahora**. No sirven para retirar heridas ya colocadas.
- **GR-9.7** **Curar:** retira N fichas de herida ya colocadas. La curación puede repartirse entre varias personas.

## GR-10. Herramientas, ideas y crafteo

- **GR-10.1** Las fichas de herramienta representan objetos crafteados (antorcha, hacha, lanza…) y otros objetos (pieles, raíces, talismán, tienda, balsa).
- **GR-10.2** Una herramienta se coloca junto al grupo y **puede usarse en cuanto se obtiene**.
- **GR-10.3** **Usar una herramienta implica descartarla**: cada ficha de herramienta es de **un solo uso**.
- **GR-10.4** Algunas cartas de persona otorgan una herramienta **una única vez**, al unirse al grupo. La herramienta se conserva aunque esa persona muera.
- **GR-10.5** **Crafteo:** para craftear un objeto hay que tener antes su **idea** en el banco de trabajo. Se pagan los recursos y requisitos como en cualquier acción. Se empieza con 3 ideas (`GR-3.2`).
- **GR-10.6** **Recompensa "idea":** se roba una carta del mazo de Ideas y se coloca **visible para todos** en un hueco libre del banco de trabajo. Si no hay hueco, hay que **eliminar una idea al cementerio** (no puede ser la recién robada).
- **GR-10.7** **Talismán:** al revelar una carta de peligro, se puede descartar un talismán para **ignorar el peligro** y descartarlo sin efecto.
- **GR-10.8** **Tienda:** no tiene efecto propio; otras cartas exigen poseerla.
- **GR-10.9** **Balsa:** solo se usa con el módulo H.

## GR-11. Peligros y dados

- **GR-11.1** Ver `GR-6.5` para las cartas de peligro.
- **GR-11.2** Algunas acciones tienen resultado incierto: se tiran los dados indicados. Los dados **aumentan los requisitos de habilidad** de la acción.
- **GR-11.3** Si quiere pedirse ayuda, debe hacerse **antes de tirar**. Nadie puede decidir ayudar después de ver los dados.
- **GR-11.4** Si el resultado de los dados hace imposible resolver la acción, el jugador debe resolver en su lugar una **acción negativa** de la carta, o **ignorar** la carta si no hay ninguna.

## GR-12. Fase de noche

- **GR-12.1** Comienza cuando todos los jugadores están dormidos (`GR-5.11`).
- **GR-12.2** **Alimentar:** cada jugador paga **1 comida por cada persona de su grupo** desde el almacén común. Por cada persona **sin alimentar** se coloca **1 calavera** en el tablero de Noche. Las personas sin alimentar **no mueren**.
- **GR-12.3** **Cartas de misión:** después de alimentar, se resuelven todas las cartas de misión boca arriba (1 por módulo). Solo importa el área bajo el **símbolo de luna**. El grupo elige y resuelve **1 de sus acciones**.
- **GR-12.4** Las misiones **no se pueden ignorar** y siempre ofrecen una opción negativa (normalmente una calavera).
- **GR-12.5** Como las misiones se resuelven **como tribu**, cualquier jugador puede pagar los costes; se decide colectivamente.
- **GR-12.6** Las cartas de misión **permanecen en juego** tras resolverse, salvo que la propia carta indique lo contrario. Habrá que volver a atenderlas la noche siguiente.
- **GR-12.7** **Cartas de acción nocturna:** las cartas en juego con el símbolo de luna se resuelven en la fase de noche igual que las misiones.

## GR-13. Nuevo día

- **GR-13.1** Se **barajan juntas** ambas pilas de descarte (boca arriba y boca abajo) del tablero de Naturaleza.
- **GR-13.2** El mazo resultante se reparte **boca abajo y lo más equitativamente posible** entre los jugadores, formando sus nuevos mazos personales. Nadie mira las caras.
- **GR-13.3** Las cartas del **cementerio no vuelven** al juego (`GR-7.12`, `GR-9.4`).
- **GR-13.4** Terminado el reparto, comienza la siguiente fase de día.

## GR-14. Cartas especiales

- **GR-14.1** **Secretos:** algunas recompensas indican un número de secreto. Se busca esa carta en el mazo de Secretos, se revela y se lee en voz alta. El jugador que la reveló **resuelve también la carta de secreto**. Otros grupos pueden ayudarle con normalidad, incluso después de leerla.
- **GR-14.2** Una carta de secreto **ya revelada no puede volver a revelarse**.
- **GR-14.3** **Sueños:** la recompensa "sueño" roba 1 carta del mazo de Sueños y la coloca **boca abajo en el tope del mazo personal** del jugador.
- **GR-14.4** **Cartas nuevas:** algunas cartas indican dónde colocarse al ser reveladas (en el grupo, en el banco de trabajo, en la noche…). Hacerlo **cuenta como resolver la carta**: no se puede elegir otra acción.
- **GR-14.5** **Acciones adicionales:** algunas cartas quedan **en juego** (en el grupo o en un tablero) con acciones que **no consumen la opción del turno**. Pueden resolverse tantas veces como se indique y **no se descartan** al usarse.
- **GR-14.6** **Acciones alternativas:** para activar la acción de una carta permanente, el jugador debe usar la opción **"ayudar"** de su carta revelada. Si la carta permanente pertenece a otro grupo, ese otro jugador también debe gastar su opción "ayudar", y **los costes de descarte los paga el dueño del mazo** correspondiente.

## GR-15. Módulos y escenarios

- **GR-15.1** Hay 10 módulos (A–J). En una partida normal se usan **2**.
- **GR-15.2** Los módulos se agrupan en **7 niveles de dificultad creciente**, pero pueden combinarse libremente y jugarse en cualquier orden.
- **GR-15.3** La primera partida usa los módulos **A + B** (nivel 1).
- **GR-15.4** Cada módulo retira algunas de sus cartas antes de barajar y puede añadir **reglas propias** (p. ej. el módulo H introduce las balsas, `GR-10.9`).
- **GR-15.5** Cada módulo aporta **1 carta de misión** (`GR-12.3`).

---

## Cuestiones abiertas

- **OQ-1** El contenido concreto de las 124 cartas de módulo (requisitos, costes, recompensas, encadenamientos de secretos) **no está en el reglamento**. Requiere una spec de datos propia (`specs/CardData.md`, pendiente) y tiene implicaciones de copyright para la distribución.
- **OQ-2** Alcance de la v1: ¿implementamos solo el nivel 1 (base + módulos A y B) o el motor completo A–J desde el principio?
- **OQ-3** Modo de juego: ¿multijugador en red, hotseat, o solitario (1 jugador controlando varios grupos)?
