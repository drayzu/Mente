import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder } from '../src/engine/materia';
import { gauss } from '../src/engine/math';
import { nota, proyectar, type Cuenta, type Rotulo } from './placa';
import { CORAL, ease, logLerp, SEGURO, TU, V } from './comun';
import { cerebro } from './punto';
import type { Escena, Frame, Instancia } from './tipos';
import gusano from '../src/datos/gusano.json';

/**
 * Act I · matter that thinks (moments 3–6). One neuron, which only fires or does not. A whole worm,
 * with each of its 302 neurons where it really is (kept short). A memory, the long shot of the act:
 * the camera rides behind one signal through a forest of lights, the path gets wider every time
 * something goes along it, and in the end touching one tip lights all of it. And the whole storm of
 * a brain, where nobody is in charge; from far enough, the storm is a point again.
 *
 * Four small worlds round the origin, one inside the next: the neuron shrinks into the worm's
 * head, the net of the memory sits in the worm's nerve ring, and the brain is built round the net.
 * Nothing here is at real scale; the camera turns round `ax` at a distance 10^D.
 */

const CAP = 'I · Materia que piensa';
const LUZ = new THREE.Color(1.0, 0.86, 0.62);

/** One neuron: a body, a crown of branching dendrites and one long axon with its end branches. */
function neurona(seed: number) {
  const b = materiaBuilder(seed);
  const r = b.r;
  const rama: number[] = [];
  const paso = 0.006;
  const d = V();
  const brote = (o: THREE.Vector3, dir: THREE.Vector3, len: number, nivel: number, dist: number, tipo: number, fase: number, radio: number, curva: number) => {
    const p = o.clone();
    const u = dir.clone();
    const n = Math.round(len / paso);
    for (let i = 0; i < n; i++) {
      u.add(d.set(gauss(r), gauss(r), gauss(r)).multiplyScalar(curva)).normalize();
      p.addScaledVector(u, paso);
      const rr = radio * (1 - (0.45 * i) / n);
      for (let k = 0; k < 2; k++) {
        b.push(p.x + gauss(r) * rr, p.y + gauss(r) * rr, p.z + gauss(r) * rr, CORAL, 0.011, 0.9, { kind: dist + i * paso });
        rama.push(tipo, fase);
      }
    }
    if (nivel <= 0) return;
    for (let k = 0; k < 2; k++) {
      const v = u.clone().add(d.set(gauss(r), gauss(r), gauss(r)).multiplyScalar(0.62)).normalize();
      brote(p, v, len * (0.62 + 0.2 * r()), nivel - 1, dist + len, tipo, fase, radio * 0.66, curva);
    }
  };
  // The body.
  for (let i = 0; i < 2600; i++) {
    b.push(gauss(r) * 0.075, gauss(r) * 0.085, gauss(r) * 0.075, CORAL, 0.016, 1.3);
    rama.push(2, 0);
  }
  // Dendrites: one tall one upwards, the rest round the body.
  const dendritas = 7;
  for (let k = 0; k < dendritas; k++) {
    const a = (k / (dendritas - 1)) * Math.PI * 2 + r();
    const dir = k === 0 ? V(0.1, 1, 0) : V(Math.cos(a), 0.15 + 0.5 * r(), Math.sin(a)).normalize();
    brote(V(), dir, k === 0 ? 1.5 : 0.85 + 0.3 * r(), 3, 0.08, 0, r(), 0.022, 0.035);
  }
  // The axon: down and away, nearly straight, ending in a small tree.
  brote(V(), V(0.25, -1, 0.1).normalize(), 3.4, 2, 0.08, 1, 0, 0.012, 0.012);
  return { data: b.data(), rama: new Float32Array(rama) };
}

/** Micrometres to scene units, and the worm's nerve ring at the origin. */
const S = 0.03;
const ANILLO = { x: 3, y: -268, z: 34 };

/**
 * The worm, from the data: every neuron's processes as points (`aKind`: distance from its body),
 * and when each one fires in the wave that a touch on its side sets off (`aNeu.x`, in seconds).
 */
