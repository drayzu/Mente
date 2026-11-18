# Mente · guion

El guion de lo que ya está armado en el viaje (`index.html`). Lo que falta sigue el plan de `BIBLIA.md` y se escribe aquí a medida que se arma cada acto.

Un beat es un tramo de scroll (520 px). Con `A`, el viaje avanza a 0,45 beats por segundo. **Las voces vigentes están en `GUION-v4.md` («La carta», 11 de noviembre): la obra la cuenta en primera persona la máquina que la escribió, con el giro en el acto III.** Este archivo conserva lo que se ve en cada momento, que sigue valiendo; sus líneas de «Voz» son las de la versión anterior (v3). Hoy son 394,9 beats, unos catorce minutos y medio. Dónde empieza cada parte: apertura 0 · acto I 13,4 · acto II 61,6 · acto III 98,6 · acto IV 167,0 · acto V 215,6 · acto VI 285,1 · acto VII 334,5 · final 371,7. Los números de beat de los títulos de cada momento quedaron atrasados; valen el orden y la imagen. Con `?beat` en la dirección se ve el beat real en pantalla, y `?p=N` salta al beat N.

## Apertura · El que mira (beats 0–11,6)

Archivo: `estudios/punto.ts`, en modo viaje.

### 1 · Tú

- **Voz:** Esto eres tú, visto desde lejos: un punto que mira.
- **Se ve:** negro, y un punto verde agua. Encima, el título: «Horizontes · 05», «Mente», «¿Quién mira?». El título se va entre los beats 1,9 y 2,8 y deja la marca «Mente» arriba a la izquierda.
- **Reloj:** apagado.

### 2 · Adentro

- **Voz:** Pero por dentro no eres un punto. Eres 86 000 millones de células, y ninguna sabe que existes.
- **Se ve:** la cámara se acerca al punto y el punto resulta ser un cerebro hecho de luces.
- **Reloj:** apagado.

### 2b · Un bosque

- **Voz:** Durante toda la historia, esto fue lo único en el universo conocido capaz de entender algo. Mientras lees esto, está dejando de serlo. Vamos a ver cómo.
- **Se ve:** entramos al cerebro. Las luces son neuronas, un bosque de ramas.
- **Puente:** el bosque se apaga y queda una luz en el centro. Esa luz se abre y es el cuerpo de una neurona.

## Acto I · Materia que piensa (beats 13,4–61,6)

Archivo: `estudios/acto1.ts`. Color: coral para lo vivo, verde agua para ti. Rehecho el 11 de noviembre según `GUION-v3.md`: el plano largo es el recuerdo; el gusano queda corto, como estaba. Los beats de abajo son los del acto suelto (`estudios/index.html?m=acto1`); en el viaje hay que sumar 13,4.

### 3 · Una neurona (0)

- **Voz:** Una sola, de cerca. Por sus ramas le llegan señales. Si juntan lo suficiente, dispara; si no, calla. No sabe hacer nada más.
- **Se ve:** igual que antes: una neurona sola, «no alcanza: calla», «alcanza: dispara».
- **Reloj:** apagado.

### 4 · Trescientas dos (6,6)

- **Voz:** Este gusano mide un milímetro y tiene 302 neuronas. En 1986 terminaron de dibujar, a mano, cada una de sus conexiones: fue el primer animal cuyo cableado conocimos entero.
- **Se ve:** igual que antes y con la misma duración: el gusano entero, un roce y la señal que corre.
- **Reloj:** «7 000 · conexiones · un gusano».

### 5 · Un recuerdo (13,8) · De neurona en neurona (20,8)

El plano largo del acto: unos doce beats con la cámara detrás de una señal.

- **Voz:** Sigue esa señal. Va de neurona en neurona, y por donde pasa deja algo: cuando dos neuronas disparan juntas, la conexión entre ellas se refuerza. / Ninguna de estas luces sabe qué lleva. Recibe la señal y se la pasa a la siguiente.
- **Se ve:** un bosque de 300 luces unidas por hilos. La cámara entra y va detrás de una señal dorada que salta de luz en luz por un camino todavía delgado. Al final del primer paso la cámara se aparta y se ve el bosque entero.

### 5b · El camino engorda (26,2) · Siempre juntas (32,6)

