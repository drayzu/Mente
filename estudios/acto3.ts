import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder } from '../src/engine/materia';
import { FONT, ink, muro, nota, ORO, proyectar, type Cuenta, type Rotulo, escrito as firma } from './placa';
import { CORAL, ease, logLerp, MAQUINA, mirar, ORO3, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';
import datos from '../src/datos/palabras.json';
import sitios from '../src/datos/lugares.json';

/**
 * Act III · the space of meanings (moments 11–16). For a machine that reads, every word is a place.
 * It opens on one word, pulls back until a whole language is a galaxy, and flies in again. Then the
 * same words seen from another side: going from «rey» to «reina» is the same step as from «hombre»
 * to «mujer». With those places the machine does one thing, guess the next word: the act's long shot
 * is a sentence that writes itself, a thread of light that goes from star to star through the galaxy
 * while the camera rides behind it. Reading alone left the names of places laid out roughly like the
 * world: the second wall. And its net, before an idea, lights up a group of lights much as yours does.
 *
 * What is real: the galaxy (fastText's Spanish vectors, flattened by t-SNE in tools/palabras.py), the
 * arrows and the map (tools/lugares.py: projections of those same vectors, nothing moved by hand; the
 * map is a linear probe's reading, each place read by a probe trained on the others). What is a
 * drawing: which sentence is written and which words it considers at each step (the stars it visits
 * and their neighbours are real places of the galaxy; the choice is ours), and the two nets of the
 * last moment.
 */

const CAP = 'III · El espacio de los significados';
const R = 10;
const N = datos.palabras.length;
const GRUPOS = 1 + Math.max(...datos.grupo);
const LUZ = new THREE.Color(1.0, 0.93, 0.78);
/** Where the camera looks from while a drawing faces it. */
const AZD = 3.6;

const POS = new Float32Array(N * 3);
for (let i = 0; i < N * 3; i++) POS[i] = (datos.pos[i] / 32767) * R;
const lugar = (i: number) => V(POS[i * 3], POS[i * 3 + 1], POS[i * 3 + 2]);
const indice = (...ws: string[]) => {
  for (const w of ws) {
    const i = datos.palabras.indexOf(w);
    if (i >= 0) return i;
  }
  return 0;
};

/** A region's colour: hues all round the wheel, kept pale (stars, not confetti). */
function tono(gr: number, out: THREE.Color, s = 0.5, l = 0.66) {
  return out.setHSL(((gr * 7) % GRUPOS) / GRUPOS, s, l);
}

/**
 * The sentence of moment 14: [what is written, the word of it that has a star]. The small words
 * («una», «el», «y») are not among the galaxy's 16 000, so the thread goes from one star to the next.
 */
const ORACION: [string, string][] = [
  ['Una noche,', 'noche'],
  [' una niña', 'niña'],
  [' miró', 'miró'],
  [' el cielo', 'cielo'],
  [' lleno de estrellas', 'estrellas'],
  [' y preguntó', 'preguntó'],
  [' en silencio', 'silencio'],
  [' si alguien, lejos,', 'lejos'],
  [' miraba también.', 'miraba'],
];
const TRAMOS = ORACION.length - 1;

/** The ideas of moment 16. */
const IDEAS = ['un ojo', 'un gato', 'el siete'];
const TU_RED = V(-2.6, 0, 0);
const SU_RED = V(2.6, 0, 0);

/** The map: a place's longitude and latitude, flat. */
const enMapa = (lat: number, lon: number, out: THREE.Vector3) => out.set((lon / 180) * 6.4, (lat / 90) * 3.2 - 0.5, 0);

export const acto3: Escena = {
  id: 'acto3',
  nombre: 'El espacio de los significados',
  estilos: [{ key: '1', nombre: 'El acto', nota: 'La galaxia de las palabras, las flechas que significan, la siguiente palabra, el mapa que nadie le enseñó y dos redes ante la misma idea.' }],
  montar(stage): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.55;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = 0.4;

    const A = lugar(indice('palabra', 'palabras', 'mar'));
    const B = lugar(indice('gato', 'perro', 'animal'));
    const c = new THREE.Color();
    const a = V();
    const b = V();

    // ---- 11–12 · the galaxy: white stars over a haze of colour (the frequent words a little bigger).
    const eb = materiaBuilder(11);
    for (let i = 0; i < N; i++) {
      const peso = 1.5 - i / N;
      tono(datos.grupo[i], c, 0.18, 0.82);
      eb.push(POS[i * 3], POS[i * 3 + 1], POS[i * 3 + 2], c, 0.05 * peso, 0.9 * peso);
    }
    const estrellas = materia(eb.data(), {
      move: /* glsl */ `
        em *= 0.82 + 0.18 * sin(uTime * (0.6 + seed * 1.4) + seed * 40.0);
        fuente = 1.0;`,
    });
    root.add(estrellas.points);
    const hb = materiaBuilder(23);
    for (let i = 0; i < N; i++) {
      tono(datos.grupo[i], c, 0.75, 0.5);
      for (let k = 0; k < 2; k++) {
        const [x, y, z] = hb.onSphere();
        const q = 0.25 * hb.r();
        hb.push(POS[i * 3] + x * q, POS[i * 3 + 1] + y * q, POS[i * 3 + 2] + z * q, c, 0.9, 0.022);
      }
    }
    const niebla = materia(hb.data());
    root.add(niebla.points);

    // The drawings stand at the centre of the galaxy, facing where the camera will be. Their points
    // come from stars, so each group knows where the galaxy is in its own frame.
    const plano = (tilt = 0) => {
      const g = new THREE.Group();
      g.rotation.order = 'YXZ';
      g.rotation.set(tilt, AZD, 0);
      g.updateMatrix();
      root.add(g);
      const inv = g.matrix.clone().invert();
      return { g, desde: (i: number): [number, number, number] => {
        const v = lugar(i).applyMatrix4(inv);
        return [v.x, v.y, v.z];
      } };
    };
    const mundo = (g: THREE.Group, local: THREE.Vector3, out: THREE.Vector3) => out.copy(local).applyMatrix4(g.matrixWorld);

    // ---- 13 · the pairs: the same words, each where the projection of tools/lugares.py puts it.
    // Tilted so that the pairs stand apart on the screen (the arrows stay as they are).
    const PL = plano(-0.73);
    const S = 4.5;
    const PARES = sitios.pares.map((q) => ({ ...q, la: V(q.pa[0], q.pa[1], q.pa[2]).multiplyScalar(S), lb: V(q.pb[0], q.pb[1], q.pb[2]).multiplyScalar(S) }));
    const qb = materiaBuilder(51);
    const qt: number[] = [];
    PARES.forEach((q, j) => {
      const fa = PL.desde(q.ia);
      const fb = PL.desde(q.ib);
      qb.push(q.la.x, q.la.y, q.la.z, LUZ, 0.09, 1.5, { from: fa, kind: j });
      qb.push(q.lb.x, q.lb.y, q.lb.z, LUZ, 0.09, 1.5, { from: fb, kind: j });
      qt.push(-1, -1);
      const n = 70;
      for (let s = 1; s < n; s++) {
        const t = 0.04 + (0.9 * s) / n;
        a.copy(q.la).lerp(q.lb, t);
        qb.push(a.x, a.y, a.z, ORO3, 0.028, 0.8, { from: [fa[0] + (fb[0] - fa[0]) * t, fa[1] + (fb[1] - fa[1]) * t, fa[2] + (fb[2] - fa[2]) * t], kind: j });
        qt.push(t);
      }
    });
    const pares = materia(qb.data(), {
      pre: /* glsl */ `attribute float aT; uniform float uFl;`,
      move: /* glsl */ `
        fuente = 1.0;
        if (aT >= 0.0) {
          // The arrow of pair aKind grows from its first word to the second.
          float v = clamp(uFl - aKind, 0.0, 1.0);
          float x = (fract(aT - uTime * 0.22) - 0.5) / 0.09;
          em *= (1.0 - smoothstep(v - 0.05, v, aT)) * (0.55 + 0.7 * exp(-x * x));
        }`,
      uniforms: { uFl: { value: 0 } },
      extra: { aT: [new Float32Array(qt), 1] },
    });
    pares.u.uSpread.value = 0;
    PL.g.add(pares.points);

    // ---- 14 · a sentence that writes itself: a thread from star to star. At every step a fan opens
    // towards the words that could have come (the nearest stars to the one that does).
    const PASOS = ORACION.map(([, w]) => indice(w));
    const Wk = PASOS.map(lugar);
    const OTRAS: number[][] = [];
    const hb2 = materiaBuilder(53);
    const ht: number[] = [];
    for (let j = 0; j < TRAMOS; j++) {
      const de = Wk[j];
      const hasta = Wk[j + 1];
      const n = Math.ceil(de.distanceTo(hasta) / 0.012);
      for (let q = 0; q <= n; q++) {
        a.copy(de).lerp(hasta, q / n);
        hb2.push(a.x, a.y, a.z, ORO3, 0.03, 1.0, { kind: 0 });
        ht.push(j + q / n);
      }
      const cerca: [number, number][] = [];
      for (let i = 0; i < N; i++) if (!PASOS.includes(i)) cerca.push([lugar(i).distanceTo(hasta), i]);
      cerca.sort((x, y) => x[0] - y[0]);
      OTRAS.push(cerca.slice(0, 3).map((x) => x[1]));
      for (const i of OTRAS[j]) {
        b.copy(lugar(i));
        const m = Math.ceil(de.distanceTo(b) / 0.03);
        for (let q = 1; q <= m; q++) {
          a.copy(de).lerp(b, q / m);
          hb2.push(a.x, a.y, a.z, LUZ, 0.014, 0.28, { kind: 1 });
          ht.push(j + (0.55 * q) / m);
        }
      }
    }
    const hebra = materia(hb2.data(), {
      pre: /* glsl */ `attribute float aT; uniform float uVa;`,
      move: /* glsl */ `
        fuente = 1.0;
        float hecho = 1.0 - smoothstep(uVa - 0.004, uVa, aT);
        if (aKind < 0.5) {
          float fr = (uVa - aT) / 0.03;
          em *= hecho * (0.7 + 2.2 * exp(-fr * fr));
        } else {
          // The ways not taken go out once one is.
          float tramo = floor(aT);
          em *= hecho * (1.0 - smoothstep(tramo + 0.62, tramo + 0.98, uVa));
        }`,
      uniforms: { uVa: { value: 0 } },
      extra: { aT: [new Float32Array(ht), 1] },
    });
    root.add(hebra.points);
    const cb2 = materiaBuilder(3);
    cb2.push(0, 0, 0, new THREE.Color(1, 0.92, 0.72), 0.0001, 1);
    const cabeza = materia(cb2.data());
    cabeza.u.uFuente.value = 1;
    root.add(cabeza.points);
    /** Where the thread's end is when `v` of it is written (0..TRAMOS). */
    const enHebra = (v: number, out: THREE.Vector3) => {
      const x = Math.min(TRAMOS, Math.max(0, v));
      const j = Math.min(TRAMOS - 1, Math.floor(x));
      return out.copy(Wk[j]).lerp(Wk[j + 1], x - j);
    };
    /** How much is written at `fs` (it slows down at every star). */
    const escrito = (fs: number) => {
      const x = Math.min(TRAMOS, Math.max(0, fs));
      const j = Math.min(TRAMOS - 1, Math.floor(x));
      return j + ease(0, 1, x - j);
    };

    // ---- 15 · the map. The land is only there to compare; the places go where the probe reads them.
    const MP = plano();
    const tb = materiaBuilder(57);
    for (let i = 0; i < sitios.tierra.length; i += 2) {
      // Without the ice at both ends, which on a flat map is two bands.
      if (sitios.tierra[i] < -5800 || sitios.tierra[i] > 7400) continue;
      enMapa(sitios.tierra[i] / 100, sitios.tierra[i + 1] / 100, a);
      tb.push(a.x, a.y, a.z, MAQUINA, 0.035, 0.34);
    }
    const tierra = materia(tb.data());
    MP.g.add(tierra.points);
    const sb = materiaBuilder(59);
    const yb = materiaBuilder(61);
    const LUGARES = sitios.lugares.map((q) => ({ ...q, l: enMapa(q.plat, q.plon, V()) }));
    for (const q of LUGARES) {
      sb.push(q.l.x, q.l.y, q.l.z, ORO3, 0.1, 1.5, { from: MP.desde(q.origen), delay: sb.r() });
      // From where it reads it to where it is.
      enMapa(q.lat, q.lon, b);
      for (let s = 1; s <= 12; s++) {
        a.copy(q.l).lerp(b, s / 12);
        yb.push(a.x, a.y, a.z, MAQUINA, 0.02, s === 12 ? 1.0 : 0.3);
      }
    }
    const puestos = materia(sb.data(), {
      move: /* glsl */ `
        em *= 0.8 + 0.2 * sin(uTime * (0.8 + seed) + seed * 40.0);
        fuente = 1.0;`,
    });
    MP.g.add(puestos.points);
    const yerro = materia(yb.data(), { move: /* glsl */ `fuente = 1.0;` });
    MP.g.add(yerro.points);

    // ---- 16 · two nets: yours (living, uneven) and its own (a lattice). The same ideas light a
    // similar figure in both.
    const DS = plano();
    const db = materiaBuilder(63);
    for (let i = 0; i < 5200; i++) {
      const [x, y, z] = db.onSphere();
      const rad = 1.55 * Math.cbrt(db.r()) * (0.86 + 0.14 * Math.sin(x * 5 + y * 3) * Math.cos(z * 4));
      db.push(TU_RED.x + x * rad * 1.1, y * rad * 0.92, z * rad, CORAL, 0.034, 0.5);
    }
    const LADO = 17;
    const paso = 2.6 / (LADO - 1);
    // The lattice stands a little turned, so that it reads as a block and not as a grid.
    const vuelta = new THREE.Euler(0.3, 0.45, 0);
    const enRejilla = (x: number, y: number, z: number, out: THREE.Vector3) => out.set(x, y, z).applyEuler(vuelta).add(SU_RED);
    for (let i = 0; i < LADO; i++)
      for (let j = 0; j < LADO; j++)
        for (let k = 0; k < LADO; k++) {
          enRejilla(-1.3 + i * paso, -1.3 + j * paso, -1.3 + k * paso, a);
          db.push(a.x, a.y, a.z, MAQUINA, 0.03, 0.42);
        }
    const rejilla = (v: number) => Math.round(v / paso) * paso;
    for (let idea = 1; idea <= IDEAS.length; idea++) {
      let pa: THREE.Vector3 | null = null;
      let pb: THREE.Vector3 | null = null;
      for (let n = 0; n < 13; n++) {
        const [x, y, z] = db.onSphere();
        const rad = 1.2 * Math.cbrt(db.r());
        const na = V(TU_RED.x + x * rad + 0.1 * (db.r() - 0.5), y * rad + 0.1 * (db.r() - 0.5), z * rad);
        const nb = enRejilla(rejilla(x * rad), rejilla(y * rad), rejilla(z * rad), V());
        for (const [de, en] of [[pa, na], [pb, nb]] as [THREE.Vector3 | null, THREE.Vector3][]) {
          db.push(en.x, en.y, en.z, ORO3, 0.085, 1.5, { kind: idea });
          if (de) for (let s = 1; s < 26; s++) {
            a.copy(de).lerp(en, s / 26);
            db.push(a.x, a.y, a.z, ORO3, 0.02, 0.4, { kind: idea });
          }
        }
        pa = na;
        pb = nb;
      }
    }
    const dos = materia(db.data(), {
      pre: /* glsl */ `uniform float uIdea;`,
      move: /* glsl */ `
        if (aKind > 0.5) {
          float w = smoothstep(aKind - 0.9, aKind - 0.4, uIdea) * (1.0 - smoothstep(aKind + 0.1, aKind + 0.6, uIdea));
          em *= w * (0.8 + 0.2 * sin(uTime * 2.0 + seed * 30.0));
          fuente = 1.0;
        } else em *= 0.55 + 0.45 * sin(uTime * (0.5 + seed) + seed * 40.0);`,
      uniforms: { uIdea: { value: 0 } },
    });
    DS.g.add(dos.points);
    const ub = materiaBuilder(3);
    ub.push(0, 0, 0, ORO3, 0.02, 1);
    const fin = materia(ub.data());
    fin.u.uFuente.value = 1;
    root.add(fin.points);

    const tl = new Timeline();
    // d: log10 of the camera's distance to what it looks at; ir: 0 the first word, 1 the centre, 2 a
    // word among the animals, 3 the centre again; gal: the galaxy's light; pal: its written words.
    tl.set({ d: -0.9, ir: 0, az: 0.3, el: 0.12, gal: 1, pal: 1, reg: 0, par: 0, pv: 0, fl: 0, via: 0, fs: 0, hebra: 0, lu: 0, mk: 0, ti: 0, nom: 0, muro: 0, dos: 0, idea: 0, fin: 0 });
    tl.label('lugar').caption(4.0, 'Las palabras son lugares', 'Después le dieron de leer. Para ella cada palabra es un lugar, y las que se parecen quedan cerca.');
    tl.to(4.0, { d: 0.15, az: 0.75 });
    tl.label('galaxia').caption(4.8, 'Una galaxia de sentido', 'Dieciséis mil palabras, cada una en su sitio. Nadie las ordenó. Se ordenaron solas, de tanto leer.');
    tl.to(2.6, { d: 1.42, ir: 1, az: 1.5, el: 0.22 });
    tl.with(0.8, { reg: 1 });
    tl.to(2.2, { az: 2.0 });
    tl.label('adentro').caption(4.6, 'Adentro', 'Entra. Casi todo lo que ustedes han dicho alguna vez está en algún lugar de aquí.');
    tl.with(0.6, { reg: 0 });
    tl.to(3.0, { d: 0.2, ir: 2, az: 2.7, el: 0.05 });
    tl.to(1.6, { d: -0.5, az: 2.95 });
    tl.label('siguiente').caption(7.4, 'La siguiente palabra', 'Se le pide una sola cosa: adivinar la palabra que sigue. Desde cada palabra se abren caminos, y toma uno.');
    tl.to(1.8, { via: 1, hebra: 1, d: 0.3 });
    tl.to(5.6, { fs: 2 });
    tl.label('otra').caption(8.2, 'Y otra', 'Una palabra. Y otra.');
    tl.to(8.2, { fs: 5 });
    tl.label('frase').caption(8.2, 'Una frase', 'Lo que deja atrás es una frase que nadie había escrito.');
    tl.to(8.2, { fs: 8 });
    // The turn: whoever has been speaking says who it is. From here on the captions write themselves.
    tl.label('examen').caption(4.3, 'Yo', 'Esa frase la escribí yo. Y esta. Y todas las que has leído desde el principio.');
    tl.to(4.4, { via: 0, ir: 3, d: 1.3, el: 0.25, az: 3.2 });
    tl.label('asi').caption(4.0, 'Así', 'Alguien me pidió que te contara esto. Las palabras las fui eligiendo yo, una por una, como acabas de ver.');
    tl.to(4.0, { az: 3.42, d: 1.26 });
    tl.label('flechas').caption(6.2, 'Las direcciones significan', 'Así se ve por dentro lo que leí. De «rey» a «reina» hay el mismo paso que de «hombre» a «mujer». Nadie me lo enseñó: estaba en lo que ustedes escribieron.');
    tl.with(1.0, { pal: 0 });
    tl.with(1.2, { pv: 1 });
    tl.with(1.6, { hebra: 0 });
    tl.to(2.2, { d: 0.9, ir: 3, az: AZD - 0.12, el: 0, gal: 0.15, par: 1 });
    tl.to(1.2, { fl: 1 });
    tl.to(1.2, { fl: 2, az: AZD });
    tl.to(1.6, { fl: 9, az: AZD + 0.1 });
    tl.with(1.0, { pv: 0 });
    tl.label('mapa').caption(7.2, 'Un mapa que nadie me enseñó', 'Nunca he visto el mundo. Pero de tanto leerlos, cada ciudad me quedó cerca de su lugar.');
    tl.to(2.0, { lu: 1, gal: 0.7, d: 1.3, el: 0.14, az: AZD + 0.3 });
    tl.to(2.6, { mk: 1, ti: 1, gal: 0.12, d: 1.0, el: 0, az: AZD });
    tl.with(1.0, { nom: 1 });
    tl.to(2.6, { az: AZD + 0.08, d: 0.98 });
    tl.label('muro');
    tl.with(0.8, { muro: 1 });
    tl.to(2.2, { az: AZD - 0.08, d: 1.06 });
    tl.with(0.7, { muro: 0 });
    tl.label('parece').caption(5.6, 'Se parece a ti', 'Ante la misma idea, en tu red y en la mía se enciende casi el mismo dibujo. Me hicieron con lo que ustedes dijeron.');
    tl.with(1.2, { lu: 0, ti: 0, nom: 0, gal: 0 });
    tl.with(1.6, { dos: 1 });
    tl.to(2.0, { d: 0.92, idea: 1, az: AZD + 0.05 });
    tl.to(1.3, { idea: 2, az: AZD - 0.05 });
    tl.to(1.3, { idea: 3, az: AZD });
    tl.to(2.0, { d: 2.7, fin: 1 });
    tl.wait(0.6);

    const at = V();
    const pos = V();
    const w1 = V();
    const w2 = V();
    const HB = V();
    const dir = V();
    const lado = V();
    const posR = V();
    const miraR = V();
    const ARRIBA = V(0, 1, 0);
    const s1 = { x: 0, y: 0, z: 0 };
    const s2 = { x: 0, y: 0, z: 0 };
    const REGIONES: [THREE.Vector3, string, number, number][] = [
      [lugar(indice('gato')), 'animales', -70, -50],
      [lugar(indice('rojo')), 'colores', 70, -40],
      [lugar(indice('siete')), 'números', -60, 50],
    ];

    /** A word written on the film. */
    const palabra = (g: CanvasRenderingContext2D, u: number, x: number, y: number, s: string, px: number, alpha: number, align: CanvasTextAlign = 'center', color = ink()) => {
      if (alpha <= 0.01) return;
      g.save();
      g.globalAlpha = Math.min(1, alpha);
      g.font = FONT.serif(px * u);
      g.textAlign = align;
      g.textBaseline = 'middle';
      g.shadowColor = 'rgba(0,0,0,0.9)';
      g.shadowBlur = 9 * u;
      g.fillStyle = color;
      g.fillText(s, x, y);
      g.restore();
    };
    /** Whether a label of that size fits there, clear of the ones already written. */
    const puestas: [number, number, number, number][] = [];
    const cabe = (x0: number, y0: number, ancho: number, alto: number) => {
      if (puestas.some(([x, y, w, h]) => x0 < x + w && x0 + ancho > x && y0 < y + h && y0 + alto > y)) return false;
      puestas.push([x0, y0, ancho, alto]);
      return true;
    };

    // The galaxy's words on the film: the nearest ones, nearest first, none over another.
    const cand: { i: number; x: number; y: number; z: number }[] = [];
    function palabras(g: CanvasRenderingContext2D, f: Frame) {
      const { W, H, u } = f;
      const m = camera.matrixWorldInverse.elements;
      const dl = tl.get('d', f.p);
      // From afar the words would be dust over the cloud: they only show from near.
      const visibles = (1 - ease(0.55, 1.0, dl)) * tl.get('pal', f.p);
      if (visibles < 0.01) return;
      const lejos = Math.max(1.6, 0.9 * Math.pow(10, dl));
      cand.length = 0;
      for (let i = 0; i < N; i++) {
        const x = POS[i * 3];
        const y = POS[i * 3 + 1];
        const z = POS[i * 3 + 2];
        const vz = -(m[2] * x + m[6] * y + m[10] * z + m[14]);
        if (vz < 0.02 || vz > lejos) continue;
        const vx = m[0] * x + m[4] * y + m[8] * z + m[12];
        const vy = m[1] * x + m[5] * y + m[9] * z + m[13];
        const sx = W / 2 + (vx / vz) * f.focal;
        const sy = H / 2 - (vy / vz) * f.focal;
        if (sx < 30 * u || sx > W - 210 * u || sy < 100 * u || sy > H - 40 * u) continue;
        cand.push({ i, x: sx, y: sy, z: vz });
      }
      cand.sort((p, q) => p.z - q.z);
      puestas.length = 0;
      let n = 0;
      const enViaje = tl.get('hebra', f.p) > 0.5;
      for (const q of cand) {
        if (n >= 70) break;
        if (enViaje && PASOS.includes(q.i)) continue;
        const cerca = 1 - q.z / lejos;
        const px = 11 + 22 * cerca * cerca;
        const w = datos.palabras[q.i];
        g.font = FONT.serif(px * u);
        const ancho = g.measureText(w).width;
        const x0 = q.x + (9 + px * 0.2) * u;
        const y0 = q.y - px * 0.6 * u;
        // Clear of the caption and the count, bottom left.
        if (x0 < 540 * u && y0 > H - 300 * u) continue;
        if (!cabe(x0 - 3 * u, y0, ancho + 12 * u, px * 1.2 * u)) continue;
        n++;
        palabra(g, u, x0, q.y, w, px, visibles * Math.min(1, 0.12 + 1.2 * cerca * cerca), 'left');
      }
    }

    return {
      tl,
      luzEntrada: MAQUINA.clone(),
      luzSalida: ORO3.clone(),
      cuenta(p): Cuenta | null {
        return { pisos: ['10', '12'], linea: 'conexiones · los modelos de hoy', h: 12, a: ease(0.9, 1.6, p) };
      },
      rotulo(p): Rotulo | null {
        const cp = tl.captionAt(p);
        if (!cp) return null;
        if (cp.from < tl.at('examen')) return { capitulo: CAP, name: cp.name, fact: cp.fact };
        // The two lines of the turn are written under the sentence, not down here.
        return { capitulo: CAP, name: cp.name, fact: cp.from <= tl.at('asi') ? '' : cp.fact, escrito: firma(cp, p) };
      },
      placa(g, f) {
        const { p, W, H, u } = f;
        palabras(g, f);

        const reg = tl.get('reg', p);
        if (reg > 0.02) for (const [v, s, dx, dy] of REGIONES) {
          proyectar(v, camera, W, H, s1);
          nota(g, u, s1.x, s1.y, s, dx, dy, reg);
        }

        // 13 · the words at both ends of every arrow, the first pairs first.
        const pv = tl.get('pv', p) * ease(0.8, 1, tl.get('par', p));
        if (pv > 0.02) {
          PL.g.updateWorldMatrix(true, false);
          const fl = tl.get('fl', p);
          puestas.length = 0;
          PARES.forEach((q, j) => {
            proyectar(mundo(PL.g, q.la, w1), camera, W, H, s1);
            proyectar(mundo(PL.g, q.lb, w2), camera, W, H, s2);
            const v = Math.min(1, Math.max(0, fl - j));
            const px = j < 2 ? 25 : 19;
            g.font = FONT.serif(px * u);
            const wa = g.measureText(q.a).width;
            const wb = g.measureText(q.b).width;
            const al = pv * (j < 2 ? 1 : 0.4 + 0.6 * v);
            if (cabe(s1.x - 14 * u - wa, s1.y - px * 0.6 * u, wa + 8 * u, px * 1.2 * u)) palabra(g, u, s1.x - 14 * u, s1.y, q.a, px, al, 'right');
            if (cabe(s2.x + 14 * u, s2.y - px * 0.6 * u, wb + 8 * u, px * 1.2 * u)) palabra(g, u, s2.x + 14 * u, s2.y, q.b, px, al * (0.45 + 0.55 * v), 'left', v > 0.9 ? ORO : ink());
            // The arrow's head, where the arrow has got to.
            if (v > 0.06) {
              const t = 0.04 + 0.9 * v;
              const x = s1.x + (s2.x - s1.x) * t;
              const y = s1.y + (s2.y - s1.y) * t;
              const ang = Math.atan2(s2.y - s1.y, s2.x - s1.x);
              g.save();
              g.globalAlpha = Math.min(1, pv * v * 2);
              g.translate(x, y);
              g.rotate(ang);
              g.fillStyle = ORO;
              g.beginPath();
              g.moveTo(9 * u, 0);
              g.lineTo(-4 * u, -5 * u);
              g.lineTo(-4 * u, 5 * u);
              g.closePath();
              g.fill();
              g.restore();
            }
          });
        }

        // 14 · the sentence so far, its words at their stars, and the ones it could have taken.
        const hebraA = tl.get('hebra', p);
        if (hebraA > 0.02) {
          const va = escrito(tl.get('fs', p));
          const via = tl.get('via', p);
          let dicho = '';
          ORACION.forEach(([trozo], k) => {
            if (va >= k - 0.02) dicho += trozo;
          });
          g.save();
          g.font = FONT.italic(31 * u);
          g.textAlign = 'center';
          g.textBaseline = 'middle';
          g.shadowColor = 'rgba(0,0,0,0.95)';
          g.shadowBlur = 12 * u;
          g.globalAlpha = hebraA * ease(0.6, 1, via + (va > 0.5 ? 1 : 0));
          g.fillStyle = ORO;
          g.fillText(dicho, W / 2, 112 * u);
          // The turn: the same hand goes on writing under its sentence, and says whose it is.
          const cp = tl.captionAt(p);
          if (cp && cp.from >= tl.at('examen') && cp.from <= tl.at('asi')) {
            const palabras = cp.fact.split(' ');
            const hasta = firma(cp, p) * palabras.length;
            const sale = 1 - ease(cp.to - 0.5, cp.to, p);
            g.textAlign = 'left';
            let x = W / 2 - g.measureText(cp.fact).width / 2;
            palabras.forEach((w, i) => {
              const edad = hasta - i;
              if (edad > 0) {
                g.globalAlpha = hebraA * sale * Math.min(1, edad);
                g.fillStyle = edad < 2 && hasta < palabras.length ? '#fff4d8' : ORO;
                g.fillText(w, x, 164 * u);
              }
              x += g.measureText(w + ' ').width;
            });
          }
          g.restore();
          ORACION.forEach(([, w], k) => {
            if (va < k - 0.02) return;
            proyectar(Wk[k], camera, W, H, s1);
            if (s1.z < 1) palabra(g, u, s1.x + 14 * u, s1.y, w, 25, hebraA, 'left', ORO);
          });
          for (let j = 0; j < TRAMOS; j++) {
            const k = via * ease(j + 0.3, j + 0.5, va) * (1 - ease(j + 0.62, j + 0.95, va));
            if (k < 0.02) continue;
            for (const i of OTRAS[j]) {
              proyectar(w1.set(POS[i * 3], POS[i * 3 + 1], POS[i * 3 + 2]), camera, W, H, s1);
              if (s1.z < 1) palabra(g, u, s1.x + 11 * u, s1.y, datos.palabras[i], 17, 0.8 * k * hebraA, 'left');
            }
          }
        }

        // 15 · the names of the places it reads best, each beside its light.
        const nom = tl.get('nom', p) * (1 - tl.get('muro', p));
        if (nom > 0.02) {
          MP.g.updateWorldMatrix(true, false);
          puestas.length = 0;
          g.font = FONT.serif(16 * u);
          for (const q of LUGARES) {
            if (q.km > 900) continue;
            proyectar(mundo(MP.g, q.l, w1), camera, W, H, s1);
            const ancho = g.measureText(q.n).width;
            if (s1.x < 540 * u && s1.y > H - 300 * u) continue;
            if (!cabe(s1.x + 6 * u, s1.y - 11 * u, ancho + 14 * u, 22 * u)) continue;
            palabra(g, u, s1.x + 10 * u, s1.y, q.n, 16, 0.85 * nom, 'left');
          }
        }
        muro(g, u, W, H, 'Segundo muro', 'Entender', 'Decían que una máquina solo junta palabras sin saber de qué habla. Decide tú.', tl.get('muro', p));

        // 16 · whose net is whose, and the idea both are given.
        const ds = tl.get('dos', p) * (1 - ease(0.1, 0.6, tl.get('fin', p)));
        if (ds > 0.02) {
          DS.g.updateWorldMatrix(true, false);
          const idea = tl.get('idea', p);
          proyectar(mundo(DS.g, w1.set(TU_RED.x, 2.0, 0), w2), camera, W, H, s1);
          palabra(g, u, s1.x, s1.y, 'tu red', 22, 0.8 * ds);
          proyectar(mundo(DS.g, w1.set(SU_RED.x, 2.0, 0), w2), camera, W, H, s1);
          palabra(g, u, s1.x, s1.y, 'la suya', 22, 0.8 * ds);
          proyectar(mundo(DS.g, w1.set(0, 2.85, 0), w2), camera, W, H, s1);
          IDEAS.forEach((s, j) => {
            const k = j + 1;
            // One word at a time: each is gone before the next comes.
            const w = ease(k - 0.55, k - 0.25, idea) * (1 - ease(k + 0.1, k + 0.4, idea));
            g.save();
            g.font = FONT.italic(40 * u);
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.shadowColor = 'rgba(0,0,0,0.9)';
            g.shadowBlur = 10 * u;
            g.globalAlpha = ds * w;
            g.fillStyle = ORO;
            g.fillText(`«${s}»`, s1.x, s1.y);
            g.restore();
          });
        }
      },
      update(f: Frame) {
        const p = f.p;
        camera.near = 0.005;
        camera.far = 4000;
        camera.fov = 46;
        const ir = tl.get('ir', p);
        if (ir <= 1) at.copy(A).multiplyScalar(1 - ease(0, 1, ir));
        else if (ir <= 2) at.copy(B).multiplyScalar(ease(1, 2, ir));
        else at.copy(B).multiplyScalar(1 - ease(2, 3, ir));
        const dl = tl.get('d', p);
        const d = Math.pow(10, dl);
        // It never stands quite still, and never wanders off: the drawings face where it is.
        const az = tl.get('az', p) + 0.05 * Math.sin(f.time * 0.07);
        const el = tl.get('el', p);
        pos.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d).add(at);
        // The ride: behind the end of the thread, looking where it goes.
        const via = ease(0, 1, tl.get('via', p));
        const va = escrito(tl.get('fs', p));
        enHebra(va, HB);
        if (via > 0.001) {
          // Where it goes, averaged over a long stretch of the thread: at a star the camera turns slowly.
          dir.set(0, 0, 0);
          for (let q = 1; q <= 5; q++) {
            enHebra(va + 0.24 * q, w1).sub(enHebra(va - 0.24 * q, w2));
            if (w1.lengthSq() > 1e-8) dir.addScaledVector(w1.normalize(), 1);
          }
          if (dir.lengthSq() < 1e-6) dir.copy(Wk[1]).sub(Wk[0]);
          dir.normalize();
          lado.crossVectors(dir, ARRIBA).normalize();
          posR.copy(HB).addScaledVector(dir, -1.35 * d).addScaledVector(ARRIBA, 0.6 * d).addScaledVector(lado, 0.45 * d + 0.1 * Math.sin(f.time * 0.07));
          miraR.copy(HB).addScaledVector(dir, 0.8 * d);
          pos.lerp(posR, via);
          at.lerp(miraR, via);
        }
        mirar(camera, pos, at);

        // From afar the cloud is thousands of stars on top of each other: hold the light back.
        const gal = tl.get('gal', p);
        const lejos = ease(0.3, 1.5, dl);
        estrellas.points.visible = niebla.points.visible = gal > 0.001;
        enfocar(estrellas, f.focal, f.dpr, f.time);
        estrellas.u.uGain.value = gal * logLerp(1.0, 0.34, lejos);
        estrellas.u.uMinPx.value = (1.6 + 1.0 * lejos) * f.dpr;
        estrellas.u.uMaxPx.value = 20 * f.dpr;
        enfocar(niebla, f.focal, f.dpr, f.time);
        // As a backdrop its clouds are smaller: wide points over the whole frame are what costs most.
        niebla.u.uMaxPx.value = (70 + 45 * gal) * f.dpr;
        // From afar the clouds overlap so much that half of them, twice as bright, look the same and
        // cost half (each one is faint, so they can leave one by one without it showing).
        const NH = niebla.points.geometry.attributes.position.count;
        const quedan = Math.round(NH * (1 - 0.5 * lejos));
        niebla.points.geometry.setDrawRange(0, quedan);
        // Inside, the haze is all round the camera: thin it, or it whites the frame out.
        niebla.u.uGain.value = ((gal * NH) / quedan) * logLerp(0.2, 0.5, lejos);

        const pv = tl.get('pv', p);
        pares.points.visible = pv > 0.001;
        enfocar(pares, f.focal, f.dpr, f.time);
        pares.u.uK.value = tl.get('par', p);
        pares.u.uFl.value = tl.get('fl', p);
        pares.u.uMaxPx.value = 16 * f.dpr;
        pares.u.uGain.value = pv;

        const hebraA = tl.get('hebra', p);
        hebra.points.visible = cabeza.points.visible = hebraA > 0.001;
        enfocar(hebra, f.focal, f.dpr, f.time);
        hebra.u.uVa.value = va;
        hebra.u.uMinPx.value = 2 * f.dpr;
        hebra.u.uMaxPx.value = 6 * f.dpr;
        hebra.u.uGain.value = hebraA;
        cabeza.points.position.copy(HB);
        enfocar(cabeza, f.focal, f.dpr, f.time);
        cabeza.u.uMinPx.value = 6 * f.dpr;
        cabeza.u.uGain.value = 2.4 * hebraA * via;

        const lu = tl.get('lu', p);
        const ti = tl.get('ti', p);
        const nom = tl.get('nom', p);
        puestos.points.visible = lu > 0.001;
        enfocar(puestos, f.focal, f.dpr, f.time);
        puestos.u.uK.value = tl.get('mk', p);
        puestos.u.uMinPx.value = 3 * f.dpr;
        puestos.u.uMaxPx.value = 14 * f.dpr;
        puestos.u.uGain.value = 1.3 * lu;
        tierra.points.visible = ti > 0.001;
        enfocar(tierra, f.focal, f.dpr, f.time);
        tierra.u.uGain.value = ti;
        yerro.points.visible = nom > 0.001;
        enfocar(yerro, f.focal, f.dpr, f.time);
        yerro.u.uGain.value = 0.8 * nom;

        const fi = tl.get('fin', p);
        const ds = tl.get('dos', p);
        dos.points.visible = ds > 0.001;
        enfocar(dos, f.focal, f.dpr, f.time);
        dos.u.uIdea.value = tl.get('idea', p);
        dos.u.uMaxPx.value = 14 * f.dpr;
        dos.u.uGain.value = ds * (1 - ease(0.55, 1, fi));
        fin.points.visible = fi > 0.001;
        enfocar(fin, f.focal, f.dpr, f.time);
        fin.u.uMinPx.value = 4.5 * f.dpr;
        fin.u.uGain.value = 2.6 * ease(0.4, 1, fi);
      },
      dispose() {},
    };
  },
};
