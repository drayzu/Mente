import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder } from '../src/engine/materia';
import { nota, proyectar, type Cuenta, type Rotulo } from './placa';
import { CORAL, ease, ORO3, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Study · the range of error (act II, moment 8). Every way of wiring a network has an error; all
 * of them together are a landscape, high where it is wrong and low where it is right. Learning is
 * going down it: a ball of light that never sees the map, only which way the ground falls.
 *
 * The landscape is a function (a slope, a winding valley, ridges that grow with height) and the
 * ball's path is a true descent over it (gradient with momentum), run once when the scene mounts.
 */

const CAP = 'II · Aprender';
export const LZ = 130;

export const valle = (z: number) => 5 * Math.sin(z * 0.06) + 2.5 * Math.sin(z * 0.17 + 1.3);
/** The error at (x, z): z = 0 is the start, z = −LZ the bottom. */
export function altura(x: number, z: number) {
  const t = Math.min(1.15, Math.max(0, (z + LZ) / LZ));
  const base = 16 * Math.pow(t, 1.3) + (z < -LZ ? 0.004 * (z + LZ) * (z + LZ) : 0);
  const dx = x - valle(z);
  const pared = 1 - Math.exp(-(dx * dx) / (3.2 * 3.2));
  const cresta =
    1.6 * Math.abs(Math.sin(0.23 * x + 1.7 * Math.sin(0.11 * z)) * Math.sin(0.19 * z + 1.3 * Math.sin(0.17 * x))) +
    0.5 * Math.sin(0.9 * x + 0.6 * z) * Math.sin(0.7 * z - 0.4 * x) +
    0.2 * Math.sin(2.1 * x) * Math.sin(1.9 * z) +
    0.7;
  return base + (0.35 + 0.65 * t) * 2.2 * cresta * pared + Math.min(0.03 * dx * dx, 6);
}

/** The descent: gradient with momentum from a flank near the top, resampled evenly along its length. */
export function descenso(n: number) {
  const pts: number[] = [];
  let x = valle(0) + 4.5;
  let z = 0;
  let vx = 0;
  let vz = 0;
  const e = 0.01;
  for (let i = 0; i < 9000 && z > -LZ + 1.5; i++) {
    const gx = (altura(x + e, z) - altura(x - e, z)) / (2 * e);
    const gz = (altura(x, z + e) - altura(x, z - e)) / (2 * e);
    vx = 0.93 * vx - 0.012 * gx;
    vz = 0.93 * vz - 0.012 * gz;
    // A floor on the pace, so the flat end still arrives.
    vz = Math.min(vz, -0.012);
    x += vx;
    z += vz;
    pts.push(x, altura(x, z), z);
  }
  const m = pts.length / 3;
  const largo = new Float32Array(m);
  for (let i = 1; i < m; i++) largo[i] = largo[i - 1] + Math.hypot(pts[i * 3] - pts[i * 3 - 3], pts[i * 3 + 1] - pts[i * 3 - 2], pts[i * 3 + 2] - pts[i * 3 - 1]);
  const out = new Float32Array(n * 3);
  let j = 0;
  for (let i = 0; i < n; i++) {
    const s = (i / (n - 1)) * largo[m - 1];
    while (j < m - 2 && largo[j + 1] < s) j++;
    const f = (s - largo[j]) / Math.max(largo[j + 1] - largo[j], 1e-9);
    for (let k = 0; k < 3; k++) out[i * 3 + k] = pts[j * 3 + k] + (pts[j * 3 + 3 + k] - pts[j * 3 + k]) * f;
  }
  return out;
}

export const cordillera: Escena = {
  id: 'cordillera',
  nombre: 'La cordillera del error',
  estilos: [
    { key: '1', nombre: 'Polvo', nota: 'El paisaje es polvo de luz: millones de granos, coral arriba y dorados abajo.' },
    { key: '2', nombre: 'Curvas de nivel', nota: 'Solo se ven las curvas de nivel, como un mapa que brilla.' },
    { key: '3', nombre: 'Crestas', nota: 'Líneas de luz que cruzan el paisaje, una tras otra, y dibujan cada cresta.' },
  ],
  montar(stage, estilo): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.5;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = 0.4;

    const M = 1600;
    const camino = descenso(M);
    const en = (s: number, out: THREE.Vector3) => {
      const q = Math.min(M - 1.001, Math.max(0, s * (M - 1)));
      const i = Math.floor(q);
      const f = q - i;
      return out.set(camino[i * 3] + (camino[i * 3 + 3] - camino[i * 3]) * f, camino[i * 3 + 1] + (camino[i * 3 + 4] - camino[i * 3 + 1]) * f, camino[i * 3 + 2] + (camino[i * 3 + 5] - camino[i * 3 + 2]) * f);
    };
    const H0 = camino[1];

    const tl = new Timeline();
    // s: how far down the path the ball is; alto: 1 the view from above, 0 riding behind the ball.
    tl.set({ s: 0, alto: 1, gira: 0 });
    tl.label('error').caption(3.2, 'El error', 'Cada forma de conectar la red tiene un error. Juntas son un paisaje: arriba se equivoca mucho, abajo casi nada.');
    tl.to(3.2, { gira: 1, s: 0.01 });
    tl.label('bajar').caption(5.6, 'Bajar', 'Aprender es bajar. No ve el mapa: solo siente hacia dónde cae el suelo, y da un paso.');
    tl.to(1.4, { alto: 0, s: 0.06 });
    tl.to(4.2, { s: 0.9 });
    tl.label('valle').caption(3.2, 'El valle', 'Nadie le dijo cómo. Abajo, la red sabe algo que arriba no sabía.');
    tl.to(3.2, { s: 1, alto: 0.25 });

    // The ground.
    const b = materiaBuilder(31);
    const r = b.r;
    const c = new THREE.Color();
    const X = 36;
    const Z0 = 14;
    const Z1 = -LZ - 26;
    const grano = (x: number, z: number, luz: number, s: number) => {
      const h = altura(x, z);
      c.copy(ORO3).lerp(CORAL, Math.min(1, h / 17));
      b.push(x, h, z, c, s, luz);
    };
    if (estilo === 0) {
      // Half of the dust lies near the valley, where the ride passes close.
      for (let i = 0; i < 340000; i++) {
        const z = Z0 + r() * (Z1 - Z0);
        const x = i % 2 ? (r() * 2 - 1) * X : valle(z) + (r() + r() + r() - 1.5) * 9;
        grano(x, z, i % 2 ? 0.5 : 0.28, 0.05);
      }
    } else if (estilo === 1) {
      for (let i = 0; i < 5000000 && b.count < 280000; i++) {
        const x = (r() * 2 - 1) * X;
        const z = Z0 + r() * (Z1 - Z0);
        const f = altura(x, z) * 1.5;
        if (f - Math.floor(f) < 0.05) grano(x, z, 0.7, 0.05);
      }
    } else {
      for (let z = Z0; z > Z1; z -= 0.55) for (let x = -X; x < X; x += 0.075) grano(x + (r() - 0.5) * 0.03, z, 0.55, 0.045);
    }
    const suelo = materia(b.data());
    suelo.u.uFog.value = estilo === 1 ? 30 : 46;
    root.add(suelo.points);

    // The path already walked, and the ball.
    const t = materiaBuilder(7);
    for (let i = 0; i < M; i++) t.push(camino[i * 3], camino[i * 3 + 1] + 0.04, camino[i * 3 + 2], ORO3, 0.07, 1.3, { kind: i / (M - 1) });
    const rastro = materia(t.data(), {
      pre: /* glsl */ `uniform float uS;`,
      move: /* glsl */ `
        float atras = uS - aKind;
        em *= atras > 0.0 ? exp(-atras * 9.0) : 0.0;
        fuente = 1.0;`,
      uniforms: { uS: { value: 0 } },
    });
    rastro.u.uFog.value = 60;
    root.add(rastro.points);
    const uno = materiaBuilder(2);
    uno.push(0, 0, 0, new THREE.Color(1, 0.93, 0.78), 0.3, 1);
    const bola = materia(uno.data());
    bola.u.uFuente.value = 1;
    root.add(bola.points);

    const B = V();
    const pos = V();
    const at = V();
    const arriba = V();
    const centro = V();
    const scr = { x: 0, y: 0, z: 0 };

    return {
      tl,
      cuenta: (): Cuenta => ({ pisos: ['10', '8'], linea: 'conexiones · una red que aprende', h: 8 }),
      rotulo(p): Rotulo | null {
        const cp = tl.captionAt(p);
        return cp ? { capitulo: CAP, name: cp.name, fact: cp.fact } : null;
      },
      placa(g, f) {
        // The error where the ball is, written beside it.
        proyectar(B, camera, f.W, f.H, scr);
        if (scr.z > 1 || scr.x < 0 || scr.x > f.W) return;
        const e = Math.max(0, B.y / H0);
        nota(g, f.u, scr.x, scr.y, `error ${e.toFixed(2).replace('.', ',')}`, 46, -40, 0.9);
      },
      update(f: Frame) {
        const p = f.p;
        camera.near = 0.02;
        camera.far = 600;
        camera.fov = 52;
        const s = tl.get('s', p);
        const alto = tl.get('alto', p);
        en(s, B);
        B.y += 0.16;
        bola.points.position.copy(B);

        // Riding: a little behind and above the ball, looking where it goes.
        en(s - 0.016, pos);
        pos.y = Math.max(pos.y, altura(pos.x, pos.z)) + 0.75;
        en(s + 0.03, at);
        at.y += 0.1;
        // From above: the whole range, turning slowly.
        const g = 0.5 + 0.35 * tl.get('gira', p);
        arriba.set(valle(0) + 30 * Math.sin(g), H0 + 15, 16 + 12 * Math.cos(g));
        centro.set(0, 7, -52);
        const k = ease(0, 1, alto);
        pos.lerp(arriba, k);
        at.lerp(centro, k);
        camera.position.copy(pos);
        camera.up.set(0, 1, 0);
        camera.lookAt(at);

        enfocar(suelo, f.focal, f.dpr, f.time);
        suelo.u.uMinPx.value = (1.6 + 0.8 * k) * f.dpr;
        suelo.u.uMaxPx.value = 7 * f.dpr;
        suelo.u.uGain.value = (estilo === 1 ? 0.6 : 1.0) * (1.0 + 2.4 * k);
        enfocar(rastro, f.focal, f.dpr, f.time);
        rastro.u.uS.value = s;
        rastro.u.uMaxPx.value = 12 * f.dpr;
        enfocar(bola, f.focal, f.dpr, f.time);
        bola.u.uMinPx.value = 5 * f.dpr;
        bola.u.uMaxPx.value = 46 * f.dpr;
        bola.u.uGain.value = 2.4;
      },
      dispose() {},
    };
  },
};