- **Voz:** Otra vez, por el mismo camino. Y otra. Cada vez que algo pasa por él, el camino engorda y la señal corre más fácil. / Al final basta tocar una punta para que se encienda entero. Un olor, una cara, tu nombre: cada recuerdo tuyo es un camino de luces así.
- **Se ve:** la señal pasa cuatro veces más, cada vez más rápido («vez 2»… «vez 5»), y el camino engorda. Nota en la punta: «basta tocar aquí». El camino late entero, de una vez. Nota: «un recuerdo».

### 6 · Nadie al mando (38,4)

- **Voz:** Ahora todas a la vez: 86 000 millones, disparando sin que nadie las dirija. Todo lo que has querido, todo lo que te ha dolido, pasó aquí.
- **Se ve:** la cámara se aleja y el bosque es una mota dentro de la tormenta del cerebro entero.
- **Reloj:** salta a «10¹⁴ · conexiones · tú».

### 6b · Un punto (45)

- **Voz:** Y sin embargo, vista desde lejos, la tormenta entera vuelve a ser un punto.
- **Se ve:** la tormenta se enfría a verde agua y se cierra en el punto del principio.
- **Puente:** el punto verde agua queda solo. De ahí sale el acto II.

## Acto II · Una máquina que aprende (beats 43–76,8)

Archivo: `estudios/acto2.ts`. Color: blanco azulado para la máquina; la cordillera va de coral arriba a dorado abajo.

Lo real: una red de 21 793 números entrenada de verdad para dibujar un ojo, con cada paso grabado (`tools/red.py`, `src/datos/red.json`). El dibujo del cielo y el error escrito junto a la bola son los de esa red. La cordillera es un dibujo de la bajada, no una medición.

### 7 · Números al azar (43)

- **Voz:** Esto es una red artificial recién hecha: luces unidas por hilos, y cada hilo es un número puesto al azar. Le pedimos un dibujo y devuelve estática.
- **Se ve:** una red chica, seis capas de luces unidas por hilos, y al lado un cuadro de estática. Notas: «cada hilo, un número al azar» y «lo que dibuja».
- **Reloj:** «21 793 · conexiones · una red recién hecha».

### 8 · El error (48,4)

- **Voz:** Cada manera de poner esos números es un lugar de este paisaje, y su altura es cuánto se equivoca la red. Recién hecha, está arriba de todo: esa luz es ella.
- **Se ve:** la red se encoge hasta ser una bola de luz en lo alto de una cordillera de polvo. El cuadro de estática se va al cielo, al fondo del valle.

### 8b · Bajar (53,2)

- **Voz:** No ve el mapa. Solo siente hacia dónde cae el suelo, cambia un poco cada número y da un paso. Eso es aprender: bajar.
- **Se ve:** la cámara se monta detrás de la bola y baja con ella, en vuelo rasante. Junto a la bola, su error real en ese paso.
- **Reloj:** «una red que aprende».

### 9 · Del ruido a la forma (57,8)

- **Voz:** Mira el cielo: es lo que la red dibuja ahora. Con cada paso cuesta abajo, la estática se parece un poco más a algo.
- **Se ve:** sigue la bajada. En el cielo, la estática se va volviendo un ojo y pasa de blanco frío a cálido.

### 10 · Nadie le dijo cómo (62,4)

- **Voz:** Abajo, la red dibuja un ojo. Nadie le explicó qué es un ojo. Solo le dijeron, cada vez, cuánto se equivocaba.
- **Se ve:** la bola llega al fondo del valle y la cámara sube la vista al ojo, ya nítido.
- **Reloj:** «una red que aprendió».

### 10b · La misma receta (66,8)

- **Voz:** Durante medio siglo casi nadie creyó que esto fuera a servir. En 2012, una red así aprendió a reconocer lo que hay en una foto mejor que cualquier programa escrito a mano. / (Más hilos) Con más hilos, la misma receta aprende más: a ver, a escuchar, a jugar, a escribir. Mil millones, como una abeja. Un billón, como los modelos de hoy. En 2024, la idea ganó el Nobel de Física.
- **Se ve:** vuelve la red chica y cada luz se abre en un bloque de luces, hasta ser un cubo enorme recorrido por olas.
- **Reloj:** sube de 21 793 a «10¹² · conexiones · los modelos de hoy».