function animal() {
  const b = materiaBuilder(21);
  const r = b.r;
  const N = gusano.neuronas.length;
  // How many synapses away from the touch each neuron is (weak ones do not carry the wave).
  const hondo = new Array<number>(N).fill(-1);
  const nombres = gusano.neuronas.map((n) => n.n);
  let frente = ['ALML', 'ALMR', 'AVM'].map((n) => nombres.indexOf(n)).filter((i) => i >= 0);
  for (const i of frente) hondo[i] = 0;
  for (let h = 1; frente.length; h++) {
    const sig: number[] = [];
    for (const [a, c, w] of gusano.sinapsis) {
      if (w < 3 || hondo[c] >= 0 || !frente.includes(a)) continue;
      hondo[c] = h;
      sig.push(c);
    }
    frente = sig;
  }
  const neu: number[] = [];
  const cuerpos: THREE.Vector3[] = [];
  const lugar = (x: number, y: number, z: number, out: THREE.Vector3) => out.set((y - ANILLO.y) * S, (z - ANILLO.z) * S, (x - ANILLO.x) * S);
  const A = V();
  const B = V();
  gusano.neuronas.forEach((n, i) => {
    const p = n.p;
    const t0 = (hondo[i] >= 0 ? hondo[i] * 0.55 : 3.4 + 2.2 * r()) + 0.3 * r();
    lugar(p[0], p[1], p[2], A);
    cuerpos.push(A.clone());
    b.push(A.x, A.y, A.z, CORAL, 0.075, 1.5);
    neu.push(t0, 1);
    for (let k = 5; k < p.length; k += 5) {
      const q = p[k + 4] * 5;
      if (q < 0) continue;
      lugar(p[q], p[q + 1], p[q + 2], A);
      lugar(p[k], p[k + 1], p[k + 2], B);
      const n = Math.max(1, Math.ceil(A.distanceTo(B) / 0.02));
      for (let j = 0; j < n; j++) {
        const f = (j + r()) / n;
        b.push(A.x + (B.x - A.x) * f, A.y + (B.y - A.y) * f, A.z + (B.z - A.z) * f, CORAL, 0.014, 0.8, { kind: (p[q + 3] + (p[k + 3] - p[q + 3]) * f) * S });
        neu.push(t0, 0);
      }
    }
  });
  return { data: b.data(), neu: new Float32Array(neu), toque: cuerpos[nombres.indexOf('ALML')] ?? V() };
}

