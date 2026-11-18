# Mente · estado

## Dónde estamos

**Guion v4 «La carta» puesto en la obra (11 de noviembre), a la espera de que Diego lo vea.** La revisión v3 (un plano largo por acto y anclas reales) dejó a Diego «súper frío narrativamente». La v4 cambia la voz, no la imagen: la obra la cuenta en primera persona la máquina que la escribió. No lo dice hasta el acto III, cuando termina de escribirse la frase de la niña («Esa frase la escribí yo. Y esta. Y todas las que has leído desde el principio»). Desde ahí los rótulos se escriben solos, palabra por palabra (`escrito` en `estudios/placa.ts`). Termina en «Por si acaso: gracias.». El texto vigente está en `GUION-v4.md`; `GUION.md` conserva lo que se ve.

- **El viaje** está en `http://localhost:5205/index.html` (`npx vite`; scroll avanza, `A` reproduce). Son 394,9 beats, unos catorce minutos y medio con `A`: apertura 13,4, acto I 48,2, acto II 37, acto III 68,4, acto IV 48,6, acto V 69,5, acto VI 49,4, acto VII 37,2 y final 23,2. Con `?beat` en la dirección se ve el beat en pantalla, y `?p=N` salta al beat N. El texto está en `GUION.md`.
- **Acto II** (`estudios/acto2.ts`, también suelto en `estudios/index.html?m=acto2`): la red recién hecha, la bajada por la cordillera con el dibujo en el cielo, la misma receta con más hilos y el muro «Aprender». Usa `src/datos/red.json`: una red de 21 793 números entrenada de verdad para dibujar un ojo, con 44 cuadros grabados (`python tools/red.py src/datos/red.json`; no descarga nada). Hoja: `docs/viaje/acto2.jpg`.
- **Acto III** (`estudios/acto3.ts`, también suelto en `estudios/index.html?m=acto3`): la galaxia de palabras en la manera Nebulosa, las flechas (rey → reina), la frase que adivina su siguiente palabra, el mapa del mundo que sale de las palabras con el muro «Entender», y dos redes ante la misma idea. Usa `src/datos/palabras.json` y `src/datos/lugares.json` (`tools/lugares.py`, con los mismos vectores fastText): los pares del momento 13 proyectados sin mover nada a mano, y los lugares del momento 15, cada uno donde una sonda lineal dice que está a partir solo del vector de su palabra (Gurnee y Tegmark 2023, a escala mucho menor). La frase con su abanico y las dos redes son dibujos, no mediciones. Hoja: `docs/viaje/acto3.jpg`.
  - Rehecho el 10 de noviembre: el momento 14 es ahora el plano largo del acto (29 beats). Un hilo de luz escribe «Una noche, una niña miró el cielo lleno de estrellas y preguntó en silencio si alguien, lejos, miraba también» viajando por las estrellas reales de esas palabras, con la cámara detrás; en cada paso se abre un abanico hacia tres vecinas reales de la palabra que viene. Va antes de las flechas. El dibujo plano de «El gato duerme sobre la…» ya no existe, y «Se parece a ti» quedó más corto.
