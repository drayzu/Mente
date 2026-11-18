import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder, type Nube } from '../src/engine/materia';
import { pantalla } from '../src/engine/pantalla';
import { rng } from '../src/engine/math';
import type { Cuenta, Rotulo } from './placa';
import { ease, MAQUINA, ORO3, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Study · the explosion and the horizon (act V, moments 21–26). A mind that can improve its own
 * design: every light of its net opens into a whole net, and again, each turn shorter than the
 * last. Then an edge ahead, like a black hole's: what follows cannot be seen from here.
 *
 * The world is one net of N lights repeated inside itself: every light is the same net, S times
 * smaller. The camera falls towards the one point that stays put under that shrinking (the world's
 * origin, so the deep levels keep their precision), and the world is scaled up instead of the
 * camera moving in. Only what the fall can see exists: around each net on the way, three
 * generations of lights.
 */

const CAP = 'V · La singularidad';
const N = 30;
const S = 1 / 8;
const NIVELES = 9;

export const singularidad: Escena = {
  id: 'singularidad',
  nombre: 'La explosión y el horizonte',
  estilos: [
    { key: '1', nombre: 'Redes dentro de redes', nota: 'Cada luz es una red con sus hilos. Al acercarte a una, adentro hay otra red entera.' },
    { key: '2', nombre: 'Solo luces', nota: 'Sin hilos: cada luz resulta ser un cúmulo de luces, como galaxias dentro de galaxias.' },
    { key: '3', nombre: 'Florecer', nota: 'Cada luz se abre de golpe cuando llegas: la red sale de adentro del punto.' },
  ],
  montar(stage, estilo): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.6;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = 0.38;

    // One net: N places in a ball, none too near another; each joined to its two nearest.
    const r = rng(17);
    const red: number[] = [];
    while (red.length < N * 3) {
      const x = r() * 2 - 1;
      const y = r() * 2 - 1;
      const z = r() * 2 - 1;
      const q = x * x + y * y + z * z;
      if (q > 1 || (red.length === 0 && (q < 0.16 || q > 0.36))) continue;
      let libre = true;
      for (let i = 0; i < red.length; i += 3) if (Math.hypot(red[i] - x, red[i + 1] - y, red[i + 2] - z) < 0.36) libre = false;
      if (libre) red.push(x, y, z);
    }
    const hilosDe: number[] = [];
    for (let i = 0; i < N; i++) {
      const d = Array.from({ length: N }, (_, j) => [j, Math.hypot(red[i * 3] - red[j * 3], red[i * 3 + 1] - red[j * 3 + 1], red[i * 3 + 2] - red[j * 3 + 2])]).sort((a, q) => a[1] - q[1]);
      for (let k = 1; k <= 2; k++) {
        const j = d[k][0];
        let ya = false;
        for (let h = 0; h < hilosDe.length; h += 2) if (hilosDe[h] === j && hilosDe[h + 1] === i) ya = true;
        if (!ya) hilosDe.push(i, j);
      }
    }
    // The net we fall into is light 0 of each net; `o` puts the point that stays put at the origin.
    const o = [-red[0] / (1 - S), -red[1] / (1 - S), -red[2] / (1 - S)];

    const luces = Array.from({ length: NIVELES + 1 }, (_, k) => materiaBuilder(40 + k));
    const lineas: number[][] = Array.from({ length: NIVELES + 1 }, () => []);
    const c = new THREE.Color();
    // The lights of the net at (x, y, z) with size `e` are level `k`; `gen` more generations hang from them.
    const abrir = (x: number, y: number, z: number, e: number, k: number, gen: number, camino: boolean) => {
      if (k > NIVELES) return;
      for (let j = 0; j < N; j++) {
        const px = x + red[j * 3] * e;
        const py = y + red[j * 3 + 1] * e;
        const pz = z + red[j * 3 + 2] * e;
        const esCamino = camino && j === 0;
        c.copy(MAQUINA);
        if (esCamino) c.lerp(ORO3, 0.6);
        luces[k].push(px, py, pz, c, 0.05 * e, esCamino ? 1.5 : 1, { from: [x, y, z], delay: luces[k].r() });
        // The net on the way is opened by its own turn of the fall.
        if (gen > 0 && !esCamino) abrir(px, py, pz, e * S, k + 1, gen - 1, false);
      }
      if (estilo !== 1 && gen > 0)
        for (let h = 0; h < hilosDe.length; h += 2) {
          const a = hilosDe[h] * 3;
          const q = hilosDe[h + 1] * 3;
          lineas[k].push(x + red[a] * e, y + red[a + 1] * e, z + red[a + 2] * e, x + red[q] * e, y + red[q + 1] * e, z + red[q + 2] * e);
        }
    };
    // Level 0 is the first mind, one light.
    c.copy(MAQUINA);
    luces[0].push(o[0], o[1], o[2], c, 0.05 / S, 1);
    for (let d = 0; d < NIVELES; d++) {
      const e = Math.pow(S, d);
      abrir(o[0] * e, o[1] * e, o[2] * e, e, d + 1, 2, true);
    }

    const mundo = new THREE.Group();
    root.add(mundo);
    const nubes: Nube[] = luces.map((l) => {
      const n = materia(l.data(), {
        move: /* glsl */ `em *= 0.8 + 0.2 * sin(uTime * (0.7 + seed * 1.6) + seed * 60.0);`,
      });
      n.u.uSpread.value = 0.6;
      mundo.add(n.points);
      return n;
    });
    const hilos = lineas.map((p) => {
      if (p.length === 0) return null;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(p), 3));
      const mat = new THREE.LineBasicMaterial({ color: new THREE.Color(0.62, 0.74, 1.0), transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
      const l = new THREE.LineSegments(geo, mat);
      l.frustumCulled = false;
      mundo.add(l);
      return mat;
    });

    // The horizon: a dark disc that hides what is behind it, and the thin ring of light round it.
    const borde = pantalla(
      /* glsl */ `
      uniform float uR, uA, uLuz;
      void main() {
        vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
        float d = length(q);
        float dentro = 1.0 - smoothstep(uR * 0.985, uR * 1.005 + 0.002, d);
        float ancho = 0.003 + 0.006 * uR;
        float x = (d - uR) / ancho;
        // Brighter on one side, as light is round a hole that turns.
        float lado = 0.6 + 0.4 * (q.x / max(d, 1e-4));
        float aro = exp(-x * x) * (0.45 + 0.7 * lado);
        float halo = step(uR, d) * 0.012 * uR / max(d - uR + 0.03, 0.03);
        vec3 luz = (vec3(1.0, 0.93, 0.8) * aro + vec3(0.7, 0.8, 1.0) * halo) * uA * uLuz;
        gl_FragColor = vec4(luz, dentro * uA);
      }`,
      { uR: { value: 0.01 }, uA: { value: 0 }, uLuz: { value: 1 } },
    );
    const bm = borde.mesh.material as THREE.ShaderMaterial;
    bm.transparent = true;
    bm.blending = THREE.CustomBlending;
    bm.blendSrc = THREE.OneFactor;
    bm.blendDst = THREE.OneMinusSrcAlphaFactor;
    bm.blendSrcAlpha = THREE.OneFactor;
    bm.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
    borde.mesh.renderOrder = 100;
    root.add(borde.mesh);

    const tl = new Timeline();
    // t: how many nets deep the fall is; hz: the horizon, from a point ahead (0) to all the sky (1).
    tl.set({ t: -1.3, hz: 0, az: 0.4 });
    tl.label('una').caption(2.6, 'Una mente', 'Hasta aquí, a las mentes las hicimos nosotros. Esta puede mejorar su propio diseño.');
    tl.to(2.6, { t: -0.05, az: 0.8 });
    tl.label('abre').caption(3.0, 'Se abre', 'Cada mejora la deja mejor para mejorarse. Cada luz se abre en una red entera.');
    tl.to(3.0, { t: 1, az: 1.3 });
    tl.label('otra').caption(4.4, 'Y otra vez', 'Y otra vez. Y otra. Cada vuelta dura menos que la anterior.');
    tl.to(1.7, { t: 2, az: 1.7 });
    tl.to(1.2, { t: 3, az: 2.0 });
    tl.to(0.85, { t: 4, az: 2.25 });
    tl.to(0.65, { t: 5, az: 2.45 });
    tl.label('horizonte').caption(4.2, 'El horizonte', 'Adelante hay un borde. Lo que sigue no se ve desde aquí.');
    tl.to(3.0, { t: 6.4, hz: 1, az: 2.9 });
    tl.wait(1.2);

    const pos = V();
    const O = V();

    return {
      tl,
      cuenta(p): Cuenta {
        const t = tl.get('t', p);
        const h = Math.min(27, 12 + 2.6 * Math.max(0, t));
        if (tl.get('hz', p) > 0.55) return { pisos: ['?'], linea: 'conexiones · nadie lo sabe', h: 27 };
        return { pisos: ['10', String(Math.floor(h))], linea: t < 0 ? 'conexiones · una mente' : 'conexiones · y creciendo', h };
      },
      rotulo(p): Rotulo | null {
        const cp = tl.captionAt(p);
        return cp ? { capitulo: CAP, name: cp.name, fact: cp.fact } : null;
      },
      update(f: Frame) {
        const p = f.p;
        const t = tl.get('t', p);
        const hz = tl.get('hz', p);
        camera.near = 0.02;
        camera.far = 400;
        camera.fov = 46;
        const escala = Math.pow(1 / S, t);
        mundo.scale.setScalar(escala);
        const az = tl.get('az', p) + f.time * 0.015;
        pos.set(Math.sin(az) * 2.3, 0.5, Math.cos(az) * 2.3);
        camera.position.copy(pos);
        camera.up.set(0, 1, 0);
        camera.lookAt(O);

        for (let k = 0; k <= NIVELES; k++) {
          const n = nubes[k];
          enfocar(n, f.focal, f.dpr, f.time);
          n.u.uEscalaMundo.value = escala;
          n.u.uMaxPx.value = 16 * f.dpr;
          // A level goes out as the fall enters one of its lights: by then its lights are the next nets.
          const sale = 1 - ease(k - 0.25, k + 0.45, t);
          // …and is not there yet while its net is still one far light.
          const entra = ease(k - 2.3, k - 1.7, t);
          n.u.uGain.value = 1.15 * sale * entra;
          n.points.visible = sale * entra > 0.002;
          if (k === 0) n.u.uMinPx.value = 3 * f.dpr;
          // 3 · the lights of a net come out of the light it was.
          n.u.uK.value = estilo === 2 && k > 0 ? ease(k - 1.55, k - 0.75, t) : 1;
          const h = hilos[k];
          if (h) {
            h.opacity = 0.16 * ease(k - 2.0, k - 1.0, t) * sale * (estilo === 2 ? ease(k - 1.0, k - 0.6, t) : 1);
            h.visible = h.opacity > 0.002;
          }
        }
        borde.u.uR.value = 0.006 + 1.25 * Math.pow(hz, 2.4);
        borde.u.uA.value = ease(0, 0.12, hz);
        // The ring thins out as it passes the edges of the screen, and leaves the dark.
        borde.u.uLuz.value = 1 - 0.8 * ease(0.45, 0.95, hz);
      },
      dispose() {},
    };
  },
};