/** The net of the memory: lights joined by faint threads, and one chain of them (the path). */
function redRecuerdo() {
  const r0 = materiaBuilder(31);
  const r = r0.r;
  const nodos: THREE.Vector3[] = [];
  while (nodos.length < 300) {
    const p = V(gauss(r) * 1.9, gauss(r) * 0.62, gauss(r) * 0.8);
    if (nodos.every((q) => q.distanceTo(p) > 0.2)) nodos.push(p);
  }
  // The chain: from the left to the right, each time to the nearest light further on.
  const cadena: number[] = [];
  let actual = nodos.reduce((m, p, i) => (Math.abs(p.x + 2.4) + Math.abs(p.y) + Math.abs(p.z) < Math.abs(nodos[m].x + 2.4) + Math.abs(nodos[m].y) + Math.abs(nodos[m].z) ? i : m), 0);
  cadena.push(actual);
  while (cadena.length < 15) {
    let mejor = -1;
    let dm = 1e9;
    nodos.forEach((p, i) => {
      const dx = p.x - nodos[actual].x;
      if (cadena.includes(i) || dx < 0.1) return;
      const dd = nodos[actual].distanceTo(p) + Math.abs(p.z) * 0.35 + Math.abs(p.y) * 0.35;
      if (dd < dm) {
        dm = dd;
        mejor = i;
      }
    });
    if (mejor < 0) break;
    cadena.push(mejor);
    actual = mejor;
  }
  for (const [i, p] of nodos.entries()) if (!cadena.includes(i)) r0.push(p.x, p.y, p.z, CORAL, 0.05, 1);
  for (let i = 0; i < nodos.length; i++)
    for (let j = i + 1; j < nodos.length; j++) {
      const dd = nodos[i].distanceTo(nodos[j]);
      if (dd > 0.46) continue;
      const n = Math.ceil(dd / 0.012);
      for (let k = 1; k < n; k++) {
        const f = k / n;
        r0.push(nodos[i].x + (nodos[j].x - nodos[i].x) * f, nodos[i].y + (nodos[j].y - nodos[i].y) * f, nodos[i].z + (nodos[j].z - nodos[i].z) * f, CORAL, 0.008, 0.3);
      }
    }
  // The path: its points start on the thread and spread as it widens (uK).
  const c = materiaBuilder(32);
  const nodo: number[] = [];
  let largo = 0;
  for (let k = 1; k < cadena.length; k++) largo += nodos[cadena[k - 1]].distanceTo(nodos[cadena[k]]);
  let hecho = 0;
  for (let k = 0; k < cadena.length; k++) {
    const p = nodos[cadena[k]];
    c.push(p.x, p.y, p.z, LUZ, 0.07, 1, { kind: hecho / largo });
    nodo.push(1);
    if (k === cadena.length - 1) break;
    const q = nodos[cadena[k + 1]];
    const dd = p.distanceTo(q);
    const n = Math.ceil(dd / 0.003);
    for (let j = 1; j < n; j++) {
      const f = j / n;
      const x = p.x + (q.x - p.x) * f;
      const y = p.y + (q.y - p.y) * f;
      const z = p.z + (q.z - p.z) * f;
      const w = 0.016;
      c.push(x + gauss(c.r) * w, y + gauss(c.r) * w, z + gauss(c.r) * w, LUZ, 0.008, 0.7, { from: [x, y, z], delay: c.r(), kind: (hecho + dd * f) / largo });
      nodo.push(0);
    }
    hecho += dd;
  }
  return { red: r0.data(), camino: c.data(), nodo: new Float32Array(nodo), medio: nodos[cadena[Math.floor(cadena.length / 2)]].clone(), puntos: cadena.map((i) => nodos[i].clone()), largo };
}