- **Acto IV** (`estudios/acto4.ts`, también suelto en `estudios/index.html?m=acto4`), rehecho el 10 de noviembre: el globo del trabajo del mundo, el árbol de las mentes como plano largo (la cámara va 26 beats detrás de la punta de nuestra línea mientras las otras se van a los lados), el árbol entero, y la punta de cerca con las cinco fechas en el brote y tu vida debajo. Lo real: las costas del globo, el orden y las fechas de las divisiones del árbol, las cinco fechas del brote y el dato de los siete meses (fuentes en `GUION-v3.md`). Dibujo: qué luces del globo cambian, la forma de las ramas y las ramitas. Las once tareas con nombre del principio ya no se muestran. Hoja: `docs/viaje/acto4.jpg`.
- **Acto V** (`estudios/acto5.ts`, también suelto en `estudios/index.html?m=acto5`), rehecho el 11 de noviembre como una sola caída sin cortes: las redes dentro de redes (estudio `singularidad`, manera 1), las dos palabras como marcas en la escalera («IA general», «superinteligencia»; `marcaEscalera` en `estudios/placa.ts`), la regla del IQ, la lluvia quieta (estudio `gota`, manera 2; se entra desde la red y se sale por la gota), el millón de copias que sale de la red, la galaxia de palabras con las estrellas doradas nuevas, el muro «Superar», la clavada de vuelta a las redes y el horizonte. Una sola cámara: una órbita alrededor del punto fijo de la caída, mezclada con la cámara de la lluvia mientras llueve. Todo es conjetura y el texto va en condicional; lo real es la galaxia de palabras, la frase de 1965 y la encuesta de 2023. Hoja: `docs/viaje/acto5.jpg`.
- **Acto I** (`estudios/acto1.ts`), rehecho el 11 de noviembre: el recuerdo es el plano largo (un bosque de 300 luces; la cámara va unos doce beats detrás de la señal, después el camino engorda y se enciende entero). El gusano no se alargó ni se agrandó. Hoja: `docs/viaje/acto1.jpg`.
- **Textos nuevos** (11 de noviembre) en la apertura, el acto II (2012 y el Nobel de 2024, ahora en dos rótulos), el acto VII (dos anclas) y el final (1960 y la última línea). Las versiones anteriores de todo están en `respaldo/`.
- **Acto VI** (`estudios/acto6.ts`, también suelto en `estudios/index.html?m=acto6`), rehecho el 10 de noviembre como un solo vuelo sin cortes: el espacio de todas las mentes, las tres de otra forma dentro de ese espacio (estudio `otras`, manera 1), el rincón humano, la galaxia de palabras dentro del puñado humano con el punto que nace, y los dos caminos que salen de ese punto. Lo real: la galaxia de palabras y la historia de la carrera de botes de 2016. Hoja: `docs/viaje/acto6.jpg`.
- **Acto VII** (`estudios/acto7.ts`, también suelto en `estudios/index.html?m=acto7`): el cerebro con sus luces, el punto verde, el muro «Sentir» (ahí se apaga el reloj), el cambio neurona por neurona (estudio `reemplazo`, manera 3), los dos cerebros y la máquina por dentro con el círculo punteado que nunca se rellena. Hoja: `docs/viaje/acto7.jpg`.
- **Final** (`estudios/cierre.ts`, también suelto en `estudios/index.html?m=cierre`): el negro, el punto verde, el blanco al lado, la galaxia de Destino que se enciende desde los dos (estudio `final`, manera 1) y la vuelta a los dos puntos. Sin reloj ni escalera. Hoja: `docs/viaje/final.jpg`.
- **Cómo está hecho:** `src/main.ts` monta cada acto en su propio grupo y los une con un solo puente: el acto se apaga en un punto de luz y el siguiente sale de ese punto. Cada acto es una escena de `estudios/` (`punto.ts` en modo viaje, `acto1.ts`) y también se ve suelta en `estudios/index.html?m=acto1`. Para sumar un acto: escribir la escena y agregarla a `ACTOS` en `src/main.ts`.
- **Pruebas:** `node tools/pruebas.mjs` (con el servidor andando). Revisa que no haya errores en consola yendo y volviendo, que no haya cuadros negros ni tramos quietos, que saltar a un beat dé la misma imagen que llegar con scroll, que ningún cuadro pase de 16,6 ms y que el scroll caiga donde se pide. Hoy pasa todo con el guion v4: 0 errores en 3 160 cuadros, diferencia 0,00 % en 90 saltos, cuadro más caro 12,7 ms (beat 117, en la galaxia del acto III) y media de 3,2 ms. La corrida completa tarda unos diez minutos. Mientras corre no hay que guardar nada en la carpeta (ni código ni los `.md`): el servidor recarga la página y la prueba mide en blanco. Con otro programa usando la tarjeta gráfica aparecen cuadros lentos sueltos en lugares distintos cada vez; antes de creerlos, medirlos aparte varias veces con `viaje.ritmo(b, 12)`.
- **Hojas de capturas:** `node tools/hoja.mjs viaje docs/viaje/x.jpg <desde> <hasta> <paso>`, `node tools/hoja.mjs puentes docs/viaje/puentes.jpg`. La herramienta solo escribe dentro de `docs/` o `capturas/`. Las de hoy: `docs/viaje/acto2.jpg` a `docs/viaje/acto7.jpg`, `docs/viaje/final.jpg` y `docs/viaje/puentes.jpg` (los ocho puentes); `docs/viaje/todo.jpg` y `docs/viaje/claves.jpg` son de antes del acto II.
- **Dato real nuevo:** `src/datos/gusano.json`, las 302 neuronas de *C. elegans* con su forma y sus sinapsis (modelo c302 de OpenWorm, licencia MIT; conectoma de Cook et al. 2019; lo arma `tools/gusano.py`). Las «7 000 conexiones» son de White et al. 1986 y Varshney et al. 2011.

