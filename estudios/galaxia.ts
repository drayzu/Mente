import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder } from '../src/engine/materia';
import { FONT, ink, type Cuenta, type Rotulo } from './placa';
import { ease, logLerp, mirar, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';
import datos from '../src/datos/palabras.json';

/**
 * Study · the galaxy of meanings (act III, moments 11–12). For a language model every word is a
 * place: a point in a space of hundreds of dimensions, where words that mean alike sit close. Here
 * those places are real (fastText's Spanish vectors, flattened to three dimensions by t-SNE in
 * tools/palabras.py): each star is a word, and nobody put it there.
 *
 * It opens on one word, pulls back until the whole cloud shows, and flies in again to another word.
 * The words nearest the camera are written beside their stars.
 */

const CAP = 'III · El espacio de los significados';
const R = 10;
const N = datos.palabras.length;
const GRUPOS = 1 + Math.max(...datos.grupo);

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

export const galaxia: Escena = {
  id: 'galaxia',
  nombre: 'La galaxia de significados',
  estilos: [
    { key: '1', nombre: 'Regiones', nota: 'Cada palabra es una estrella. El color es su región: las que significan parecido brillan del mismo tono.' },
    { key: '2', nombre: 'Constelaciones', nota: 'Todas doradas. Cada palabra se une con un hilo a las tres que más se le parecen.' },
    { key: '3', nombre: 'Nebulosa', nota: 'Estrellas blancas sobre una niebla de color: cada región del significado es una nube.' },
  ],
  montar(stage, estilo): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.55;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = 0.4;

    const desde = indice('palabra', 'palabras', 'mar');
    const hasta = indice('mente', 'pensamiento', 'idea', 'vida');
    const A = lugar(desde);
    const B = lugar(hasta);

    const tl = new Timeline();
    // d: log10 of the camera's distance to what it looks at; ir: 0 the first word, 1 the centre, 2 the last word.
    tl.set({ d: -0.75, ir: 0, az: 0.3, el: 0.12 });
    tl.label('lugar').caption(3.6, 'Las palabras son lugares', 'Para una máquina, cada palabra es un lugar. Las que significan algo parecido quedan cerca.');
    tl.to(3.6, { d: 0.15, az: 0.75 });
    tl.label('galaxia').caption(4.6, 'Una galaxia de sentido', 'Todas las palabras de un idioma, cada una en su sitio. Nadie las puso ahí: se ordenaron solas, leyendo.');
    tl.to(2.6, { d: 1.4, ir: 1, az: 1.5, el: 0.22 });
    tl.to(2.0, { az: 2.0 });
    tl.label('viaje').caption(5.4, 'Adentro', 'Se puede viajar por el significado. De una idea a la de al lado, y de ahí a otra.');
    tl.to(3.4, { d: 0.3, ir: 2, az: 2.9, el: 0.05 });
    tl.to(2.0, { d: -0.7, az: 3.2 });

    // The stars: the frequent words are a little bigger.
    const b = materiaBuilder(11);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const peso = 1.5 - i / N;
      if (estilo === 0) tono(datos.grupo[i], c);
      else if (estilo === 1) c.setRGB(1.0, 0.84, 0.56);
      else tono(datos.grupo[i], c, 0.18, 0.82);
      b.push(POS[i * 3], POS[i * 3 + 1], POS[i * 3 + 2], c, 0.05 * peso, 0.9 * peso);
    }
    const estrellas = materia(b.data(), {
      move: /* glsl */ `
        em *= 0.82 + 0.18 * sin(uTime * (0.6 + seed * 1.4) + seed * 40.0);
        fuente = 1.0;`,
    });
    root.add(estrellas.points);

    // 3 · the haze: a few wide, faint points round every word, in its region's colour.
    let niebla: ReturnType<typeof materia> | null = null;
    if (estilo === 2) {
      const h = materiaBuilder(23);
      for (let i = 0; i < N; i++) {
        tono(datos.grupo[i], c, 0.75, 0.5);
        for (let k = 0; k < 2; k++) {
          const [x, y, z] = h.onSphere();
          const q = 0.25 * h.r();
          h.push(POS[i * 3] + x * q, POS[i * 3 + 1] + y * q, POS[i * 3 + 2] + z * q, c, 0.9, 0.022);
        }
      }
      niebla = materia(h.data());
      root.add(niebla.points);
    }

    // 2 · the threads: each word to its three nearest in the full space (when they also ended up near here).
    let hilos: THREE.LineSegments | null = null;
    if (estilo === 1) {
      const p: number[] = [];
      for (let i = 0; i < N; i++)
        for (let k = 0; k < 3; k++) {
          const j = datos.vecinas[i * 3 + k];
          if (j < i && datos.vecinas.slice(j * 3, j * 3 + 3).includes(i)) continue;
          const dx = POS[i * 3] - POS[j * 3];
          const dy = POS[i * 3 + 1] - POS[j * 3 + 1];
          const dz = POS[i * 3 + 2] - POS[j * 3 + 2];
          if (dx * dx + dy * dy + dz * dz > 1.2 * 1.2) continue;
          p.push(POS[i * 3], POS[i * 3 + 1], POS[i * 3 + 2], POS[j * 3], POS[j * 3 + 1], POS[j * 3 + 2]);
        }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(p), 3));
      const mat = new THREE.ShaderMaterial({
        uniforms: { uGain: { value: 0.1 }, uCerca: { value: 6 } },
        vertexShader: /* glsl */ `
          uniform float uCerca;
          varying float vA;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            // Threads near the camera show; the far ones melt into the cloud.
            vA = uCerca / (uCerca + max(-mv.z, 0.0));
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uGain;
          varying float vA;
          void main() { gl_FragColor = vec4(vec3(1.0, 0.8, 0.5) * uGain * vA * vA, 1.0); }`,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      hilos = new THREE.LineSegments(geo, mat);
      hilos.frustumCulled = false;
      root.add(hilos);
    }

    const at = V();
    const pos = V();
    const cuentaDe = (): Cuenta => ({ pisos: ['10', '12'], linea: 'conexiones · un modelo de lenguaje de hoy', h: 12 });

    // The words written on the film: the nearest ones, nearest first, none over another.
    const cand: { i: number; x: number; y: number; z: number }[] = [];
    const puestas: [number, number, number, number][] = [];
    function palabras(g: CanvasRenderingContext2D, f: Frame) {
      const { W, H, u } = f;
      const m = camera.matrixWorldInverse.elements;
      const dl = tl.get('d', f.p);
      // From afar the words would be dust over the cloud: they only show from near.
      const visibles = 1 - ease(0.55, 1.0, dl);
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
      cand.sort((a, q) => a.z - q.z);
      puestas.length = 0;
      g.save();
      g.textBaseline = 'middle';
      g.shadowColor = 'rgba(0,0,0,0.9)';
      g.shadowBlur = 8 * u;
      for (const q of cand) {
        if (puestas.length >= 70) break;
        const cerca = 1 - q.z / lejos;
        const px = (11 + 22 * cerca * cerca) * u;
        const w = datos.palabras[q.i];
        g.font = FONT.serif(px);
        const ancho = g.measureText(w).width;
        const x0 = q.x + 9 * u + px * 0.2;
        const y0 = q.y - px * 0.6;
        // Clear of the caption and the count, bottom left.
        if (x0 < 540 * u && y0 > H - 300 * u) continue;
        if (puestas.some(([a, e, o, d]) => x0 < a + o + 6 * u && x0 + ancho + 6 * u > a && y0 < e + d && y0 + px * 1.2 > e)) continue;
        puestas.push([x0, y0, ancho, px * 1.2]);
        g.globalAlpha = visibles * Math.min(1, 0.12 + 1.2 * cerca * cerca);
        if (estilo === 0) g.fillStyle = `#${tono(datos.grupo[q.i], c, 0.55, 0.82).getHexString()}`;
        else g.fillStyle = estilo === 1 ? 'rgb(255,226,170)' : ink();
        g.fillText(w, x0, q.y);
      }
      g.restore();
    }

    return {
      tl,
      cuenta: cuentaDe,
      rotulo(p): Rotulo | null {
        const cp = tl.captionAt(p);
        return cp ? { capitulo: CAP, name: cp.name, fact: cp.fact } : null;
      },
      placa: palabras,
      update(f: Frame) {
        const p = f.p;
        camera.near = 0.005;
        camera.far = 400;
        camera.fov = 46;
        const ir = tl.get('ir', p);
        if (ir <= 1) at.copy(A).multiplyScalar(1 - ease(0, 1, ir));
        else at.copy(B).multiplyScalar(ease(1, 2, ir));
        const d = Math.pow(10, tl.get('d', p));
        const az = tl.get('az', p) + f.time * 0.012;
        const el = tl.get('el', p);
        pos.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d).add(at);
        mirar(camera, pos, at);
        // From afar the cloud is thousands of stars on top of each other: hold the light back.
        const lejos = ease(0.3, 1.5, tl.get('d', p));
        estrellas.u.uGain.value = logLerp(1.0, estilo === 2 ? 0.34 : 0.8, lejos);
        estrellas.u.uMaxPx.value = 20 * f.dpr;
        enfocar(estrellas, f.focal, f.dpr, f.time);
        estrellas.u.uMinPx.value = (1.6 + 1.0 * lejos) * f.dpr;
        estrellas.u.uMaxPx.value = 20 * f.dpr;
        if (niebla) {
          enfocar(niebla, f.focal, f.dpr, f.time);
          niebla.u.uMaxPx.value = 220 * f.dpr;
          // Inside, the haze is all round the camera: thin it, or it whites the frame out.
          niebla.u.uGain.value = logLerp(0.2, 0.5, lejos);
        }
        if (hilos) {
          const m = hilos.material as THREE.ShaderMaterial;
          m.uniforms.uCerca.value = Math.max(1.5, d * 0.8);
          m.uniforms.uGain.value = logLerp(0.22, 0.05, lejos);
        }
      },
      dispose() {},
    };
  },
};