export const acto1: Escena = {
  id: 'acto1',
  nombre: 'Materia que piensa',
  estilos: [{ key: '1', nombre: 'El acto', nota: 'Una neurona, el gusano entero, el viaje de un recuerdo y la tormenta sin nadie al mando.' }],
  montar(stage): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.6;
    stage.bloom.radius = 0.65;
    stage.bloom.threshold = 0.35;

    // ---- 3 · one neuron.
    const NE = neurona(11);
    const una = materia(NE.data, {
      pre: /* glsl */ `attribute vec2 aRama; uniform float uCarga, uDisparo, uLlegan; uniform vec3 uLuz; ${SEGURO}`,
      move: /* glsl */ `
        float axon = step(0.5, aRama.x) * (1.0 - step(1.5, aRama.x));
        float cuerpo = step(1.5, aRama.x);
        // What arrives: fronts that come in along the dendrites.
        float fase = fract(uTime * (0.14 + 0.12 * aRama.y) + aRama.y * 7.0);
        float x = (aKind - (1.0 - fase) * 3.4) / 0.09;
        float llega = exp(-x * x) * (1.0 - axon) * (1.0 - cuerpo) * uLlegan;
        // What leaves: one front down the axon.
        float y = (aKind - uDisparo * 7.5) / 0.3;
        float sale = exp(-y * y) * axon * step(0.001, uDisparo);
        float c = cuerpo * uCarga;
        float pulso = max(max(llega * 0.55, sale), c * c);
        em = mix(em * 0.42, uLuz * (1.5 + 1.0 * cuerpo * uCarga), pulso);
        sz *= 1.0 + 0.8 * pulso;`,
      uniforms: { uCarga: { value: 0 }, uDisparo: { value: 0 }, uLlegan: { value: 1 }, uLuz: { value: LUZ.clone() } },
      extra: { aRama: [NE.rama, 2] },
    });
    root.add(una.points);

    // ---- 4 · the worm.
    const AN = animal();
    const bicho = materia(AN.data, {
      pre: /* glsl */ `attribute vec2 aNeu; uniform float uPulso; uniform vec3 uLuz;`,
      move: /* glsl */ `
        float t = mod(uTime, 7.5) - aNeu.x;
        float ya = step(0.0, t);
        float x = (aKind - t * 8.0) / 0.45;
        float pulso = exp(-x * x) * ya * (1.0 - aNeu.y);
        pulso = max(pulso, aNeu.y * exp(-max(t, 0.0) * 2.2) * ya);
        em = mix(em * 0.5, uLuz * 3.0, pulso * uPulso);
        sz *= 1.0 + 0.9 * pulso * uPulso;`,
      uniforms: { uPulso: { value: 1 }, uLuz: { value: LUZ.clone() } },
      extra: { aNeu: [AN.neu, 2] },
    });
    root.add(bicho.points);

    // ---- 5 · a memory.
    const RE = redRecuerdo();
    const red = materia(RE.red, {
      move: /* glsl */ `em *= 0.7 + 0.3 * sin(uTime * (0.6 + seed * 1.4) + seed * 40.0);`,
    });
    const camino = materia(RE.camino, {
      pre: /* glsl */ `attribute float aNodo; uniform float uPasos, uJunto;`,
      move: /* glsl */ `
        float ancho = clamp(uPasos / 5.0, 0.0, 1.0);
        float x = (aKind - fract(uPasos) * 1.16 + 0.08) / 0.018;
        float pulso = exp(-x * x) * step(0.001, uPasos) * (1.0 - step(4.999, uPasos));
        float late = 0.5 + 0.5 * sin(uTime * 2.6);
        float luz = mix(0.05 + 0.3 * ancho, 0.5 + 0.6 * ancho, aNodo) + 1.6 * pulso + uJunto * (0.3 + 0.9 * late) * mix(0.4, 1.0, aNodo);
        em *= luz;
        sz *= 1.0 + 0.6 * ancho * (1.0 - aNodo) + 0.7 * pulso;`,
      uniforms: { uPasos: { value: 0 }, uJunto: { value: 0 } },
      extra: { aNodo: [RE.nodo, 1] },
    });
    camino.u.uSpread.value = 0.6;
    root.add(red.points, camino.points);

    // ---- 6 · the storm, and the point.
    const ESCALA = 9;
    const tormenta = materia(cerebro(120000, 5, false), {
      sizeUnit: ESCALA,
      pre: /* glsl */ `uniform float uTono; uniform vec3 uTu, uCoral, uLuz; ${SEGURO}`,
      move: /* glsl */ `
        float rayo = pw(0.5 + 0.5 * sin(uTime * (0.9 + 2.6 * seed) + seed * 90.0), 14.0);
        em *= mix(uCoral * 0.55 + uLuz * 3.2 * rayo, uTu, uTono);`,
      uniforms: { uTono: { value: 0 }, uTu: { value: TU.clone() }, uCoral: { value: CORAL.clone() }, uLuz: { value: LUZ.clone() } },
    });
    tormenta.points.scale.setScalar(ESCALA);
    tormenta.points.rotation.y = 0.9;
    root.add(tormenta.points);
    const uno = materiaBuilder(1);
    uno.push(0, 0, 0, TU.clone(), 0.02, 1);
    const tu = materia(uno.data());
    tu.u.uFuente.value = 1;
    root.add(tu.points);

    const tl = new Timeline();
    // D: log10 of the camera's distance to `ax`; az, el: where it looks from; neu, gus, red, cer: each
    // world's light; sn: log10 of the neuron's size; carga, disp: the neuron; pasos, junto: the memory.
    tl.set({ D: -0.25, az: 0.35, el: 0.12, ax: 0, ay: 0, neu: 1, sn: 0, carga: 0, disp: 0, gus: 0, red: 0, pasos: 0, junto: 0, cer: 0, tu: 0, n1: 0, n2: 0, n3: 0, n4: 0, via: 0 });
    tl.label('neurona').caption(6.6, 'Una neurona', 'Mira una sola. Le llegan señales. Si juntan lo suficiente, dispara; si no, calla. No sabe hacer nada más.');
    tl.to(1.7, { D: 0.72, az: 0.62, ay: 0.2 });
    tl.with(0.5, { n1: 1 });
    tl.to(1.1, { carga: 0.55, az: 0.72 });
    tl.with(0.5, { n1: 0 });
    tl.to(0.8, { carga: 0.1, az: 0.8 });
    tl.with(0.6, { n2: 1 });
    tl.to(1.1, { carga: 1, az: 0.9, ay: -0.4 });
    tl.with(1.5, { disp: 1 });
    tl.with(0.5, { carga: 0 });
    tl.to(1.5, { az: 1.02, ay: -0.9, D: 0.8 });
    tl.label('gusano').caption(7.2, 'Trescientas dos', 'Con 302 de esas, este gusano busca comida, huye y aprende. Fue el primer animal al que ustedes le dibujaron cada conexión. A mano. Tardaron más de diez años.');
    tl.with(0.5, { n2: 0 });
    tl.with(1.5, { sn: -1.9 });
    tl.with(2.0, { neu: 0 });
    tl.to(1.6, { D: 0.85, az: 0.5, el: 0.2, ay: 0, gus: 1 });
    tl.to(2.4, { D: 1.37, ax: 8.4, az: 0.16, el: 0.3 });
    tl.with(0.8, { n3: 1 });
    tl.to(2.4, { az: -0.1 });
    tl.with(0.8, { n3: 0 });
    tl.to(0.8, { az: -0.16 });
    // The long shot: behind one signal, from light to light, along a path that is still thin.
    tl.label('recuerdo').caption(7.0, 'Un recuerdo', 'Sigue esa señal. Por donde pasa deja huella: el camino queda un poco más fácil.');
    tl.with(2.4, { gus: 0 });
    tl.to(1.2, { D: 0.9, ax: 0, az: 0.3, el: 0.2 });
    tl.with(1.2, { red: 1 });
    tl.to(1.4, { via: 1, pasos: 0.07 });
    tl.to(4.4, { pasos: 0.5 });
    tl.label('camino').caption(5.4, 'De neurona en neurona', 'Ninguna de estas luces sabe qué lleva. La recibe y la pasa.');
    tl.to(3.8, { pasos: 0.88 });
    tl.with(1.8, { via: 0 });
    tl.to(1.8, { pasos: 1.0, D: 0.6, az: 0.5, el: 0.3, ax: RE.medio.x, ay: RE.medio.y });
    tl.label('engorda').caption(6.4, 'El camino engorda', 'Otra vez. Y otra. Así se te quedó una cara, una calle, una voz.');
    tl.to(2.6, { pasos: 2, az: 0.68 });
    tl.to(2.0, { pasos: 3, az: 0.82 });
    tl.to(1.8, { pasos: 5, az: 0.95, D: 0.58 });
    tl.label('juntas').caption(5.8, 'Siempre juntas', 'Ahora basta tocar una punta para que se encienda entero. Cada recuerdo tuyo es un camino así. También el de quien ya no está.');
    tl.with(0.8, { n4: 1 });
    tl.to(1.8, { az: 1.03 });
    tl.with(0.8, { n4: 0 });
    tl.to(1.2, { junto: 1, az: 1.09 });
    tl.to(2.8, { az: 1.22, D: 0.66 });
    tl.label('nadie').caption(6.6, 'Nadie al mando', 'Todas a la vez. Todo lo que has querido y todo lo que te ha dolido pasó aquí. Y nadie lo dirigía.');
    tl.with(1.6, { red: 0, junto: 0 });
    tl.to(2.4, { D: 1.55, cer: 1, az: 1.6, el: 0.22, ax: 0, ay: 0 });
    tl.to(4.2, { az: 2.1 });
    tl.label('punto').caption(3.4, 'Un punto', 'Y aun así, desde lejos, toda esa tormenta eres tú.');
    tl.to(2.4, { D: 3.3, tu: 1, az: 2.25 });
    tl.wait(1.0);

    const tramo = (a: number, b: number, p: number, m = 0.5) => ease(a, a + m, p) * (1 - ease(b - m, b, p));
    const pos = V();
    const at = V();
    const scr = { x: 0, y: 0, z: 0 };
    const cuerpo = V();
    // Where the signal is on the path, by how much of its length is behind it.
    const PT = RE.puntos;
    const tramos = PT.slice(1).map((q, i) => q.distanceTo(PT[i]));
    const enCamino = (v: number, out: THREE.Vector3) => {
      let x = Math.min(1, Math.max(0, v)) * RE.largo;
      let i = 0;
      while (i < tramos.length - 1 && x > tramos[i]) x -= tramos[i++];
      return out.copy(PT[i]).lerp(PT[i + 1], Math.min(1, x / tramos[i]));
    };
    const HB = V();
    const A = V();
    const B = V();
    const dir = V();
    const lado = V();
    const posR = V();
    const atR = V();
    const ARRIBA = V(0, 1, 0);

    return {
      tl,
      luzEntrada: CORAL.clone().lerp(LUZ, 0.5),
      luzSalida: TU.clone(),
      cuenta(p): Cuenta | null {
        const g0 = tl.at('gusano') + 2.2;
        const n0 = tl.at('nadie') + 1.2;
        const a1 = tramo(g0, n0 - 0.4, p);
        if (a1 > 0.01) return { pisos: ['7 000'], linea: 'conexiones · un gusano', h: 3.85, a: a1 };
        const a2 = ease(n0, n0 + 0.6, p);
        return a2 > 0.01 ? { pisos: ['10', '14'], linea: 'conexiones · tú', h: 14.5, a: a2 } : null;
      },
      rotulo(p): Rotulo | null {
        const c = tl.captionAt(p);
        return c ? { capitulo: CAP, name: c.name, fact: c.fact } : null;
      },
      placa(g, f) {
        const n1 = tl.get('n1', f.p);
        const n2 = tl.get('n2', f.p);
        if (n1 > 0.02 || n2 > 0.02) {
          proyectar(cuerpo.set(0, 0, 0), camera, f.W, f.H, scr);
          if (n1 > 0.02) nota(g, f.u, scr.x, scr.y, 'no alcanza: calla', 70, -50, n1);
          if (n2 > 0.02) nota(g, f.u, scr.x, scr.y, 'alcanza: dispara', 70, -50, n2);
        }
        const n3 = tl.get('n3', f.p);
        if (n3 > 0.02) {
          proyectar(AN.toque, camera, f.W, f.H, scr);
          nota(g, f.u, scr.x, scr.y, 'un roce aquí, y la señal corre por todo el cuerpo', 40, -70, n3);
        }
        const pasos = tl.get('pasos', f.p);
        const junto = tl.get('junto', f.p);
        const a = ease(0.05, 0.4, pasos) * tl.get('red', f.p);
        if (a > 0.02) {
          proyectar(RE.medio, camera, f.W, f.H, scr);
          nota(g, f.u, scr.x, scr.y, junto > 0.5 ? 'un recuerdo' : `vez ${Math.min(5, Math.floor(pasos) + 1)}`, 50, -80, a * (1 - ease(0, 0.4, tl.get('via', f.p))));
        }
        const n4 = tl.get('n4', f.p);
        if (n4 > 0.02) {
          proyectar(PT[0], camera, f.W, f.H, scr);
          nota(g, f.u, scr.x, scr.y, 'basta tocar aquí', -50, -70, n4);
        }
      },
      update(f: Frame) {
        const p = f.p;
        camera.near = 0.01;
        camera.far = 20000;
        camera.fov = 40;
        const D = Math.pow(10, tl.get('D', p));
        const az = tl.get('az', p) + f.time * 0.008;
        const el = tl.get('el', p);
        at.set(tl.get('ax', p), tl.get('ay', p), 0);
        pos.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(D).add(at);
        // The ride: behind the signal and a little above, looking where the path goes. The direction
        // is the mean over a long stretch, so the camera bends before a light and not on it.
        const via = ease(0, 1, tl.get('via', p));
        if (via > 0) {
          const v = Math.min(tl.get('pasos', p), 0.999) * 1.16 - 0.08;
          enCamino(v, HB);
          dir.set(0, 0, 0);
          for (let k = 1; k <= 5; k++) dir.add(enCamino(v + 0.035 * k, A)).sub(enCamino(v - 0.035 * k, B));
          dir.normalize();
          lado.crossVectors(dir, ARRIBA).normalize();
          posR.copy(HB).addScaledVector(dir, -0.62).addScaledVector(ARRIBA, 0.2).addScaledVector(lado, 0.14);
          atR.copy(HB).addScaledVector(dir, 0.3);
          pos.lerp(posR, via);
          at.lerp(atR, via);
        }
        camera.position.copy(pos);
        camera.up.set(0, 1, 0);
        camera.lookAt(at);

        const neu = tl.get('neu', p);
        una.points.visible = neu > 0.001;
        una.points.scale.setScalar(Math.pow(10, tl.get('sn', p)));
        enfocar(una, f.focal, f.dpr, f.time);
        una.u.uSizeUnit.value = una.points.scale.x;
        una.u.uMaxPx.value = 9 * f.dpr;
        // Close up the body fills the screen: hold its light.
        una.u.uGain.value = neu * (0.16 + 0.5 * ease(-0.4, 0.5, tl.get('D', p)));
        una.u.uCarga.value = tl.get('carga', p);
        una.u.uDisparo.value = tl.get('disp', p);

        const gus = tl.get('gus', p);
        bicho.points.visible = gus > 0.001;
        enfocar(bicho, f.focal, f.dpr, f.time);
        bicho.u.uMaxPx.value = 12 * f.dpr;
        bicho.u.uGain.value = gus * 0.75;

        const r = tl.get('red', p);
        red.points.visible = camino.points.visible = r > 0.001;
        enfocar(red, f.focal, f.dpr, f.time);
        red.u.uMaxPx.value = 14 * f.dpr;
        red.u.uGain.value = r * (0.8 - 0.45 * tl.get('junto', p));
        enfocar(camino, f.focal, f.dpr, f.time);
        const cerca = ease(0, 1, tl.get('via', p));
        camino.u.uMaxPx.value = (18 - 9 * cerca) * f.dpr;
        camino.u.uGain.value = r * (1 - 0.5 * cerca);
        camino.u.uPasos.value = tl.get('pasos', p);
        camino.u.uJunto.value = tl.get('junto', p);
        camino.u.uK.value = Math.min(1, tl.get('pasos', p) / 5);

        const cer = tl.get('cer', p);
        const t = tl.get('tu', p);
        tormenta.points.visible = cer > 0.001;
        enfocar(tormenta, f.focal, f.dpr, f.time);
        tormenta.u.uMaxPx.value = 6 * f.dpr;
        tormenta.u.uTono.value = ease(0.15, 0.7, t);
        tormenta.u.uGain.value = cer * logLerp(0.11, 0.9, ease(1.6, 2.6, tl.get('D', p))) * (1 - ease(0.55, 1, t));
        enfocar(tu, f.focal, f.dpr, f.time);
        tu.u.uMinPx.value = 4.5 * f.dpr;
        tu.u.uGain.value = 2.6 * ease(0.5, 1, t);
      },
      dispose() {},
    };
  },
};