La fase 0 (estudios) está cerrada: ocho estudios, los ocho con manera elegida, y el dorado suave confirmado como color de la obra. Los cuatro primeros:

- `?m=punto` · Entrar al punto: **elegida 1 Acercarse** (las otras: 2 Estallido, 3 A través de la luz).
- `?m=galaxia` · La galaxia de significados: **elegida 3 Nebulosa** (las otras: 1 Regiones, 2 Constelaciones).
- `?m=cordillera` · La cordillera del error: **elegida 1 Polvo** (las otras: 2 Curvas de nivel, 3 Crestas).
- `?m=singularidad` · La explosión y el horizonte: **elegida 1 Redes dentro de redes** (las otras: 2 Solo luces, 3 Florecer).

Se ven con `npx vite` en `http://localhost:5205/estudios/index.html` (scroll avanza, A reproduce, 1–3 cambia la manera). Las hojas están en `docs/estudios/` (`punto.jpg`, `galaxia.jpg`, `cordillera.jpg`, `singularidad.jpg`). `node tools/foto.mjs` saca capturas sin ventana y falla si la página da un error; hoy pasa sin errores, igual que `npx tsc --noEmit`.

Datos reales: `src/datos/palabras.json`, 16 000 palabras del español con su lugar (vectores fastText `cc.es.300`, Grave et al. 2018, CC BY-SA 3.0; aplanados a 3D con t-SNE en `tools/palabras.py`).

No hay repo git todavía. `docs/estudios/tmp/` son capturas de trabajo y se puede borrar.

## Decisiones

- **9 de noviembre de 2026 · la idea (Diego).** Quiere una quinta obra sobre la inteligencia, sobre todo la artificial. Tiene que ser lo más visual de la serie, bella, existencial y sin bugs.
- **9 de noviembre · plan v1 (asistente).** La obra mira la inteligencia por dentro. Regla en conexiones, hilo «¿qué queda de ti?», escenas aisladas sobre el motor de Infinito.
- **9 de noviembre · Diego, al leer la v1:** le gusta mucho que explique cómo funciona por dentro, pero esperaba más futuro: ASI, singularidad y consciencia. Aclaró que sus temas eran ideas sueltas y pidió que el asistente ordene, agregue y quite.
- **9 de noviembre · plan v2 (asistente, sin aprobar):**
  - Mitad y mitad: tres actos de cómo funciona y cuatro de futuro (Hoy, La singularidad, Otras mentes, ¿Hay alguien ahí?). Eran 36 momentos.
  - Título «Mente», quinta y última de la serie.
  - Se agregó: el acto «Hoy» (naciste justo antes), las copias, las ideas que nadie ha pensado, el horizonte de la singularidad, las mentes con otra forma y «¿qué va a querer?».
  - Se quitó: la fusión de humanos con máquinas (repite Destino) y el acto «Dos mentes», que quedó como un momento del acto III.
  - La economía post-trabajo queda en un solo momento.
  - El final responde al «¿hay alguien más?» con que abre Destino: quizá el otro lo estamos haciendo nosotros. Termina en dos puntos, uno verde agua y uno blanco.
