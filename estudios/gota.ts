import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder } from '../src/engine/materia';
import { pantalla } from '../src/engine/pantalla';
import { rng } from '../src/engine/math';
import { nota, proyectar, type Cuenta, type Rotulo } from './placa';
import { ease, MAQUINA, SEGURO, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Study · faster (act V, moment 22). For a mind a million times faster the world stands still:
 * rain that falls, slows and stops, and one drop hanging in the air in front of you.
 *
 * `T` is the world's time (in seconds of rain); the timeline lets it run and then almost stops it.
 * Every drop's place is a function of T, so the scroll can go back and forth.
 */

const CAP = 'V · La singularidad';
const ALTO = 12;
const CAE = 8;

export const gota: Escena = {
  id: 'gota',
  nombre: 'La gota de lluvia quieta',
  estilos: [
    { key: '1', nombre: 'Gota de cristal', nota: 'La lluvia se detiene y una gota queda colgada frente a ti, con el mundo al revés adentro.' },
    { key: '2', nombre: 'Con rayo', nota: 'Lo mismo, y en el cielo un rayo que avanza tan lento que parece quieto.' },
    { key: '3', nombre: 'Solo luces', nota: 'Sin cristal: las gotas son puntos de luz que quedan suspendidos.' },
  ],
  montar(stage, estilo): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.5;
    stage.bloom.radius = 0.55;
    stage.bloom.threshold = 0.42;

    const tl = new Timeline();
    // T: the world's time; cerca: the camera goes to the drop; rayo: how far the bolt has come down.
    tl.set({ T: 0, cerca: 0, rayo: 0 });
    tl.label('llueve').caption(2.6, 'Llueve', 'Para ti, la lluvia cae. Mientras piensas una palabra, una gota baja un par de metros.');
    tl.to(2.6, { T: 2.6 });
    tl.label('rapido').caption(3.4, 'Más rápido', 'Una mente hecha de luz podría pensar un millón de veces más rápido. Para ella, la lluvia casi no se mueve.');
    tl.to(1.6, { T: 3.5, rayo: 0.1 });
    tl.to(1.8, { T: 3.62, cerca: 0.35, rayo: 0.45 });
    tl.label('quieta').caption(4.4, 'Quieta', 'Una gota colgada en el aire. En un día tuyo caben casi tres mil años suyos.');
    tl.to(4.4, { T: 3.64, cerca: 1, rayo: 0.6 });
    const T1 = 3.64;

    // The rain: each drop falls at its own speed and comes round again from the top.
    const N = 9000;
    const b = materiaBuilder(11);
    const r = b.r;
    const linea = new Float32Array(N * 6);
    const cola = new Float32Array(N * 2);
    const vel = new Float32Array(N * 2);
    for (let i = 0; i < N; i++) {
      const x = (r() * 2 - 1) * 9;
      const y = (r() - 0.5) * ALTO;
      const z = 2.5 - r() * 20;
      b.push(x, y, z, MAQUINA, 0.016, 0.9);
      const v = CAE * (0.8 + 0.4 * r());
      for (let k = 0; k < 2; k++) {
        linea[i * 6 + k * 3] = x;
        linea[i * 6 + k * 3 + 1] = y;
        linea[i * 6 + k * 3 + 2] = z;
        cola[i * 2 + k] = k;
        vel[i * 2 + k] = v;
      }
    }
    const velPunto = new Float32Array(N);
    for (let i = 0; i < N; i++) velPunto[i] = vel[i * 2];
    const CAER = /* glsl */ `p.y = mod(p.y - aVel * uT + ${(ALTO / 2).toFixed(1)}, ${ALTO.toFixed(1)}) - ${(ALTO / 2).toFixed(1)};`;
    const lluvia = materia(b.data(), {
      pre: /* glsl */ `attribute float aVel; uniform float uT;`,
      move: CAER,
      uniforms: { uT: { value: 0 } },
      extra: { aVel: [velPunto, 1] },
    });
    lluvia.u.uFog.value = 16;
    root.add(lluvia.points);

    // What a slow eye sees of a falling drop: a streak as long as it falls in one look.
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(linea, 3));
    geo.setAttribute('aCola', new THREE.BufferAttribute(cola, 1));
    geo.setAttribute('aVel', new THREE.BufferAttribute(vel, 1));
    const estela = new THREE.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uMirada: { value: 0 }, uLuz: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute float aCola, aVel;
        uniform float uT, uMirada;
        varying float vA;
        void main() {
          vec3 p = position;
          ${CAER}
          p.y += aCola * aVel * uMirada;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vA = (1.0 - aCola) * exp(-max(-mv.z, 0.0) / 14.0);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform float uLuz;
        varying float vA;
        void main() { gl_FragColor = vec4(vec3(0.72, 0.84, 1.0) * vA * uLuz, 1.0); }`,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const estelas = new THREE.LineSegments(geo, estela);
    estelas.frustumCulled = false;
    root.add(estelas);

    // The drop that stops in front of you. It falls in from above and is here when time is.
    const AQUI = V(0.3, 0.12, 0);
    const RADIO = 0.035;
    const G = V();
    const cristal =
      estilo === 2
        ? null
        : pantalla(
            /* glsl */ `
      ${SEGURO}
      uniform vec2 uC;
      uniform float uR, uA, uRayo;
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec2 q = ((vUv - 0.5) * vec2(uAspect, 1.0) - uC) / max(uR, 1e-5);
        float d = length(q);
        if (d > 1.0) {
          float halo = 0.05 * uA / (1.0 + (d - 1.0) * (d - 1.0) * 60.0);
          gl_FragColor = vec4(vec3(0.7, 0.82, 1.0) * halo, 0.0);
          return;
        }
        float z = rz(1.0 - d * d);
        // A drop is a lens: what is behind it is seen upside down, and squeezed towards the rim.
        vec2 r = -q * (0.7 + 1.1 * (1.0 - z));
        float cielo = 0.05 + 0.2 * smoothstep(-1.2, 1.2, -r.y);
        vec2 g = r * 7.0;
        vec2 fr = fract(g) - 0.5;
        float otras = step(0.8, h21(floor(g))) * exp(-dot(fr, fr) * 45.0);
        float rayo = exp(-pw(abs(r.x + 0.5 - 0.16 * sin(r.y * 6.0 + 1.0)) * 9.0, 2.0)) * smoothstep(1.3, -0.6, -r.y - 2.0 * uRayo + 0.6) * uRayo;
        float borde = pw(1.0 - z, 2.5);
        vec2 e = q - vec2(-0.36, 0.42);
        float brillo = exp(-dot(e, e) * 55.0);
        vec3 c = vec3(0.72, 0.84, 1.0) * (cielo + otras * 0.8 + borde * 0.75) + vec3(1.0, 0.96, 1.0) * (brillo * 1.5 + rayo * 1.3);
        float a = smoothstep(1.0, 0.96, d) * uA;
        gl_FragColor = vec4(c * a, 0.9 * a);
      }`,
            { uC: { value: new THREE.Vector2() }, uR: { value: 0.01 }, uA: { value: 0 }, uRayo: { value: 0 } },
          );
    if (cristal) {
      const m = cristal.mesh.material as THREE.ShaderMaterial;
      m.transparent = true;
      m.blending = THREE.CustomBlending;
      m.blendSrc = THREE.OneFactor;
      m.blendDst = THREE.OneMinusSrcAlphaFactor;
      m.blendSrcAlpha = THREE.OneFactor;
      m.blendDstAlpha = THREE.OneMinusSrcAlphaFactor;
      cristal.mesh.renderOrder = 100;
      root.add(cristal.mesh);
    }
    const u1 = materiaBuilder(5);
    u1.push(0, 0, 0, new THREE.Color(0.85, 0.92, 1), RADIO, 1);
    const luz = materia(u1.data());
    luz.u.uFuente.value = 1;
    root.add(luz.points);

    // 2 · the bolt: a broken line of light with branches, far behind the rain, lit from the top down.
    const rb = materiaBuilder(23);
    if (estilo === 1) {
      const q = rng(9);
      const rama = (ax: number, ay: number, bx: number, by: number, k0: number, k1: number, luzR: number, nivel: number) => {
        let pts = [ax, ay, bx, by];
        for (let it = 0; it < 6; it++) {
          const o: number[] = [];
          const amp = (nivel === 0 ? 2.6 : 1.3) / Math.pow(1.7, it);
          for (let i = 0; i < pts.length - 2; i += 2) o.push(pts[i], pts[i + 1], (pts[i] + pts[i + 2]) / 2 + (q() - 0.5) * amp, (pts[i + 1] + pts[i + 3]) / 2 + (q() - 0.5) * amp * 0.35);
          o.push(pts[pts.length - 2], pts[pts.length - 1]);
          pts = o;
        }
        const m = pts.length / 2;
        for (let i = 0; i < m - 1; i++) {
          const pasos = Math.max(2, Math.ceil(Math.hypot(pts[i * 2 + 2] - pts[i * 2], pts[i * 2 + 3] - pts[i * 2 + 1]) / 0.035));
          for (let j = 0; j < pasos; j++) {
            const t = j / pasos;
            rb.push(pts[i * 2] + (pts[i * 2 + 2] - pts[i * 2]) * t, pts[i * 2 + 1] + (pts[i * 2 + 3] - pts[i * 2 + 1]) * t, -15, new THREE.Color(0.86, 0.84, 1), 0.1 * (0.4 + 0.6 * luzR), luzR, { kind: k0 + (k1 - k0) * ((i + t) / (m - 1)) });
          }
          if (nivel < 2 && q() < (nivel === 0 ? 0.16 : 0.07)) {
            const k = k0 + (k1 - k0) * (i / (m - 1));
            const largo = (1.6 + q() * 3.4) / (nivel + 1);
            rama(pts[i * 2], pts[i * 2 + 1], pts[i * 2] + (q() - 0.5) * largo * 2.2, pts[i * 2 + 1] - largo, k, Math.min(1, k + largo * 0.07), luzR * 0.55, nivel + 1);
          }
        }
      };
      rama(-4.6, 9.5, -2.6, -7.5, 0, 1, 1, 0);
    } else rb.push(0, 0, 0, 0, 0, 0);
    const rayo = materia(rb.data(), {
      pre: /* glsl */ `uniform float uHasta;`,
      move: /* glsl */ `
        em *= aKind < uHasta ? 0.55 + 1.6 * exp(-(uHasta - aKind) * 14.0) : 0.0;
        fuente = 1.0;`,
      uniforms: { uHasta: { value: 0 } },
    });
    rayo.points.visible = estilo === 1;
    root.add(rayo.points);

    const pos = V();
    const at = V();
    const lejos = V(0, 0, 3.2);
    const lejosAt = V(0, 0.4, -6);
    const scr = { x: 0, y: 0, z: 0 };

    return {
      tl,
      cuenta: (): Cuenta => ({ pisos: ['10', '13'], linea: 'conexiones · un millón de veces más rápida', h: 13 }),
      rotulo(p): Rotulo | null {
        const cp = tl.captionAt(p);
        return cp ? { capitulo: CAP, name: cp.name, fact: cp.fact } : null;
      },
      placa(g, f) {
        const k = ease(0.75, 1, tl.get('cerca', f.p));
        if (k < 0.02) return;
        proyectar(G, camera, f.W, f.H, scr);
        // 9 m/s seen a million times slower.
        const R = (RADIO * f.focal) / Math.max(camera.position.distanceTo(G), 0.01);
        nota(g, f.u, scr.x + R * 0.78, scr.y - R * 0.78, 'cae 9 milésimas de milímetro por segundo', 46, -36, k * 0.9);
      },
      update(f: Frame) {
        const p = f.p;
        const T = tl.get('T', p);
        const ritmo = Math.max(0, (tl.get('T', p + 0.03) - tl.get('T', p - 0.03)) / 0.06);
        const cerca = tl.get('cerca', p);
        const hasta = tl.get('rayo', p);
        camera.near = 0.01;
        camera.far = 200;
        camera.fov = 48;
        G.set(AQUI.x, AQUI.y + (T1 - T) * CAE, AQUI.z);
        const k = ease(0, 1, cerca);
        pos.set(AQUI.x - 0.03, AQUI.y + 0.02, AQUI.z + 0.36).lerp(lejos, 1 - k);
        at.copy(AQUI).lerp(lejosAt, 1 - k);
        camera.position.copy(pos);
        camera.up.set(0, 1, 0);
        camera.lookAt(at);
        camera.updateMatrixWorld();

        const luzRayo = estilo === 1 ? ease(0.02, 0.3, hasta) : 0;
        enfocar(lluvia, f.focal, f.dpr, f.time);
        lluvia.u.uT.value = T;
        lluvia.u.uMaxPx.value = 9 * f.dpr;
        // Falling, a drop is its streak; still, it is a point of light.
        lluvia.u.uGain.value = (0.25 + 0.95 * (1 - ease(0, 0.5, ritmo))) * (1 + 0.5 * luzRayo);
        estela.uniforms.uT.value = T;
        estela.uniforms.uMirada.value = ritmo * 0.045;
        estela.uniforms.uLuz.value = 0.5 * ease(0.02, 0.4, ritmo);
        estelas.visible = ritmo > 0.02;

        proyectar(G, camera, f.W, f.H, scr);
        const hondo = Math.max(camera.position.distanceTo(G), 0.01);
        const visible = scr.z < 1 && scr.y > -f.H * 0.3 ? 1 : 0;
        if (cristal) {
          (cristal.u.uC.value as THREE.Vector2).set(((scr.x / f.W - 0.5) * f.W) / f.H, 0.5 - scr.y / f.H);
          cristal.u.uR.value = (RADIO * f.focal) / hondo / f.H;
          cristal.u.uA.value = visible * ease(0.05, 0.5, cerca);
          cristal.u.uRayo.value = luzRayo * hasta;
        }
        luz.points.position.copy(G);
        enfocar(luz, f.focal, f.dpr, f.time);
        luz.u.uMinPx.value = 3 * f.dpr;
        luz.u.uMaxPx.value = (estilo === 2 ? 70 : 220) * f.dpr;
        luz.u.uGain.value = estilo === 2 ? 0.9 : 1.1 * (1 - ease(0.05, 0.4, cerca));
        enfocar(rayo, f.focal, f.dpr, f.time);
        rayo.u.uHasta.value = hasta;
        rayo.u.uMaxPx.value = 14 * f.dpr;
        rayo.u.uGain.value = 1.5;
      },
      dispose() {},
    };
  },
};