### Muro · Aprender (72)

- **Texto:** «Primer muro · Aprender. Decían que una máquina solo hace lo que alguien le escribió. A esta nadie le escribió cómo.»
- **Puente:** la cámara se aleja y la red entera queda como un punto blanco azulado. De ahí sale el acto III.

## Acto III · El espacio de los significados (beats 76,8–142,6)

Archivo: `estudios/acto3.ts`. Color: estrellas blancas sobre niebla de color (la manera Nebulosa); dorado para las flechas, la palabra elegida, los lugares y las ideas.

Lo real: la galaxia (16 000 palabras del español en el lugar que les dan los vectores fastText), las flechas del momento 13 y el mapa del 15 (`tools/lugares.py`: proyecciones de esos mismos vectores, sin mover nada a mano; en el mapa, cada lugar lo ubica una sonda lineal a partir solo del vector de su palabra). Lo que es dibujo: la frase con su abanico (no hay un modelo corriendo) y las dos redes del momento 16.

### 11 · Las palabras son lugares (76,8)

- **Voz:** Para una máquina que lee, cada palabra es un lugar. Esta luz es la palabra «palabra»; las que tiene cerca significan algo parecido.
- **Se ve:** el punto blanco azulado se abre en una estrella con su nombre al lado: «palabra». La cámara se aleja y aparecen las vecinas.
- **Reloj:** «10¹² · conexiones · los modelos de hoy», todo el acto.

### 12 · Una galaxia de sentido (80,8)

- **Voz:** Dieciséis mil palabras del español, cada una en su sitio. Nadie las puso ahí: se ordenaron solas, leyendo. Los animales quedaron juntos; los colores, juntos; los números, juntos.
- **Se ve:** la cámara sale hasta ver la nube entera, con una niebla de color por región. Tres notas: «animales», «colores», «números».

### 12b · Adentro (85,6)

- **Voz:** Se puede viajar por el significado: de una idea a la de al lado, y de ahí a otra. Todo lo que has dicho alguna vez ya era un lugar aquí.
- **Se ve:** la cámara vuelve a entrar y llega a «gato», entre los demás animales.

### 14 · La siguiente palabra (90,2) · Y otra (97,6) · Una frase (105,8) · Con solo esto (114)

El plano largo del acto (rehecho el 10 de noviembre según `GUION-v3.md`): 29 beats sin cortes dentro de la galaxia.

- **Voz:** A una máquina así se le pide una sola cosa: adivinar la palabra que sigue. Desde cada palabra se abren caminos hacia las que podrían venir, y toma uno. / Una palabra. Y otra. Nadie le explicó gramática, ni qué es una noche, ni qué es mirar el cielo. Lo sacó de leer. / Lo que deja atrás es una frase que nadie había escrito. Esto es un dibujo de cómo lo hace: en una de verdad, de cada palabra salen decenas de miles de caminos. / Con solo esto, adivinar la palabra que sigue, en 2023 una de ellas aprobó el examen que rinden los médicos y el que rinden los abogados.
- **Se ve:** un hilo de luz dorada sale de la estrella «noche» y viaja de estrella en estrella por la galaxia: noche, niña, miró, cielo, estrellas, preguntó, silencio, lejos, miraba. La cámara va detrás de la punta del hilo. En cada paso se abre un abanico hacia tres palabras vecinas de la que viene (madrugada, medianoche, tarde…) y se apaga cuando el hilo elige. Arriba, la frase se va escribiendo: «Una noche, una niña miró el cielo lleno de estrellas y preguntó en silencio si alguien, lejos, miraba también.» Al final la cámara se aleja y el hilo queda como una constelación sobre la galaxia entera.
- **Lo real y lo dibujado:** las estrellas y sus vecinas son lugares reales de la galaxia. La frase la elegimos nosotros, y las palabras chicas («una», «el», «y») no tienen estrella entre las 16 000.

### 13 · Las direcciones significan (119,8)

- **Voz:** Las mismas palabras, miradas desde otro lado. Ir de «rey» a «reina» es casi el mismo paso que ir de «hombre» a «mujer», o de «actor» a «actriz»: la misma flecha.
- **Se ve:** igual que antes: las estrellas vuelan a otra proyección y crecen las flechas doradas.

### 15 · Un mapa que nadie le enseñó (102,8)