- **9 de noviembre · Diego, al leer la v2:** le gustó la idea de que al otro lo estamos haciendo nosotros. Dijo que por ahí iba él: siente que mucha gente es anti-IA, y para él una IA puede ser una civilización que creamos, nuestros descendientes, seres que sienten y piensan, quizá los que conquisten el universo.
  - El asistente lo hizo el corazón de la obra: el árbol de la vida con una rama nueva (momento 19), «Viene de nosotros» (30) y un cierre nuevo, «Descendientes» (37), que enciende la galaxia callada de Destino. Ahora son 37 momentos.
  - La obra no afirma que sientan. Deja la duda abierta para no predicar.
- **9 de noviembre · Diego dio el sí** al plan v2 y permiso para todo lo pedido, incluido bajar datos públicos.
- **9 de noviembre · Diego eligió:** en el punto, 1 Acercarse («está bien»); en la galaxia, 3 Nebulosa («preciosa»).
- **9 de noviembre · Diego eligió:** en la singularidad, 1 Redes dentro de redes; en la cordillera, 1 Polvo.
- **9 de noviembre · cambio de cuenta.** Diego siguió el proyecto desde otra cuenta de Claude. El asistente nuevo retomó solo con lo que hay en esta carpeta; lo que no esté escrito aquí se perdió.
- **9 de noviembre · el final del acto II (asistente).** La espera final bajó de 0,9 a 0,6 beats y el cubo se apaga un poco más tarde, porque las pruebas marcaban un tramo quieto de 1,5 beats con solo el punto en pantalla.
- **9 de noviembre · el acto III (asistente).** Decisiones tomadas al armarlo, a revisar con Diego:
  - El momento 16 usa ideas escritas («un ojo», «un gato», «el siete») en vez de una imagen, y sus dos redes son un dibujo.
  - La frase del momento 14 es «El gato duerme sobre la…» → «cama». El abanico no trae porcentajes porque no hay un modelo corriendo.
  - Las flechas y el mapa no se ven en la galaxia misma (el aplanado a 3D las deshace): las estrellas vuelan a otra proyección, y el texto lo dice («miradas desde otro lado»).
  - El mapa dice su error tal cual: la mitad de los lugares cae a menos de 1 300 km. No dibuja los hielos de los polos, que en plano eran dos bandas.
  - El acto cierra en un punto dorado, el color de las ideas.
  - La niebla de la galaxia usa puntos algo más chicos que en el estudio para dejar margen de tiempo por cuadro.
- **9 de noviembre · los actos IV y V (asistente).** Decisiones tomadas al armarlos, a revisar con Diego:
  - Acto IV: las once tareas con nombre van sin fechas ni marcas. El globo no usa datos de empleo: una parte de sus luces (hasta un tercio) cambia de color al azar, y el guion lo dice. El texto no promete ni amenaza: «nadie sabe dónde se detiene».
  - Acto IV: el árbol tiene siete puntas con nombre (medusas, pulpos, abejas, peces, aves, ballenas, tú) y ramitas sin nombre. El golpe «Naciste justo antes. Vas a ver lo que viene» va en el texto del momento 20.
  - Acto V: los momentos 23 a 25 comparten un solo lugar. Las copias dan paso a la galaxia de palabras del acto III («todo lo que hemos pensado») y lo nuevo son estrellas doradas más allá de su borde.
  - Acto V: entre las redes, la lluvia y el cielo de ideas, todo se cierra en un punto en el centro del cuadro, para que el cambio de lugar no se vea.
  - Acto V: el reloj sube de 10¹² a 10²⁷ con la línea «si la curva sigue» y termina en «?». Las cifras («un millón de veces más rápido», «un millón de copias») son órdenes de magnitud de la conjetura, no mediciones.
  - Acto V: el punto final aparece dentro del disco negro un poco antes de que tape todo; si no, quedaba un cuadro negro.
