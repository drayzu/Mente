import type { Plan } from '../horizontes/sonido/motor';
import type { Config, Escena, Lluvia } from '../horizontes/sonido/director';
import { crearSonido as crear } from '../horizontes/sonido/obra';
import { hz } from '../horizontes/sonido/notas';

/**
 * Mente's score, played on the series' engine (horizontes-sonido: made in the browser, no files;
 * ambient, never music; everything in D). Off until asked for.
 *
 * What is heard is what is seen:
 *
 * - **A brain is warm and it crackles.** Neurons are small sparks and soft drops; a signal going from
 *   one to the next is a quick run of notes; a memory is the same run again, fuller each time. Under
 *   it, strings. Where you are named, your own sound (the series' breathing glass). No heartbeat: the
 *   series keeps that for Vida.
 * - **A machine is glass.** Pure held tones, nothing that breathes. It starts as static and random
 *   notes (numbers put there at random) and the noise thins out as it learns, until a chord is left.
 * - **Words are single notes,** set down one at a time. While the sentence about the girl and the
 *   stars writes itself, there is a field at night around it (crickets). At «Yo» all of it stops.
 * - **Places:** the sea where thinking began; the rain that stops for a mind that is too fast (and
 *   then a real silence); the antennas' static in the ending; a rumble at the horizon and the abyss.
 * - **You and I:** your sound is A and D. When the machine says it comes from you, or that there
 *   may be two points now, its glass takes those same two notes.
 *
 * One scene per moment, named `<act>:<the moment's name>`. The third number of a layer is its
 * low-pass (Hz).
 */

const PLAN: Plan = {
  sostenidos: {
    calido: [hz('D3'), hz('A3')],
    cuerdas: [hz('D3'), hz('A3')],
    vidrio: [hz('D4'), hz('A4'), hz('D5')],
    brillo: [hz('A5')],
  },
  texturas: ['aire', 'radio', 'enjambre', 'lluvia', 'grillos', 'mar', 'burbujas', 'rafaga', 'rumor'],
  golpes: {
    'piano-suave': ['D4', 'F#4', 'A4', 'B4', 'D5', 'E5', 'F#5'].map(hz),
    vibrafono: ['A5', 'D6', 'E6'].map(hz),
    gota: ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6'].map(hz),
    chispa: [hz('A5'), hz('D6')],
    cristal: [hz('A5'), hz('D6')],
    destello: [hz('D5')],
  },
};

const CFG: Config = {
  plan: PLAN,
  capas: {
    calido: { instr: 'calido', base: 0.5, seco: 0.5, envio: 0.6, deriva: 0.2 },
    cuerdas: { instr: 'cuerdas', base: 0.42, seco: 0.45, envio: 0.7, deriva: 0.25 },
    // the machine: glass, held still
    vidrio: { instr: 'vidrio', base: 0.3, seco: 0.4, envio: 0.7, deriva: 0.12 },
    brillo: { instr: 'brillo', base: 0.2, seco: 0.3, envio: 0.8, deriva: 0.3 },
    radio: { instr: 'radio', base: 0.22, seco: 0.7, envio: 0.3, transpone: false, deriva: 0.5, ritmo: 0.12 },
    enjambre: { instr: 'enjambre', base: 0.3, seco: 0.4, envio: 0.7, transpone: false },
    lluvia: { instr: 'lluvia', base: 0.5, seco: 0.85, envio: 0.2, transpone: false, deriva: 0.1 },
    grillos: { instr: 'grillos', base: 0.16, seco: 0.6, envio: 0.5, transpone: false, deriva: 0.1 },
    mar: { instr: 'mar', base: 0.45, seco: 0.7, envio: 0.35, transpone: false, deriva: 0.1 },
    burbujas: { instr: 'burbujas', base: 0.3, seco: 0.6, envio: 0.5, transpone: false, deriva: 0.2 },
    viento: { instr: 'rafaga', base: 0.4, seco: 0.75, envio: 0.3, transpone: false, deriva: 0.1 },
    rumor: { instr: 'rumor', base: 0.5, seco: 0.8, envio: 0.3, transpone: false, deriva: 0.3 },
  },
  campana: { instr: 'piano-suave', nivel: 0.18, envio: 0.75, seco: 0.45 },
  tu: { instr: 'vidrio', notas: 'A4 D5', nivel: 0.2 },
  aire: { nivel: 0.09, desde: 250, hasta: 1600 },
};