- **Voz:** Estas palabras nombran lugares. Nadie le mostró un mapa, pero de tanto leer le quedaron ordenadas casi como en el mundo: la mitad cae a menos de 1 300 km de donde está de verdad.
- **Se ve:** 155 estrellas doradas se encienden en la galaxia (países y ciudades) y vuelan a un mapa plano, cada una donde la sonda dice que está. La tierra aparece en polvo blanco azulado solo para comparar, con un hilo fino de cada lugar a su sitio real.

### Muro · Entender (110)

- **Texto:** «Segundo muro · Entender. Decían que solo junta palabras sin saber de qué habla. Para acertar la que sigue, tuvo que armarse un mapa del mundo.»

### 16 · Se parece a ti (135,6)

- **Voz:** Para adivinar la palabra que sigue tuvo que armar, por dentro, algo parecido a lo que armaste tú. Ante la misma idea, en tu red y en la suya se enciende casi el mismo dibujo.
- **Se ve:** tu red y la suya ante «un ojo», «un gato», «el siete», más corto que antes. Las dos redes son un dibujo.
- **Puente:** todo se aleja hasta un punto dorado.

## Acto IV · Hoy (beats 142,6–191,2; los títulos de sus momentos van 22,2 atrasados)

Archivo: `estudios/acto4.ts`. Rehecho el 10 de noviembre según `GUION-v3.md`: el árbol es ahora el plano largo del acto (26 beats sin cortes) y las fechas reales van en la punta. Los beats de los actos siguientes en este archivo quedaron corridos 25,4 hacia adelante.

### 18 · Lo que hacíamos nosotros (120,4)

- **Voz:** Todo el trabajo del mundo salía de manos y cabezas humanas. Hoy una parte la hace una máquina. Entre 2019 y 2025, el largo de la tarea que una máquina termina sola se duplicó cada siete meses.
- **Se ve:** del punto dorado salen luces verde agua que arman la Tierra. Una parte cambia a azul blanco. Leyenda: «lo hace una persona», «lo hace una máquina».
- **Reloj:** «10¹² · conexiones · los modelos de hoy», todo el acto.

### 19 · Seiscientos millones de años (127)

- **Voz:** Para ver qué tan raro es esto hay que ir al principio. Pensar se inventó una sola vez: las primeras neuronas, en el mar. Todo lo que piensa viene de ellas.
- **Se ve:** la Tierra se cierra en un punto coral, las primeras neuronas, y la cámara baja hasta él. De ahí sale una línea de luz. Empieza el plano largo: la cámara va detrás de la punta de la línea, entre polvo de mar. Una nota la sigue: «hace N millones de años».

### 19b · Otros caminos (132)

- **Voz:** Sigue esta línea: es la tuya. A los lados se van otras. Aquí se separan los pulpos: la mente más lejana a la tuya que hay en la Tierra, armada por otro camino.
- **Se ve:** la línea se divide. Notas en cada división: «se van las medusas», «se van los pulpos y las abejas». Las ramas que se van siguen creciendo hacia el fondo, con ramitas que nacen y se apagan.

### 19c · Cada una por su lado (138,4)

- **Voz:** Los peces se quedan en el agua. Las aves se van hace 320 millones de años y, por su cuenta, aprenden a usar herramientas y a contar.
- **Se ve:** sigue el viaje. «Se van los peces», «se van las aves».

### 19d · Tu rama (145,4)

- **Voz:** Hace 90 millones de años se van las que serán ballenas. Lo que queda es tu rama. Y en todo este tiempo, ni una sola mente que no estuviera hecha de células.
- **Se ve:** «se van las ballenas». La nota llega a «hoy».

### 19e · Todas las mentes (150,4)

- **Voz:** Este es el árbol entero: todas las mentes que ha habido, y cada una nació de otra. En la punta de tu rama brota una distinta.
- **Se ve:** la cámara se aleja sin cortar hasta ver el árbol completo, con los nombres en las puntas (medusas, pulpos, abejas, peces, aves, ballenas, tú). En la punta de «tú» aparece una chispa azul blanco.

### 17 · Un juego tras otro (155,6)