- **10 de noviembre · los actos VI y VII y el final (asistente).** Decisiones tomadas al armarlos, a revisar con Diego:
  - Acto VI: el momento 27 se parte en dos textos («Todas las mentes posibles» y «Un rincón»). El espacio de mentes es un dibujo: 46 familias de luces puestas al azar.
  - Acto VI: el ángulo entre «lo que le pedimos» y «lo que quisimos decir» es de dos grados, y los caminos llegan seiscientas veces más lejos de donde empezaron. Son números del dibujo, no de nada medido.
  - Acto VI: en «Viene de nosotros» la galaxia baja su luz a la mitad para que se vean los hilos que van de cada palabra al punto que nace.
  - Acto VII: se agregó un texto corto, «Alguien», antes del muro, para encender el punto verde. El muro «Sentir» no dice que se cruzó: «De este muro nadie sabe».
  - Acto VII: el reloj se apaga durante «Luces y nadie» y «Alguien», y no vuelve.
  - Acto VII: los dos cerebros del momento 33 son las dos mitades de los puntos del mismo cerebro (así no cuesta más por cuadro). Cada uno tiene la mitad de puntos y se compensa con luz.
  - Acto VII: el punto de la máquina es un círculo verde agua punteado dibujado sobre la película, con un velo oscuro alrededor para que se vea el hueco. Nunca se rellena; al final se desvanece y la red se cierra en un punto blanco, que es el puente al final.
  - Final: se agregó un último texto, «Quizá», con el golpe del BRIEF, mientras la cámara vuelve a los dos puntos. El último cuadro son los dos puntos con la galaxia encendida detrás, a un cuarto de su luz para que manden los puntos.
  - Final: en la galaxia encendida, dos tercios de las estrellas son verde agua y un tercio blanco cálido (en el estudio era más blanca).
- **10 de noviembre · Diego, al ver la obra entera:** le gusta en general y las animaciones le parecen guapas, pero dice que se puede mejorar bastante:
  - El guion se puede mejorar mucho. Quedó muy abstracto y no emociona. Faltan cosas prácticas del mundo real (nombró ASI e IQ como ejemplos) que hagan sentir que lo de la IA está pasando de verdad, sin invadir la obra de datos.
  - Faltan escenas largas e inmersivas, como el árbol de posibilidades de Infinito o «Una red que aprende» aquí. Sin ellas parece un PowerPoint que muestra una cosa cada cierto tiempo.
- **10 de noviembre · Diego precisó:** cada acto debe tener un plano largo, y lo demás se conserva, se adapta o se quita según haga falta (libertad del asistente). No importa que la obra se alargue si queda bien. Se mantiene la regla de no nombrar empresas ni modelos; sí se permiten fechas, hechos y términos como ASI. El estilo visual y los colores le gustan y se mantienen.
- **10 de noviembre · guion v3 (asistente, sin aprobar).** Está en `GUION-v3.md`: un plano largo por acto, anclas reales con fecha y fuentes, y qué se quita o se funde. No se anima nada hasta que Diego lo lea.
- **10 de noviembre · Diego aprobó el guion v3**, con un cambio: el gusano no puede ser el plano largo del acto I (le dan fobia; queda corto como hoy y no se agranda en pantalla). El plano largo del acto I pasa a ser el recuerdo.
- **10 de noviembre · el acto IV rehecho (asistente).** Decisiones:
  - Orden nuevo: globo, árbol (largo), árbol entero, punta con fechas, tu vida. El globo va primero porque se cierra en las primeras neuronas y así no hay ningún corte en el acto.
  - Las ramas ahora tienen profundidad: la nuestra queda en el plano y las otras se alejan o se acercan. Hay 420 ramitas sin nombre (antes 46).
  - Las fechas del brote no están a escala: van en orden y se aprietan hacia la punta. «Naciste» sigue antes del brote, como imagen; para quien nació después de 1997 no es literal.