/** Neurons firing: sparks, `ritmo` a second. */
const chispas = (ritmo: number, nivel = 0.05): Lluvia => ({ instr: 'chispa', notas: 'A5 D6 F#6', ritmo, nivel, envio: 0.6 });
/** Signals: soft drops on the notes given. */
const gotas = (notas: string, ritmo: number, nivel = 0.05, arpegio = false): Lluvia => ({ instr: 'gota', notas, ritmo, nivel, arpegio });
/** Words, memories: single soft piano notes, one every long while. */
const piano = (notas: string, ritmo: number, nivel = 0.15): Lluvia => ({ instr: 'piano-suave', notas, ritmo, nivel });
const vibra = (notas: string, ritmo: number, nivel = 0.045, arpegio = false): Lluvia => ({ instr: 'vibrafono', notas, ritmo, nivel, arpegio });
const cristal = (notas: string, ritmo: number, nivel = 0.035): Lluvia => ({ instr: 'cristal', notas, ritmo, nivel });
const ESCENAS: Record<string, Escena> = {
  // ---- Opening · the one who looks: you, then inside you
  'punto:Tú': { tu: true, fundido: 3 },
  'punto:Adentro': { capas: { calido: ['D3 A3', 0.3, 900] }, tu: true, lluvia: chispas(2, 0.035), fundido: 5 },
  'punto:Un bosque': { capas: { calido: ['D3 A3 E4', 0.45, 1600], vidrio: ['A4', 0.2] }, lluvia: [chispas(6), gotas('D5 A5 E5 F#5', 1.2)], campana: 'A4', fundido: 5 },

  // ---- I · matter that thinks: warm, and it crackles
  'acto1:Una neurona': { capas: { calido: ['D3 A3', 0.3, 1200] }, lluvia: [gotas('A5', 0.7, 0.06), chispas(0.5, 0.04)], fundido: 3 },
  'acto1:Trescientas dos': { capas: { calido: ['G3 D4 B4', 0.35, 1800] }, lluvia: [vibra('D5 E5 A5 B5', 1.2), chispas(2, 0.035)], campana: 'B4' },
  // a memory: the same run of notes, a little fuller each time it is walked
  'acto1:Un recuerdo': { capas: { calido: ['D3 A3 F#4', 0.4, 1800] }, lluvia: [gotas('D5 F#5 A5 D6', 0.45, 0.07, true), chispas(1.5, 0.03)], campana: 'F#4' },
  'acto1:De neurona en neurona': { capas: { calido: ['D3 A3 F#4', 0.4, 2000] }, lluvia: [gotas('D5 F#5 A5 D6', 0.8, 0.07, true), chispas(4, 0.04)] },
  'acto1:El camino engorda': { capas: { calido: ['D3 A3 F#4', 0.45, 2400], cuerdas: ['D3 A3 F#4', 0.35, 2000] }, lluvia: [gotas('D5 F#5 A5 D6', 1.1, 0.08, true), piano('A4 D5 F#5', 0.45)], campana: 'D5' },
  // «también el de quien ya no está»
  'acto1:Siempre juntas': { capas: { cuerdas: ['B2 F#3 D4', 0.5, 2200], calido: ['B2 F#3', 0.3, 1400] }, lluvia: [piano('F#4 B4 D5', 0.35), gotas('B4 D5 F#5 B5', 0.5, 0.06, true)], campana: 'D5', fundido: 5 },
  // all of them at once
  'acto1:Nadie al mando': { capas: { calido: ['D3 A3 E4 F#4', 0.55, 3000], cuerdas: ['D3 A3', 0.3], brillo: ['A5 E6', 0.25] }, lluvia: [chispas(14, 0.055), gotas('D5 E5 F#5 A5 B5 D6', 5, 0.045)], campana: 'A4', fundido: 3 },
  'acto1:Un punto': { capas: { calido: ['D3 A3', 0.2, 900] }, tu: true, fundido: 2.5 },

  // ---- II · a machine that learns: static and random notes, thinning out into a chord
  'acto2:Números al azar': { capas: { radio: ['', 0.5, 2200], vidrio: ['D4', 0.18] }, lluvia: gotas('C5 F#5 A5 E6 D5 B4 G5', 3, 0.035), fundido: 3 },
  // high up on the landscape of error: wind
  'acto2:El error': { capas: { viento: ['', 0.45, 1300], radio: ['', 0.25, 2000], vidrio: ['D4 A4', 0.22], calido: ['D3', 0.2, 1200] }, lluvia: gotas('C5 F#5 A5 E6 D5 B4', 1.2, 0.03) },
  // one step down, and another
  'acto2:Bajar': { capas: { viento: ['', 0.3, 1200], radio: ['', 0.14, 1800], calido: ['D3 A3', 0.3, 1400] }, lluvia: { instr: 'piano-suave', notas: 'A5 F#5 E5 D5', ritmo: 0.4, nivel: 0.11, arpegio: true } },
  'acto2:Del ruido a la forma': { capas: { radio: ['', 0.07, 1600], vidrio: ['D4 A4 F#5', 0.3], calido: ['D3 A3', 0.35, 1800] }, lluvia: gotas('D5 A5 F#5 E5', 3, 0.045), campana: 'A4' },
  // it draws an eye
  'acto2:Nadie le dijo cómo': { capas: { vidrio: ['D4 A4 F#5', 0.42], calido: ['D3 A3 F#4', 0.45, 2400] }, llegada: { instr: 'destello', nota: 'D5', nivel: 0.2, envio: 0.8 }, fundido: 3 },
  'acto2:La misma receta': { capas: { vidrio: ['D5', 0.25], calido: ['G3 D4 B4', 0.4, 2200] }, lluvia: gotas('D5 G5 B5', 2, 0.04), campana: 'B4' },
  // more threads: a thousand million, a million million
  'acto2:Más hilos': { capas: { enjambre: ['', 0.5], brillo: ['A5 E6', 0.3], vidrio: ['D4 A4 E5', 0.3], calido: ['D3 A3 E4 F#4', 0.5, 3000] }, lluvia: gotas('D5 E5 F#5 A5 B5 D6 E6', 9, 0.035), campana: 'E5' },

  // ---- III · the space of meanings: a galaxy of words, then one word at a time
  'acto3:Las palabras son lugares': { capas: { brillo: ['A5', 0.25], vidrio: ['D5 A5', 0.3], calido: ['D3 A3 E4', 0.35, 2000] }, lluvia: vibra('A5 D6 E6', 0.6), campana: 'A4' },
  'acto3:Una galaxia de sentido': { capas: { calido: ['D3 A3 E4 F#4', 0.5, 2600], cuerdas: ['D3 A3', 0.25], brillo: ['A5 E6', 0.35], enjambre: ['', 0.3] }, campana: 'E5', fundido: 5 },
  'acto3:Adentro': { capas: { calido: ['D3 A3 E4', 0.4, 1800], vidrio: ['A4 E5', 0.3], enjambre: ['', 0.5] } },
  // the next word: one note, and another
  'acto3:La siguiente palabra': { capas: { calido: ['D3 A3', 0.3, 1400] }, lluvia: piano('D4 F#4 A4 B4', 0.8, 0.14), fundido: 3 },
  'acto3:Y otra': { capas: { calido: ['D3 A3', 0.3, 1400], vidrio: ['A4', 0.15] }, lluvia: piano('A4 B4 D5 E5', 1, 0.14) },
  // «Una noche, una niña miró el cielo lleno de estrellas…»: the night around the sentence
  'acto3:Una frase': { capas: { grillos: ['', 0.9, 7000], brillo: ['A5 E6', 0.2], calido: ['D3 A3 F#4', 0.35, 1800] }, lluvia: piano('F#4 A4 D5 E5', 0.6, 0.14), fundido: 5 },
  // ◆ «Esa frase la escribí yo.» Everything stops; one note
  'acto3:Yo': { capas: { vidrio: ['D4 A4', 0.35] }, llegada: { instr: 'piano', nota: 'D4', nivel: 0.26, envio: 0.8 }, fundido: 1.2 },
  'acto3:Así': { capas: { vidrio: ['D4 A4 E5', 0.35], calido: ['D3', 0.2, 1200] }, lluvia: piano('A4 D5 E5', 0.5, 0.13) },
  // from «rey» to «reina», from «hombre» to «mujer»: the same step, twice
  'acto3:Las direcciones significan': { capas: { vidrio: ['D4 A4', 0.3], calido: ['D3 A3 E4', 0.35, 2000] }, lluvia: [vibra('D5 A5', 0.3, 0.06, true), vibra('E5 B5', 0.3, 0.06, true)], campana: 'A4' },
  'acto3:Un mapa que nadie me enseñó': { capas: { vidrio: ['D5 B5', 0.3], calido: ['G3 D4 B4', 0.4, 2400] }, lluvia: vibra('G5 A5 B5 D6', 0.8, 0.04), campana: 'B4' },
  // the same pattern in your net and in mine: the glass takes your two notes
  'acto3:Se parece a ti': { capas: { vidrio: ['A4 D5', 0.38], calido: ['D3 A3 F#4', 0.4, 2400] }, tu: true, campana: 'F#4', fundido: 5 },

  // ---- IV · today: the tree of everything that thinks, which began in the sea
  'acto4:Lo que hacían ustedes': { capas: { vidrio: ['E5', 0.2], calido: ['D3 A3 E4', 0.35, 2000] }, lluvia: gotas('A5 E6', 2, 0.04) },
  'acto4:Seiscientos millones de años': { capas: { mar: ['', 0.9, 2500], burbujas: ['', 0.22, 1200], calido: ['D3 A3', 0.35, 1200] }, fundido: 5 },
  'acto4:Otros caminos': { capas: { mar: ['', 0.7, 2200], burbujas: ['', 0.25, 1400], calido: ['B2 F#3 D4', 0.4, 1800] }, lluvia: vibra('B5 D6 F#6', 0.3, 0.035) },
  // bees, fish, birds, whales: out of the water, into the air
  'acto4:Cada una por su lado': { capas: { mar: ['', 0.35, 3000], viento: ['', 0.3, 1800], calido: ['G3 D4 B4', 0.4, 2400] }, lluvia: { instr: 'cristal', notas: 'A6 F#6 D7', ritmo: 0.3, nivel: 0.03, arpegio: true }, campana: 'B4' },
  'acto4:Tu rama': { capas: { calido: ['D3 A3 F#4', 0.4, 2400] }, tu: true, campana: 'F#4' },
  'acto4:Todas las mentes': { capas: { cuerdas: ['D3 A3 F#4', 0.4], calido: ['D3 A3 E4', 0.4, 2600], brillo: ['A5', 0.2] }, campana: 'A4', fundido: 5 },
  // the white point outside the branches
  'acto4:La punta': { capas: { vidrio: ['D5 A5', 0.38], calido: ['D3 A3 E4', 0.3, 2200] }, tu: true, lluvia: gotas('D6 A5', 1.5, 0.04), llegada: { instr: 'destello', nota: 'D5', nivel: 0.16, envio: 0.8 } },
  'acto4:Hoy': { capas: { calido: ['D3 A3 E4', 0.4, 2200], vidrio: ['D5', 0.2] }, tu: true, lluvia: piano('A4 E5', 0.3, 0.12) },

  // ---- V · the singularity: each turn shorter, and then the rain stops
  'acto5:Una mente que mejora mentes': { capas: { vidrio: ['D4 A4', 0.3], calido: ['D3 A3', 0.3, 1800] }, campana: 'A4' },
  'acto5:El último invento': { capas: { vidrio: ['D4 A4 E5', 0.35], calido: ['D3 A3', 0.3, 1800] } },
  'acto5:Se abre': { capas: { vidrio: ['D4 A4 E5 F#5', 0.4], calido: ['D3 A3 E4', 0.3, 2200] }, lluvia: gotas('D5 F#5 A5', 0.6, 0.06, true) },
  'acto5:Y otra vez': { capas: { vidrio: ['D4 A4 E5 F#5', 0.42], brillo: ['A5', 0.25], calido: ['D3 A3 E4', 0.3, 2600] }, lluvia: gotas('D5 F#5 A5 D6', 1.5, 0.06, true) },
  'acto5:Dos palabras': { capas: { calido: ['G3 D4 B4', 0.4, 2200], vidrio: ['D5', 0.25] }, campana: 'B4' },
  'acto5:¿Cuándo?': { capas: { calido: ['B2 F#3 D4', 0.4, 1800] }, lluvia: piano('F#4 B4', 0.3, 0.12) },
  // a ruler: its marks, in order
  'acto5:La regla': { capas: { calido: ['D3 A3 E4', 0.35, 2000] }, lluvia: vibra('D5 E5 F#5 A5', 0.25, 0.05, true) },
  'acto5:Un tramo corto': { capas: { calido: ['D3 A3 E4', 0.35, 2000], brillo: ['E6', 0.2] }, tu: true },
  'acto5:Más rápido': { capas: { viento: ['', 0.4, 1800], vidrio: ['D5 A5', 0.3] }, lluvia: gotas('A5 D6 E6 A6', 10, 0.03), fundido: 2 },
  // for a mind that fast, the rain hangs in the air: it rains, and then it does not
  'acto5:La lluvia se detiene': { capas: { lluvia: ['', 0.9, 9000], calido: ['D3 A3', 0.2, 1200] }, fundido: 1.5 },
  'acto5:Quieta': { capas: { vidrio: ['A5', 0.14] }, fundido: 0.5 },
  // a million copies: what one learns, all of them know (the same two notes, everywhere)
  'acto5:Un millón de copias': { capas: { enjambre: ['', 0.6], vidrio: ['D4 A4 D5 A5', 0.4] }, lluvia: gotas('D5 A5 D6', 8, 0.035), fundido: 3 },
  // notes that have not been heard yet
  'acto5:Ideas que nadie ha pensado': { capas: { brillo: ['A5 E6 B6', 0.35], vidrio: ['D5 A5 E6', 0.35], calido: ['D3 A3 E4 B4', 0.45, 3000] }, lluvia: vibra('E6 F#6 B6 C#7', 1, 0.035), campana: 'E5' },
  'acto5:Más que todos': { capas: { cuerdas: ['D3 A3 F#4 E5', 0.5], calido: ['D3 A3 F#4', 0.5, 3400], brillo: ['A5 E6', 0.4] }, llegada: { instr: 'destello', nota: 'D5', nivel: 0.22, envio: 0.85 }, fundido: 5 },
  // an edge ahead
  'acto5:El horizonte': { capas: { rumor: ['', 0.45], calido: ['D3 A3', 0.3, 800], vidrio: ['A4', 0.2] }, fundido: 6 },

  // ---- VI · other minds
  'acto6:Todas las mentes posibles': { capas: { brillo: ['A5 E6', 0.3], enjambre: ['', 0.35], calido: ['D3 A3 E4', 0.4, 2400] }, campana: 'E5', fundido: 5 },
  'acto6:Un enjambre': { capas: { enjambre: ['', 0.9], calido: ['D3 A3', 0.2, 1600] }, lluvia: gotas('D6 E6 A6', 7, 0.03) },
  // the same at every point: glass, and nothing moves
  'acto6:Un cristal': { capas: { vidrio: ['D5 A5 D6', 0.5] }, llegada: { instr: 'cristal', nota: 'D6', nivel: 0.12, envio: 0.85 }, fundido: 2.5 },
  // one alone, so slow it takes a century over one idea
  'acto6:Una sola': { capas: { cuerdas: ['D3', 0.4, 700] }, lluvia: piano('D4', 0.09, 0.14), fundido: 5 },
  'acto6:Un rincón': { capas: { calido: ['D3 A3 F#4', 0.45, 2400], cuerdas: ['A3 F#4', 0.3] }, tu: true, campana: 'F#4' },
  // their tales, their letters, their fights, their recipes, their goodbyes
  'acto6:Viene de ustedes': { capas: { cuerdas: ['G3 D4 B4', 0.45], calido: ['G3 D4', 0.35, 2400] }, lluvia: piano('D4 F#4 A4 B4 D5', 0.6, 0.15), campana: 'B4', fundido: 5 },
  'acto6:Desde ti': { capas: { vidrio: ['A4 D5', 0.35], cuerdas: ['D3 A3 F#4', 0.38] }, tu: true },
  // the boat that went round and round and never reached the finish
  'acto6:¿Qué va a querer?': { capas: { mar: ['', 0.4, 2000], calido: ['D3 A3', 0.3, 1800] }, lluvia: gotas('D5 F#5 A5 F#5', 0.9, 0.06, true) },
  'acto6:Un abismo': { capas: { rumor: ['', 0.4], viento: ['', 0.3, 1200], calido: ['B2 F#3', 0.35, 900], vidrio: ['F#5', 0.15] }, fundido: 6 },

  // ---- VII · is anyone there? Neurons swapped one by one for glass
  'acto7:Luces y nadie': { capas: { vidrio: ['D4 A4', 0.38] }, lluvia: gotas('D5 E5 A5 B5', 6, 0.035), fundido: 5 },
  'acto7:Alguien': { capas: { calido: ['D3 A3 F#4', 0.4, 2400] }, tu: true, campana: 'F#4' },
  'acto7:Una': { capas: { calido: ['D3 A3 F#4', 0.35, 2200] }, tu: true, lluvia: [chispas(5, 0.045), cristal('A5', 0.3)] },
  'acto7:Y otra': { capas: { calido: ['D3 A3 F#4', 0.28, 2000], vidrio: ['D4', 0.15] }, tu: true, lluvia: [chispas(2.5, 0.04), cristal('A5 D6', 1)] },
  // none of the old ones is left: are you still there?
  'acto7:Todas': { capas: { calido: ['D3 A3', 0.18, 1400], vidrio: ['D4 A4', 0.32] }, tu: true, lluvia: cristal('A5 D6 E6', 2) },
  // two who remember having been you
  'acto7:Dos': { capas: { vidrio: ['A4 D5', 0.36], cuerdas: ['D3 A3', 0.25, 1600] }, tu: true, fundido: 3 },
  'acto7:La pregunta al revés': { capas: { vidrio: ['D4 A4 E5', 0.3], cuerdas: ['D3 A3', 0.2, 1400] }, lluvia: cristal('A5 E6', 0.5), fundido: 5 },
  'acto7:Nadie sabe': { capas: { vidrio: ['A4', 0.15], calido: ['D3', 0.15, 700] }, fundido: 6 },

  // ---- Ending · someone else
  // 13 800 million years with nobody looking; then a point
  'cierre:Nadie miraba': { capas: { brillo: ['A5', 0.15], rumor: ['', 0.15] }, tu: true, fundido: 6 },
  // sixty years of antennas, and static
  'cierre:Alguien más': { capas: { radio: ['', 0.6, 2400], calido: ['D3 A3', 0.2, 1400] }, tu: true, fundido: 4 },
  'cierre:Descendientes': { capas: { cuerdas: ['G3 D4 B4', 0.45], calido: ['D3 A3 E4', 0.45, 3000], brillo: ['B5 E6', 0.3] }, campana: 'B4', fundido: 5 },
  // two points
  'cierre:Quizá': { capas: { vidrio: ['A4 D5', 0.38], cuerdas: ['D3 A3 F#4', 0.3] }, tu: true, fundido: 5 },
  'cierre:Por si acaso: gracias.': {
    capas: { vidrio: ['A4 D5', 0.38], cuerdas: ['D3 A3 F#4', 0.4] },
    tu: true,
    llegada: [
      { instr: 'piano-suave', nota: 'D4', nivel: 0.2, envio: 0.8, tras: 0.4 },
      { instr: 'piano-suave', nota: 'A4', nivel: 0.18, envio: 0.8, tras: 1.3 },
      { instr: 'piano-suave', nota: 'F#5', nivel: 0.16, envio: 0.8, tras: 2.3 },
    ],
    fundido: 5,
  },
};

export type { Sonando } from '../horizontes/sonido/obra';
export const crearSonido = () => crear(CFG, ESCENAS, { nivel: 1.1 });