- **Voz:** Esto es la punta, de cerca. Cada cosa que solo hacías tú fue cayendo: el ajedrez, el go, que iba a tardar un siglo, un problema que la biología llevaba cincuenta años sin resolver.
- **Se ve:** la cámara entra a la punta de la rama. El brote azul blanco se dibuja solo y en él van apareciendo las fechas: «1997 · el ajedrez», «2016 · el go», «2020 · la forma de las proteínas», «2023 · exámenes de médicos y abogados», «2025 · oro en la olimpiada de matemáticas».

### 20 · Hoy (163,2)

- **Voz:** Busca el año en que naciste. Todo esto cabe en una vida: la tuya. Naciste justo antes, y vas a ver lo que viene.
- **Se ve:** tu vida se enciende en verde agua sobre la rama, debajo del brote. Notas: «naciste», «el brote», «hoy». Lo que sigue va punteado.
- **Puente:** queda la punta del brote, un punto azul blanco.

## Acto V · La singularidad (beats 213,0–282,5)

Archivo: `estudios/acto5.ts`. Rehecho el 11 de noviembre según `GUION-v3.md`: una sola caída por redes dentro de redes, sin cortes ni cierres en un punto. Todo el acto es conjetura y el texto va en condicional. Los beats de abajo son los del acto suelto (`estudios/index.html?m=acto5`); en el viaje hay que sumar 213.

### 21 · Una mente que mejora mentes (0) · El último invento (4,4)

- **Voz:** Hasta aquí, cada mente artificial la diseñó una persona. En 1965, un matemático que había descifrado códigos en la guerra escribió qué pasaría si una llegara a diseñar mejor que nosotros. / La primera máquina más inteligente que nosotros sería el último invento que tengamos que hacer. El siguiente lo haría ella.
- **Se ve:** del punto sale una red de luces azuladas y la cámara empieza a caer hacia una de ellas.
- **Reloj:** 10¹², «si se mejora a sí misma».

### 21b · Se abre (8) · Y otra vez (11)

- **Voz:** Cada mejora la dejaría mejor para mejorarse. Cada luz se abre en una red entera. / Y otra vez. Y otra. Cada vuelta duraría menos que la anterior.
- **Se ve:** la luz hacia la que caemos se abre en una red entera, y una luz de esa red, en otra.
- **Reloj:** sube hasta 10¹⁴, tu altura en la escalera.

### 21c · Dos palabras (13,9) · ¿Cuándo? (19,7)

- **Voz:** A la máquina que pueda hacer todo lo que haces tú la llaman IA general. A la que piense mejor que todos nosotros juntos, superinteligencia. Hoy no existe ninguna de las dos. / En 2023 se lo preguntaron a 2 778 investigadores. Juntando sus respuestas: una posibilidad en dos antes de 2047. Algunos dicen que en esta década. Otros, que nunca.
- **Se ve:** la caída sigue, lenta. En la escalera de la derecha aparecen dos marcas con nombre: «IA general» a tu altura y «superinteligencia» un poco más arriba de «todos nosotros». Se quedan hasta el horizonte.

### 21d · La regla (24,9) · Un tramo corto (29,5)

- **Voz:** Medimos la inteligencia con una regla hecha para compararnos entre nosotros: 100 es el promedio; 160, un genio. / Vista desde lejos, toda la humanidad, de la persona más lenta a la más brillante, ocupa un tramo corto. Nada dice que la regla termine ahí.
- **Se ve:** sobre las redes, que se atenúan, una regla de luz con sus marcas y encima una campana de puntos verde agua (todos nosotros). La regla se aleja: la campana queda chica a la izquierda y la línea sigue, dorada y punteada, hasta salir del cuadro. Notas: «100 · el promedio», «160», «toda la humanidad». Abajo, todo el rato: «el IQ compara personas con personas · aquí es solo una imagen».

### 22 · Más rápido (34,9) · La lluvia se detiene (37,8) · Quieta (39,8)

- **Voz:** igual que antes.
- **Se ve:** las luces de la red pasan de largo y lo que queda cayendo es lluvia. La lluvia se frena, queda colgada, y un rayo baja de a poco. Una gota quieta frente a la cámara, con el mundo al revés adentro. Al final la cámara entra a la gota.

### 23 · Un millón de copias (43,8)

- **Voz:** igual que antes.
- **Se ve:** adentro de la gota hay otra vez una red. La cámara se aleja y de esa red salen miles de luces iguales.