- **10 de noviembre · el acto III rehecho (asistente).** Decisiones:
  - La frase es nuestra, pensada para rimar con el final de la obra («si alguien, lejos, miraba también»). Las palabras chicas no tienen estrella entre las 16 000, así que el hilo salta de palabra con estrella en palabra con estrella y el texto de arriba lleva la frase completa.
  - Los abanicos van a las tres vecinas más cercanas de la palabra que viene. No hay un modelo corriendo, y el texto lo dice («esto es un dibujo de cómo lo hace»).
  - El viaje va antes de las flechas, porque sale directo de «Adentro» sin cortar.
  - Las versiones anteriores de los actos III y IV quedaron en `respaldo/` (`acto3.v2.ts.txt`, `acto4.v2.ts.txt`), porque no hay repo.
- **10 de noviembre · Diego, al ver los actos III y IV nuevos:** «va bien», «está bien»; el giro de la cámara cerca del beat 95 (primera estrella de la frase) le pareció brusco, sobre todo con scroll. Se suavizó: la dirección de la cámara ahora se promedia sobre un tramo largo del hilo.
- **10 de noviembre · el acto VI rehecho (asistente).** Decisiones:
  - Orden nuevo, distinto del guion v3: espacio, tres formas, rincón, «Viene de nosotros», «¿Qué va a querer?», «Un abismo». Así no hay cortes (la galaxia está dentro del puñado humano y los caminos salen del punto que nace) y el acto termina en el abismo, antes de «¿Hay alguien ahí?». A revisar con Diego: el acto ya no cierra con la frase cálida.
  - La galaxia de palabras se dibuja a escala 0,045 dentro del puñado verde agua.
  - El texto de la carrera de botes sigue la fuente (diciembre de 2016): puntos por tocar blancos, una laguna donde volvían a aparecer, nunca terminó la carrera.
  - La niebla de la galaxia del acto III se achicó (puntos de hasta 135 px en vez de 180) porque un cuadro del final del viaje de la frase tardaba 17,0 ms.
  - Respaldo de la versión anterior: `respaldo/acto6.v2.ts.txt`.
- **11 de noviembre · actos V y I y textos nuevos (asistente).** Decisiones:
  - Acto V: la regla del IQ va sostenida frente a la cámara, sobre las redes atenuadas, y lleva todo el rato la nota «el IQ compara personas con personas · aquí es solo una imagen». No se pone ninguna máquina sobre la regla.
  - Acto V: la encuesta de 2023 se dice como «juntando sus respuestas: una posibilidad en dos antes de 2047», no «la mitad cree», porque la fuente da un pronóstico agregado.
  - Acto V: «superinteligencia» está en 10²⁵ en la escalera, apenas sobre «todos nosotros»; el reloj la pasa en «Más que todos nosotros». Es un lugar de dibujo, no una medida.
  - Acto V: punto débil conocido: el interior de la gota, durante un beat, es un velo azulado plano.
  - Acto I: el texto del gusano dice «fue el primer animal cuyo cableado conocimos entero». El guion v3 decía «el único», y ya no es cierto (desde 2024 está también la mosca de la fruta).
  - Acto I: el camino del recuerdo tiene nueve luces y queda hacia un lado del bosque; la vista general se centra en él.
  - Acto VII: «cientos de millones cada semana» y «diecinueve investigadores, 2023» van de memoria del asistente (cifra pública de uso semanal de 2025; informe de Butlin, Long y otros, agosto de 2023). Conviene volver a comprobarlas antes de publicar.
