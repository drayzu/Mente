import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder } from '../src/engine/materia';
import { gauss } from '../src/engine/math';
import type { Cuenta, Rotulo } from './placa';
import { MAQUINA, ORO3, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Study · other minds (act VI, moment 28). A mind does not have to look like a brain: a swarm with
 * no centre, a crystal that is the same at every point, one alone, huge and slow.
 *
 * Every point knows its place in the three shapes. In two of the ways a point belongs to one shape
 * and stays in it; in the other, the same matter goes from one shape to the next.
 */

const CAP = 'VI · Otras mentes';
const POR = 34000;
const VIOLETA = new THREE.Color(0.74, 0.62, 1.0);

export const otras: Escena = {
  id: 'otras',
  nombre: 'Otras mentes',
  estilos: [
    { key: '1', nombre: 'En fila', nota: 'La cámara pasa despacio junto a cada una: el enjambre, el cristal y, al fondo, la gigante.' },
    { key: '2', nombre: 'Una se vuelve otra', nota: 'La misma materia cambia de forma: el enjambre se ordena en cristal y el cristal se abre en la gigante.' },
    { key: '3', nombre: 'Las tres a la vez', nota: 'Las tres juntas, y la cámara gira alrededor. Se enciende la que se nombra.' },
  ],
  montar(stage, estilo): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.5;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = 0.42;

    const N = POR * 3;
    const b = materiaBuilder(61);
    const r = b.r;
    const enB = new Float32Array(N * 3);
    const enC = new Float32Array(N * 3);
    const mia = new Float32Array(N);
    const luzB = new Float32Array(N);

    // The crystal: the nodes of a grid inside an octahedron, and the edges between them.
    const PASO = 0.24;
    const nodos: number[] = [];
    for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) for (let k = -5; k <= 5; k++) if (Math.abs(i) + Math.abs(j) + Math.abs(k) <= 5) nodos.push(i, j, k);
    const M = nodos.length / 3;

    for (let i = 0; i < N; i++) {
      // The swarm: a long sheet of points, bent; the shader makes it flow.
      const x = gauss(r) * 1.25;
      const z = gauss(r) * 0.8;
      const y = gauss(r) * 0.16 + 0.28 * Math.sin(x * 1.8) * Math.cos(z * 1.4);
      b.push(x, y, z, new THREE.Color(1, 1, 1), 0.012, 1, { delay: r() });
      mia[i] = i % 3;

      const n = Math.floor(r() * M) * 3;
      let cx = nodos[n];
      let cy = nodos[n + 1];
      let cz = nodos[n + 2];
      if (r() < 0.3) {
        luzB[i] = 1.5;
        const q = 0.012;
        enB[i * 3] = (cx + gauss(r) * q) * PASO;
        enB[i * 3 + 1] = (cy + gauss(r) * q) * PASO;
        enB[i * 3 + 2] = (cz + gauss(r) * q) * PASO;
      } else {
        luzB[i] = 0.3;
        const eje = Math.floor(r() * 3);
        const t = r();
        const s = (eje === 0 ? cx : eje === 1 ? cy : cz) >= 0 ? -1 : 1;
        if (eje === 0) cx += s * t;
        else if (eje === 1) cy += s * t;
        else cz += s * t;
        enB[i * 3] = cx * PASO;
        enB[i * 3 + 1] = cy * PASO;
        enB[i * 3 + 2] = cz * PASO;
      }

      // The giant: one ball
      const [sx, sy, sz] = b.onSphere();
      // …in three shells, one inside another.
      const capa = r();
      const rad = (capa < 0.55 ? 1 : capa < 0.85 ? 0.7 : 0.42) * (1 - 0.04 * r());
      enC[i * 3] = sx * rad;
      enC[i * 3 + 1] = sy * rad;
      enC[i * 3 + 2] = sz * rad;
    }

    // Where each one is, and how big.
    const centros = [V(), V(), V()];
    const escalas = new THREE.Vector3(1, 1, 1);
    if (estilo === 0) {
      centros[1].set(5, 0, -1);
      centros[2].set(15, 0, -7);
      escalas.z = 5;
    } else if (estilo === 2) {
      centros[0].set(-1.9, -0.2, 1.1);
      centros[1].set(1.9, -0.2, 1.1);
      centros[2].set(0, 0.4, -2.6);
      escalas.z = 2.1;
    } else escalas.z = 2.3;

    const nube = materia(b.data(), {
      pre: /* glsl */ `
        attribute vec3 aB, aC;
        attribute float aMia, aLuzB;
        uniform float uForma, uMisma, uFoco, uAtenua;
        uniform vec3 uCen[3];
        uniform vec3 uEsc, uLuz, uColA, uColB, uColC;`,
      move: /* glsl */ `
        float f = mix(aMia, clamp(uForma * 1.3 - aDelay * 0.3, 0.0, 2.0), uMisma);
        float wA = 1.0 - smoothstep(0.0, 1.0, f);
        float wC = smoothstep(1.0, 2.0, f);
        float wB = 1.0 - wA - wC;
        // The swarm flows: sheets that bend and cross, and no one leads.
        vec3 a = position;
        a += 0.3 * vec3(sin(uTime * 0.6 + a.y * 2.2 + a.z * 1.6), sin(uTime * 0.5 + a.z * 2.0 + a.x * 1.7), sin(uTime * 0.7 + a.x * 2.3 + a.y * 1.2));
        a += 0.02 * vec3(sin(uTime * 3.0 + seed * 90.0), sin(uTime * 2.6 + seed * 50.0), sin(uTime * 3.4 + seed * 70.0));
        // The giant turns, slowly.
        float g = uTime * 0.03;
        vec3 c = vec3(aC.x * cos(g) + aC.z * sin(g), aC.y, aC.z * cos(g) - aC.x * sin(g));
        vec3 cen = mix(aMia < 0.5 ? uCen[0] : aMia < 1.5 ? uCen[1] : uCen[2], vec3(0.0), uMisma);
        p = a * uEsc.x * wA + aB * uEsc.y * wB + c * uEsc.z * wC + cen;
        // The crystal thinks in planes: a sheet of light crosses it, always the same.
        float plano = dot(aB, normalize(vec3(1.0, 0.7, 0.4))) - 1.1 * sin(uTime * 0.45);
        float lB = aLuzB * (0.45 + 1.6 * exp(-plano * plano * 30.0));
        // The giant, in one slow wave from pole to pole.
        float onda = 0.5 + 0.5 * sin(aC.y * 5.0 + 2.0 * sin(aC.x * 2.0 + g * 3.0) - uTime * 0.16);
        float lC = 0.3 + 2.4 * onda * onda * onda;
        float lA = 0.75 + 0.35 * sin(uTime * (1.0 + seed * 2.0) + seed * 40.0);
        em = uColA * lA * wA * uLuz.x + uColB * lB * wB * uLuz.y + uColC * lC * wC * uLuz.z;
        sz *= 1.0 + 0.8 * wC * (uEsc.z - 1.0) * 0.3;
        float mio = 1.0 - clamp(abs(aMia - uFoco), 0.0, 1.0);
        em *= mix(1.0, 0.22 + 0.78 * mio, uAtenua);`,
      uniforms: {
        uForma: { value: 0 },
        uMisma: { value: estilo === 1 ? 1 : 0 },
        uFoco: { value: 0 },
        uAtenua: { value: estilo === 2 ? 1 : 0 },
        uCen: { value: centros },
        uEsc: { value: escalas },
        uLuz: { value: estilo === 1 ? new THREE.Vector3(0.12, 0.4, 0.8) : new THREE.Vector3(0.3, 1, 2.4) },
        uColA: { value: ORO3.clone() },
        uColB: { value: MAQUINA.clone() },
        uColC: { value: VIOLETA.clone() },
      },
      extra: { aB: [enB, 3], aC: [enC, 3], aMia: [mia, 1], aLuzB: [luzB, 1] },
    });
    root.add(nube.points);

    const tl = new Timeline();
    const ENJ = 'Una mente no tiene por qué parecerse a ti. Puede ser un enjambre: millones de partes y ningún centro.';
    const CRI = 'O un cristal: quieto, exacto, el mismo en cada punto.';
    const UNA = 'O una sola, enorme y lenta, que tarda un siglo en terminar una idea.';
    // c*: where the camera is; a*: where it looks; forma: 0 swarm, 1 crystal, 2 giant.
    if (estilo === 0) {
      tl.set({ cx: -0.9, cy: 0.35, cz: 3.4, ax: 0, ay: 0, az: 0, forma: 0 });
      tl.label('enjambre').caption(3.4, 'Un enjambre', ENJ);
      tl.to(3.4, { cx: 1.1, cy: 0.2, cz: 2.7, ax: 0.3 });
      tl.label('cristal').caption(3.6, 'Un cristal', CRI);
      tl.with(1.8, { forma: 1 });
      tl.to(1.8, { cx: 3.6, cy: 0.5, cz: 2.4, ax: 5, az: -1 });
      tl.to(1.8, { cx: 6.1, cy: 0.25, cz: 1.5 });
      tl.label('una').caption(4.6, 'Una sola', UNA);
      tl.with(2.2, { forma: 2 });
      tl.to(2.2, { cx: 8.6, cy: 0.6, cz: 3.2, ax: 15, ay: 0.5, az: -7 });
      tl.to(2.4, { cx: 10.8, cy: 1.4, cz: 1.2, ay: 1.5 });
    } else if (estilo === 1) {
      tl.set({ cx: 0.6, cy: 0.4, cz: 3.4, ax: 0, ay: 0, az: 0, forma: 0 });
      tl.label('enjambre').caption(3.2, 'Un enjambre', ENJ);
      tl.to(3.2, { cx: 1.4, cz: 3.0 });
      tl.label('cristal').caption(3.8, 'Un cristal', CRI);
      tl.with(2.0, { forma: 1 });
      tl.to(3.8, { cx: 2.4, cy: 0.8, cz: 2.6 });
      tl.label('una').caption(4.6, 'Una sola', UNA);
      tl.with(2.4, { forma: 2 });
      tl.to(4.6, { cx: 4.2, cy: 1.2, cz: 6.4 });
    } else {
      tl.set({ cx: -2.2, cy: 0.9, cz: 5.6, ax: 0, ay: 0, az: -0.4, forma: 0 });
      tl.label('enjambre').caption(3.2, 'Un enjambre', ENJ);
      tl.to(3.2, { cx: -1.2, cz: 5.2 });
      tl.label('cristal').caption(3.4, 'Un cristal', CRI);
      tl.with(0.8, { forma: 1 });
      tl.to(3.4, { cx: 1.6, cy: 0.8, cz: 5.2 });
      tl.label('una').caption(4.4, 'Una sola', UNA);
      tl.with(0.8, { forma: 2 });
      tl.to(4.4, { cx: 2.8, cy: 1.5, cz: 6.4, az: -1.2 });
    }

    const pos = V();
    const at = V();

    return {
      tl,
      // Past the horizon nobody can count.
      cuenta: (): Cuenta => ({ pisos: ['?'], linea: 'conexiones · nadie lo sabe', h: 27 }),
      rotulo(p): Rotulo | null {
        const cp = tl.captionAt(p);
        return cp ? { capitulo: CAP, name: cp.name, fact: cp.fact } : null;
      },
      update(f: Frame) {
        const p = f.p;
        camera.near = 0.02;
        camera.far = 400;
        camera.fov = 46;
        pos.set(tl.get('cx', p), tl.get('cy', p), tl.get('cz', p));
        at.set(tl.get('ax', p), tl.get('ay', p), tl.get('az', p));
        camera.position.copy(pos);
        camera.up.set(0, 1, 0);
        camera.lookAt(at);

        const forma = tl.get('forma', p);
        enfocar(nube, f.focal, f.dpr, f.time);
        nube.u.uMaxPx.value = 7 * f.dpr;
        nube.u.uGain.value = 0.5;
        nube.u.uForma.value = forma;
        nube.u.uFoco.value = forma;
        nube.u.uFog.value = estilo === 0 ? 30 : 0;
      },
      dispose() {},
    };
  },
};