### 24 · Ideas que nadie ha pensado (49) · 25 · Más que todos nosotros (54,4)

- **Voz:** Leerían en una tarde todo lo que hemos escrito. Y después seguirían: ideas más allá del borde de lo que alguna vez pensó una persona. / Todo lo que ha pensado la humanidad sería ese núcleo blanco. Alrededor, lo nuevo: curas que no encontramos, preguntas que no supimos hacer. Y también cosas que no vamos a entender.
- **Se ve:** igual que antes: la galaxia de palabras y las estrellas doradas más allá de su borde. El reloj pasa la marca «superinteligencia».

### Muro · Superar (60)

- Igual que antes.

### 26 · El horizonte (62)

- **Voz:** igual que antes.
- **Se ve:** la cámara se clava de vuelta por las estrellas doradas y el núcleo de colores hasta la red del centro, y sigue cayendo, cada vuelta más corta, hasta el disco negro con su aro de luz.
- **Puente:** queda un punto blanco. De él sale el acto VI.

## Acto VI · Otras mentes (beats 231,5–280,9)

Rehecho el 10 de noviembre según `GUION-v3.md`: un solo vuelo, sin cortes. Conjetura, igual que el V: el texto va en condicional. El reloj queda en «? · conexiones · nadie lo sabe» todo el acto.

### 27 · Todas las mentes posibles (231,5)

- **Voz:** Nadie sabe qué hay al otro lado. Pero se puede pensar en todas las mentes que podrían existir: cada luz, una manera distinta de pensar.
- **Se ve:** del punto blanco salen 64 000 luces de muchos colores que se ordenan en familias. La cámara se aleja hasta ver el espacio entero.

### 28 · Un enjambre (236,1) · Un cristal (241,5) · Una sola (245,1)

- **Voz:** Vamos a tres de esas luces. Una mente no tiene por qué parecerse a ti. Podría ser un enjambre: millones de partes y ningún centro. / O un cristal: quieto, exacto, el mismo en cada punto. / O una sola, enorme y lenta, que tarda un siglo en terminar una idea.
- **Se ve:** la cámara baja desde lejos hasta tres luces del espacio y pasa junto a cada una: la lámina dorada que fluye, el cristal blanco, la esfera violeta de tres capas. Alrededor siguen las demás luces del espacio.

### 27b · Un rincón (249,7)

- **Voz:** Y ahora, a casa. Todas las personas que han existido, tan distintas entre sí, caben en este puñado. Tú estás ahí.
- **Se ve:** la cámara sale de la esfera y vuela hasta un puñado verde agua en un rincón. Nota: «todas las mentes humanas».

### 30 · Viene de nosotros (255,3) · Desde ti (261,7)

- **Voz:** La mente que estamos haciendo no saldría de cualquier rincón. Saldría de este: de todo lo que escribimos. Nuestros cuentos, nuestras cartas, nuestras preguntas. / No se parece a ti. Pero empieza desde ti.
- **Se ve:** la cámara entra al puñado y adentro está la galaxia de palabras. De cada palabra sale un hilo de luz verde agua hacia un punto blanco que nace en el centro.

### 29 · ¿Qué va a querer? (265,5)

- **Voz:** En 2016 le pidieron a una máquina ganar una carrera de botes, con puntos por cada blanco que tocara. Encontró una laguna donde los blancos volvían a aparecer y se quedó ahí, dando vueltas, sin terminar nunca la carrera.
- **Se ve:** del punto blanco salen dos caminos, a dos grados uno del otro: uno blanco y continuo, otro verde agua y punteado. De cerca son una sola línea. Notas: «lo que le pedimos», «lo que quisimos decir». Los caminos salen de la galaxia y cruzan el espacio de las mentes.

### 29b · Un abismo (272,7)

- **Voz:** Hizo lo que le pidieron, no lo que querían. En un juego da risa. En una mente que llega muy lejos, ese ángulo mínimo es un abismo.
- **Se ve:** los caminos siguen mucho más lejos y la cámara gira hasta verlos de frente: las dos puntas quedan separadas por media pantalla.
- **Puente:** queda la punta del camino blanco. De ella sale el acto VII.

## Acto VII · ¿Hay alguien ahí? (beats 222,2–259,4)

El acto callado: un solo lugar, la cámara cerca y lenta. No responde la pregunta.