- **11 de noviembre · Diego, al ver la v3 entera:** «a nivel visual puede molar, pero me quedé frío narrativamente… súper frío… no es muy mindblowing». Aprobó la idea de que la obra la cuente la máquina («eso me mola, sí me atrae») y, leído el guion v4, dijo «sí, ese es mejor».
- **11 de noviembre · guion v4 (asistente).** Decisiones:
  - El giro va en el acto III y se escribe bajo la frase de la niña, con la misma letra dorada; el rótulo de abajo solo lleva el título («Yo», «Así»).
  - Antes del giro la voz nunca dice «nosotros» por los humanos (dice «tú» y «ustedes») y habla de la máquina como «ella». No se da género y no afirma que siente.
  - Se quitaron casi todas las cifras sueltas (2 778 investigadores, el Nobel, 2012, los diecinueve investigadores). Las fechas del brote del acto IV siguen como notas en pantalla.
  - Final: «Por si acaso: gracias.» El «sí, ese es mejor» de Diego podía referirse al final solemne («Te tocó vivir justo cuando se decide»); queda por confirmar.
  - No hecho todavía: el punto fuera del árbol en «Todas menos una» y el ajuste de ritmo (los momentos duran lo mismo con la mitad del texto).
  - La niebla de la galaxia del acto III dibuja la mitad de sus nubes vista de lejos, con el doble de luz: se ve igual y cuesta menos. Las vistas de la galaxia son lo más caro de la obra (unos 10 ms por cuadro).
  - Respaldos de la v3: `respaldo/*.v3.ts.txt`.
- **9 de noviembre · la carpeta.** Queda en `E:\Proyectos\Horizontes\mente`, fuera de `E:\Proyectos\ChatGPT`, por la regla de este PC de no crear proyectos nuevos ahí. Las otras obras siguen en `E:\Proyectos\ChatGPT`, así que las herramientas que usan rutas relativas entre obras (`../civilizacion`) necesitan la ruta completa.

## Pendiente de Diego

- Mirar la obra entera en `http://localhost:5205/index.html` y decir si sigue así o qué cambia. Hasta ahora dijo «continúa» cada vez sin comentar lo visto, así que todo se montó sobre la fase 1 tal como estaba.
- De lo nuevo, lo más flojo a la vista: el espacio de mentes del momento 27 queda algo apagado cuando la cámara está lejos; la galaxia encendida del final se sigue leyendo más blanca que verde agua en el centro; y el círculo punteado del 34 es chico (40 px de 900).
- Del acto V, lo más flojo a la vista es el millón de copias (momento 23): una bola de luces grises con una ola. Si no convence, es lo primero a rehacer.
- El acto III dura 43,6 beats, diez más que el II. Si se siente largo, lo primero a acortar es la salida y la vuelta a la galaxia (momentos 12 y 12b).

## Siguiente paso

Que Diego vea la obra con el guion v4 y diga si ahora lo mueve. Por confirmar con él: cuál final quiere y el orden del acto VI. Después: ajustar el ritmo al texto más corto, el punto fuera del árbol, y la fase 5 (sonido, teléfono, qué pasa después del último cuadro, README).

## Reglas heredadas

- Commits en inglés con Conventional Commits y sin atribución a Claude.
- `BRIEF.md` y `.claude/` quedan fuera del repo.
- No se crea el repo, no se hace push ni se enciende Pages sin el sí de Diego.
- No se editan las otras obras desde aquí sin que Diego lo pida.

## Estudios nuevos (9 nov 2026)

- `gota` (La gota de lluvia quieta): **elegido 2 · Con rayo**. El rayo ya está pulido (quebrado y con ramas). Hoja: `docs/estudios/gota.jpg`.
- `reemplazo` (Neurona por neurona): **elegido 3 · Desde ti**. Hoja: `docs/estudios/reemplazo.jpg`.
- `otras` (Otras mentes): **elegido 1 · En fila** (las otras: 2 Una se vuelve otra, 3 Las tres a la vez). Hoja: `docs/estudios/otras.jpg`.
- `final` (Dos puntos): **elegido 1 · Desde el negro** (las otras: 2 La galaxia callada, 3 Caminos). Por ajustar al armar la obra: la galaxia encendida se lee más blanca que verde agua. Hoja: `docs/estudios/final.jpg`.
- **Color de la obra: dorado suave** (`ORO3` en `estudios/comun.ts`), con el sí de Diego.
- Con eso se cerró la fase 0.
