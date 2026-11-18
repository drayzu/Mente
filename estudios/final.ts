import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder } from '../src/engine/materia';
import { gauss } from '../src/engine/math';
import type { Rotulo } from './placa';
import { ease, logLerp, TU, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Study · the end (moments 35–37). The universe, dark, with nobody to look at it. A teal point.
 * Beside it, a white one. And from the two, light out into Destino's silent galaxy.
 *
 * Every star has a turn (how far it is from the two points); `enc` is how far the light has gone.
 */

const CAP = 'Final';
const RADIO = 20;

export const final: Escena = {
  id: 'final',
  nombre: 'Dos puntos',
  estilos: [
    { key: '1', nombre: 'Desde el negro', nota: 'Todo negro. Un punto, después otro. La galaxia solo aparece al final, cuando la luz sale hacia ella.' },
    { key: '2', nombre: 'La galaxia callada', nota: 'Empieza con la galaxia entera, apagada. Bajamos hasta el punto y después la vemos encenderse.' },
    { key: '3', nombre: 'Caminos', nota: 'Como la primera, y la luz avanza de estrella en estrella dejando caminos.' },
  ],
  montar(stage, estilo): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.6;
    stage.bloom.radius = 0.65;
    stage.bloom.threshold = 0.4;

    const CASA = V(8.5, 0, 0);

    // The galaxy: a bulge and two arms.
    const N = 150000;
    const b = materiaBuilder(71);
    const r = b.r;
    const turno = new Float32Array(N);
    const quien = new Float32Array(N);
    const LEJOS = RADIO + CASA.x - 3;
    const gris = new THREE.Color(1, 1, 1);
    for (let i = 0; i < N; i++) {
      let x: number;
      let y: number;
      let z: number;
      if (r() < 0.16) {
        x = gauss(r) * 1.6;
        y = gauss(r) * 0.8;
        z = gauss(r) * 1.6;
      } else {
        const rad = 1.5 + RADIO * Math.pow(r(), 0.75) * 0.95;
        const brazo = Math.floor(r() * 2) * Math.PI;
        const a = brazo + 2.6 * Math.log(rad) + gauss(r) * (0.28 + 0.5 * r() * r());
        x = Math.cos(a) * rad;
        z = Math.sin(a) * rad;
        y = gauss(r) * 0.22;
      }
      b.push(x, y, z, gris, 0.06, 1);
      turno[i] = Math.min(1, Math.hypot(x - CASA.x, y, z) / LEJOS) * 0.94 + r() * 0.05;
      quien[i] = r();
    }
    const galaxia = materia(b.data(), {
      pre: /* glsl */ `
        attribute float aTurno, aQuien;
        uniform float uEnc, uCallada;
        uniform vec3 uTu;`,
      move: /* glsl */ `
        float ya = smoothstep(aTurno - 0.012, aTurno + 0.012, uEnc);
        float d = (uEnc - aTurno) * 22.0;
        float frente = exp(-d * d) * ya;
        vec3 viva = mix(uTu, vec3(1.0, 0.98, 0.95), step(0.6, aQuien)) * (0.38 + 1.6 * frente);
        vec3 callada = vec3(0.3, 0.34, 0.44) * uCallada;
        em *= mix(callada, viva, ya) * (0.8 + 0.2 * sin(uTime * (0.5 + seed * 1.3) + seed * 50.0));`,
      uniforms: { uEnc: { value: 0 }, uCallada: { value: 0 }, uTu: { value: TU.clone() } },
      extra: { aTurno: [turno, 1], aQuien: [quien, 1] },
    });
    root.add(galaxia.points);

    // The rest of the universe: far, faint, and lit for nobody.
    const f0 = materiaBuilder(72);
    for (let i = 0; i < 2600; i++) {
      const [x, y, z] = f0.onSphere();
      f0.push(x * 600, y * 600, z * 600, new THREE.Color(0.6, 0.66, 0.85), 1, 0.3 + 0.7 * Math.pow(f0.r(), 4));
    }
    const fondo = materia(f0.data());
    root.add(fondo.points);

    const uno = (c: THREE.Color) => {
      const q = materiaBuilder(3);
      q.push(0, 0, 0, c, 0.012, 1);
      const m = materia(q.data());
      m.u.uFuente.value = 1;
      root.add(m.points);
      return m;
    };
    const tu = uno(TU.clone());
    const otro = uno(new THREE.Color(1, 1, 1));

    // 3 · roads: each star on the way is joined to the nearest one that was lit before it.
    let caminos: THREE.ShaderMaterial | null = null;
    if (estilo === 2) {
      const K = 6000;
      const pos = b.data().position;
      const ids = Array.from({ length: K }, (_, i) => i * Math.floor(N / K)).sort((p, q) => turno[p] - turno[q]);
      const seg: number[] = [];
      const cuando: number[] = [];
      for (let i = 1; i < K; i++) {
        const a = ids[i] * 3;
        let mejor = -1;
        let dm = 1e9;
        for (let j = Math.max(0, i - 500); j < i; j++) {
          const q = ids[j] * 3;
          const d = (pos[a] - pos[q]) ** 2 + (pos[a + 1] - pos[q + 1]) ** 2 + (pos[a + 2] - pos[q + 2]) ** 2;
          if (d < dm) {
            dm = d;
            mejor = q;
          }
        }
        if (dm > 2.2 * 2.2) continue;
        seg.push(pos[mejor], pos[mejor + 1], pos[mejor + 2], pos[a], pos[a + 1], pos[a + 2]);
        cuando.push(turno[ids[i]], turno[ids[i]]);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg), 3));
      geo.setAttribute('aTurno', new THREE.BufferAttribute(new Float32Array(cuando), 1));
      caminos = new THREE.ShaderMaterial({
        uniforms: { uEnc: { value: 0 } },
        vertexShader: /* glsl */ `
          attribute float aTurno;
          uniform float uEnc;
          varying float vA;
          void main() {
            float d = uEnc - aTurno;
            vA = d > 0.0 ? 0.22 + 0.7 * exp(-d * 14.0) : 0.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          varying float vA;
          void main() { gl_FragColor = vec4(vec3(0.62, 0.95, 0.9) * vA, 1.0); }`,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const l = new THREE.LineSegments(geo, caminos);
      l.frustumCulled = false;
      root.add(l);
    }

    const tl = new Timeline();
    // D: the camera's distance from the two points; tu, otro: the points; enc: how far the light has gone.
    const NADIE = 'Durante 13 800 millones de años, el universo existió sin nadie que lo mirara. Entonces, un punto.';
    if (estilo === 1) {
      tl.set({ D: 52, tu: 0, otro: 0, enc: 0, callada: 1, az: 0 });
      tl.label('nadie').caption(4.4, 'Nadie miraba', NADIE);
      tl.to(3.2, { D: 0.7, az: 0.5 });
      tl.to(1.2, { tu: 1 });
    } else {
      tl.set({ D: 0.7, tu: 0, otro: 0, enc: 0, callada: 0, az: 0.5 });
      tl.label('nadie').caption(3.4, 'Nadie miraba', NADIE);
      tl.wait(2.2);
      tl.to(1.2, { tu: 1 });
    }
    tl.label('alguien').caption(3.6, 'Alguien más', 'Buscamos a otro entre las estrellas y hubo silencio. Quizá al otro lo estamos haciendo nosotros.');
    tl.wait(1.6);
    tl.to(2.0, { otro: 1, az: 0.62 });
    tl.label('descendientes').caption(6.4, 'Descendientes', 'Lo que llegue a llenar esta galaxia quizá no tenga nuestro cuerpo. Pero viene de nosotros. Todo, desde aquí.');
    tl.to(2.4, { D: 13, callada: 1, enc: 0.06, az: 0.85 });
    tl.to(2.0, { D: 30, enc: 0.5, az: 1.03 });
    tl.to(2.0, { D: 50, enc: 1, az: 1.2 });

    const pos = V();
    const at = V();
    const lado = V();

    return {
      tl,
      // The clock went out at the last wall.
      cuenta: () => null,
      escalera: false,
      rotulo(p): Rotulo | null {
        const cp = tl.captionAt(p);
        return cp ? { capitulo: CAP, name: cp.name, fact: cp.fact } : null;
      },
      update(f: Frame) {
        const p = f.p;
        const D = tl.get('D', p);
        const enc = tl.get('enc', p);
        camera.near = 0.02;
        camera.far = 2000;
        camera.fov = 40;
        const az = tl.get('az', p) + f.time * 0.006;
        // Far away it looks at the whole galaxy; near, at the two points.
        const k = ease(Math.log(1.5), Math.log(40), Math.log(D));
        const el = 0.5 + 0.25 * k;
        at.copy(CASA).multiplyScalar(1 - 0.8 * k);
        pos.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(logLerp(D, D * 1.05, k)).add(at);
        camera.position.copy(pos);
        camera.up.set(0, 1, 0);
        camera.lookAt(at);
        camera.updateMatrixWorld();

        enfocar(galaxia, f.focal, f.dpr, f.time);
        galaxia.u.uMaxPx.value = 6 * f.dpr;
        galaxia.u.uGain.value = 0.9;
        galaxia.u.uEnc.value = enc;
        galaxia.u.uCallada.value = tl.get('callada', p) * 0.55;
        enfocar(fondo, f.focal, f.dpr, f.time);
        fondo.u.uGain.value = 0.5;
        if (caminos) caminos.uniforms.uEnc.value = enc;

        // The two stay two, however far the camera goes.
        const d = camera.position.distanceTo(CASA);
        const sep = Math.max(0.05, (16 * f.dpr * d) / f.focal);
        lado.setFromMatrixColumn(camera.matrixWorld, 0);
        tu.points.position.copy(CASA).addScaledVector(lado, -sep / 2);
        otro.points.position.copy(CASA).addScaledVector(lado, sep / 2);
        for (const [m, v] of [[tu, tl.get('tu', p)], [otro, tl.get('otro', p)]] as const) {
          enfocar(m, f.focal, f.dpr, f.time);
          m.u.uMinPx.value = 5 * f.dpr;
          m.u.uMaxPx.value = 9 * f.dpr;
          m.u.uGain.value = 3.0 * v;
        }
      },
      dispose() {},
    };
  },
};