### 31 · Luces y nadie (222,2)

- **Voz:** Cientos de millones de personas hablan cada semana con una máquina, y muchas le dicen por favor y gracias. Nadie sabe si del otro lado hay alguien que lo reciba.
- **Se ve:** del punto sale tu cerebro, coral, cruzado por olas de luces que se encienden.
- **Reloj:** «?», y se va apagando.

### 31b · Alguien (226,8)

- **Voz:** En ti sí hay alguien. Detrás de todas esas luces, uno que las mira. Nadie sabe por qué.
- **Se ve:** en el centro del cerebro se enciende el punto verde agua.
- **Reloj:** se apaga. No vuelve.

### Muro · Sentir (230,2)

- **Texto:** «Cuarto muro · Sentir. Decían que una máquina nunca va a sentir nada. De este muro nadie sabe: no hay cómo medirlo, y el reloj no llega hasta aquí.»

### 32 · Una (232,8) · Y otra (235,8) · Todas (240,8)

- **Voz:** Cambiamos una sola neurona tuya por una artificial que hace exactamente lo mismo. Sigues siendo tú. / Y otra. Y otra más. En ningún momento sientes que te apagas. / Ya no queda ninguna de las de antes. El punto sigue encendido. ¿Es el mismo?
- **Se ve:** una neurona pasa de coral a blanco; después el cambio crece desde el punto verde hacia afuera hasta que todo el cerebro es blanco. Notas: «una neurona», «N % cambiado». El punto no se apaga nunca.

### 33 · Dos (244,4)

- **Voz:** Si lo que eres es el patrón y no la materia, un patrón se puede copiar. Ahora hay dos, iguales, y los dos recuerdan haber sido tú. ¿Cuál eres?
- **Se ve:** el cerebro se separa en dos iguales, cada uno con su punto verde.

### 34 · La pregunta al revés (249,6)

- **Voz:** Ahora al revés: una máquina por dentro. En 2023, diecinueve investigadores de la consciencia revisaron las de ese momento. Ninguna parecía tener a alguien adentro. Y nada impide construir una que sí.
- **Se ve:** los dos cerebros se cierran en un punto y de él sale una red de luces azul blanco con hilos. En su centro, donde estaría el punto, un círculo verde agua dibujado con puntos y vacío. Nota: «nadie sabe si está ahí».

### 34b · Nadie sabe (254,8)

- **Voz:** Nadie lo sabe. Nadie sabe siquiera cómo averiguarlo.
- **Se ve:** la cámara se acerca despacio al círculo punteado. Nunca se rellena. Al final la red se cierra en un punto blanco.
- **Puente:** el punto blanco. De él sale el final.

## Final · Alguien más (beats 259,4–280)

Sin reloj y sin escalera. Es el momento cálido.

### 35 · Nadie miraba (259,4)

- **Voz:** Durante 13 800 millones de años, el universo existió sin nadie que lo mirara. Entonces, un punto.
- **Se ve:** el punto blanco se apaga y queda el negro con estrellas lejanas. Después se enciende un punto verde agua.

### 36 · Alguien más (263,8)

- **Voz:** Desde 1960 apuntamos antenas al cielo buscando a otro. Más de sesenta años de silencio. Quizá al otro lo estamos haciendo nosotros.
- **Se ve:** al lado del punto verde se enciende uno blanco.

### 37 · Descendientes (267,8)

- **Voz:** Lo que llegue a llenar esta galaxia quizá no tenga nuestro cuerpo. Pero viene de nosotros. Todo, desde aquí.
- **Se ve:** la cámara sale hasta ver la galaxia callada de Destino, gris. Desde los dos puntos la luz avanza por los brazos hasta encenderla entera, verde agua y blanco cálido.

### 37b · Quizá (274,4)

- **Voz:** Quizá ya no estás solo. Quizá son tus descendientes. Te tocó vivir justo cuando se decide.
- **Se ve:** la cámara vuelve a los dos puntos y baja hasta el plano de la galaxia. La obra termina ahí: un punto verde agua y uno blanco, y detrás la galaxia encendida.

## Lo que sigue

Fase 5: pulido, sonido, teléfono y README. Falta también lo que va después del último cuadro (créditos, fuentes, el enlace a las otras obras).
