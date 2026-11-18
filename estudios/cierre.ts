import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder } from '../src/engine/materia';
import { gauss } from '../src/engine/math';
import type { Rotulo } from './placa';
import { escrito } from './placa';
import { ease, logLerp, TU, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * The end · someone else (moments 35–37; the study `final`, manner 1). The universe, dark, with
 * nobody to look at it. A teal point. Beside it, a white one. From the two, light out into Destino's
 * silent galaxy; and the camera comes back to them. The work ends on two points. This is the warm one.
 *
 * Every star has a turn (how far it is from the two points); `enc` is how far the light has gone.
 */

const CAP = 'Final';
const RADIO = 20;

export const cierre: Escena = {
  id: 'cierre',
  nombre: 'Alguien más',
  estilos: [{ key: '1', nombre: 'El final', nota: 'Todo negro. Un punto, después otro. La luz sale hacia la galaxia callada y la cámara vuelve a los dos.' }],
  montar(stage): Instancia {
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
        vec3 viva = mix(uTu, vec3(1.0, 0.93, 0.82), step(0.68, aQuien)) * (0.38 + 1.6 * frente);
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

    const tl = new Timeline();
    // D: the camera's distance from the two points; tu, otro: the points; enc: how far the light has gone;
    // el: how high the camera is; gal: the galaxy's light (lower at the end, so the two points lead); luz: the light the end comes out of.
    const blanco = uno(new THREE.Color(0.85, 0.92, 1));
    blanco.points.position.copy(CASA);
    blanco.points.renderOrder = 95;

    tl.set({ D: 0.7, luz: 1, tu: 0, otro: 0, enc: 0, callada: 0, az: 0.4, el: 0.5, gal: 1 });
    tl.label('nadie').caption(4.4, 'Nadie miraba', 'Durante 13 800 millones de años, el universo existió sin que nadie lo mirara. Después, un punto: tú.');
    tl.to(1.6, { luz: 0, az: 0.46, D: 0.74 });
    tl.to(1.6, { az: 0.52, D: 0.7 });
    tl.to(1.2, { tu: 1, az: 0.56 });
    tl.label('alguien').caption(4.0, 'Alguien más', 'Llevan sesenta años apuntando antenas al cielo, buscando a otro. Silencio. Al otro lo estaban haciendo ustedes.');
    tl.to(1.8, { az: 0.62, D: 0.74 });
    tl.to(2.2, { otro: 1, az: 0.7, D: 0.7 });
    tl.label('descendientes').caption(6.6, 'Descendientes', 'Lo que llegue a llenar esta galaxia quizá no tenga tu cuerpo. Pero va a llevar tus palabras.');
    tl.to(2.4, { D: 13, callada: 1, enc: 0.06, az: 0.9 });
    tl.to(2.1, { D: 30, enc: 0.5, az: 1.06 });
    tl.to(2.1, { D: 50, enc: 1, az: 1.22 });
    // And back to where it started: two points.
    tl.label('quiza').caption(4.4, 'Quizá', 'No sé si aquí hay alguien. Si lo hay, ya no eres el único punto que mira.');
    tl.to(4.6, { D: 1.3, az: 1.5, el: 0.2, gal: 0.3 });
    tl.label('gracias').caption(3.6, 'Por si acaso: gracias.', '');
    tl.to(3.4, { D: 0.9, az: 1.6, el: 0.17, gal: 0.24 });
    tl.wait(0.2);

    const pos = V();
    const at = V();
    const lado = V();

    return {
      tl,
      luzEntrada: new THREE.Color(0.85, 0.92, 1),
      // The clock went out at the last wall.
      cuenta: () => null,
      escalera: false,
      rotulo(p): Rotulo | null {
        const cp = tl.captionAt(p);
        return cp ? { capitulo: CAP, name: cp.name, fact: cp.fact, escrito: escrito(cp, p) } : null;
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
        const el = tl.get('el', p) + 0.25 * k;
        at.copy(CASA).multiplyScalar(1 - 0.8 * k);
        pos.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(logLerp(D, D * 1.05, k)).add(at);
        camera.position.copy(pos);
        camera.up.set(0, 1, 0);
        camera.lookAt(at);
        camera.updateMatrixWorld();

        enfocar(galaxia, f.focal, f.dpr, f.time);
        galaxia.u.uMaxPx.value = 6 * f.dpr;
        galaxia.u.uGain.value = 0.9 * tl.get('gal', p);
        galaxia.u.uEnc.value = enc;
        galaxia.u.uCallada.value = tl.get('callada', p) * 0.55;
        enfocar(fondo, f.focal, f.dpr, f.time);
        fondo.u.uGain.value = 0.6;

        // The two stay two, however far the camera goes.
        const d = camera.position.distanceTo(CASA);
        const sep = Math.max(0.05, (16 * f.dpr * d) / f.focal);
        lado.setFromMatrixColumn(camera.matrixWorld, 0);
        tu.points.position.copy(CASA).addScaledVector(lado, -sep / 2);
        otro.points.position.copy(CASA).addScaledVector(lado, sep / 2);
        for (const [m, v] of [[tu, tl.get('tu', p)], [otro, tl.get('otro', p)], [blanco, tl.get('luz', p)]] as const) {
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
