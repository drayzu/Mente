import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder } from '../src/engine/materia';
import { nota, proyectar, type Rotulo } from './placa';
import { CORAL, ease, MAQUINA, TU, V } from './comun';
import { cerebro } from './punto';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Study · neuron by neuron (act VII, moment 32). Your brain, in coral, has its neurons changed for
 * artificial ones, in white, one at a time. The teal point stays lit all the way.
 *
 * Every point of the brain has a turn (0..1); `uC` is how far the change has gone. The ways differ
 * only in who goes first.
 */

const CAP = 'VII · ¿Hay alguien ahí?';

export const reemplazo: Escena = {
  id: 'reemplazo',
  nombre: 'Neurona por neurona',
  estilos: [
    { key: '1', nombre: 'Salpicado', nota: 'Cambian al azar, por todo el cerebro a la vez, como nieve que cae.' },
    { key: '2', nombre: 'Una ola', nota: 'El cambio avanza como una ola, de atrás hacia adelante.' },
    { key: '3', nombre: 'Desde ti', nota: 'Empieza junto al punto verde y crece hacia afuera.' },
  ],
  montar(stage, estilo): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.55;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = 0.4;

    const TU_EN = V(0, 0.05, 0);
    const datos = cerebro(130000, 5, false);
    const n = datos.seed.length;
    const turno = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = datos.position[i * 3];
      const y = datos.position[i * 3 + 1];
      const z = datos.position[i * 3 + 2];
      const s = datos.seed[i];
      const orden = estilo === 0 ? s : estilo === 1 ? ((z + 0.95) / 1.9) * 0.88 + s * 0.12 : Math.min(1, Math.hypot(x, y - TU_EN.y, z) / 1.0) * 0.88 + s * 0.12;
      turno[i] = 0.02 + 0.98 * orden;
    }
    const nube = materia(datos, {
      pre: /* glsl */ `
        attribute float aTurno;
        uniform float uC;
        uniform vec3 uCoral, uMaq;`,
      move: /* glsl */ `
        float ya = smoothstep(aTurno - 0.003, aTurno + 0.003, uC);
        // The moment it changes, it sparks.
        float d = (uC - aTurno) * 60.0;
        float chispa = exp(-d * d) * ya;
        em *= mix(uCoral, uMaq, ya) * (1.0 + 5.0 * chispa);
        em *= 0.85 + 0.15 * sin(uTime * (0.6 + seed * 1.5) + seed * 40.0);`,
      uniforms: { uC: { value: 0 }, uCoral: { value: CORAL.clone() }, uMaq: { value: MAQUINA.clone() } },
      extra: { aTurno: [turno, 1] },
    });
    root.add(nube.points);

    // The first one, alone.
    const PRIMERA = V(0.5, 0.45, 0.3);
    const p1 = materiaBuilder(3);
    p1.push(PRIMERA.x, PRIMERA.y, PRIMERA.z, new THREE.Color(1, 1, 1), 0.03, 1);
    const primera = materia(p1.data(), {
      pre: /* glsl */ `uniform float uUna; uniform vec3 uCoral, uMaq;`,
      move: /* glsl */ `em *= mix(uCoral, uMaq, uUna);`,
      uniforms: { uUna: { value: 0 }, uCoral: { value: CORAL.clone() }, uMaq: { value: new THREE.Color(1, 1, 1) } },
    });
    primera.u.uFuente.value = 1;
    root.add(primera.points);

    const p2 = materiaBuilder(4);
    p2.push(TU_EN.x, TU_EN.y, TU_EN.z, TU.clone(), 0.02, 1);
    const tu = materia(p2.data());
    tu.u.uFuente.value = 1;
    root.add(tu.points);

    const tl = new Timeline();
    // c: how much of the brain has changed; una: the first neuron; D: the camera's distance; az: its turn.
    tl.set({ c: 0, una: 0, marca: 0, D: 3.5, az: 0.5 });
    tl.label('una').caption(3.0, 'Una', 'Cambiamos una sola neurona tuya por una artificial que hace exactamente lo mismo. Sigues siendo tú.');
    tl.to(1.2, { marca: 1, az: 0.62 });
    tl.to(1.8, { una: 1, az: 0.8 });
    tl.label('otra').caption(5.0, 'Y otra', 'Y otra. Y otra más. En ningún momento sientes que te apagas.');
    tl.to(1.2, { c: 0.04, marca: 0, az: 0.95, D: 3.3 });
    tl.to(3.8, { c: 0.97, az: 1.6, D: 3.0 });
    tl.label('todas').caption(3.6, 'Todas', 'Ya no queda ninguna de las de antes. El punto sigue encendido. ¿Es el mismo?');
    tl.to(1.0, { c: 1, az: 1.75 });
    tl.to(2.6, { az: 2.05, D: 2.5 });

    const pos = V();
    const scr = { x: 0, y: 0, z: 0 };
    const arriba = V(0, 0.72, 0);

    return {
      tl,
      // The last wall is off the ladder: here the clock is out.
      cuenta: () => null,
      rotulo(p): Rotulo | null {
        const cp = tl.captionAt(p);
        return cp ? { capitulo: CAP, name: cp.name, fact: cp.fact } : null;
      },
      placa(g, f) {
        const m = tl.get('marca', f.p);
        if (m > 0.02) {
          proyectar(PRIMERA, camera, f.W, f.H, scr);
          nota(g, f.u, scr.x, scr.y, 'una neurona', 50, -44, m);
        }
        const c = tl.get('c', f.p);
        if (c > 0.02) {
          proyectar(arriba, camera, f.W, f.H, scr);
          const pc = c >= 0.999 ? '100' : String(Math.min(99, Math.round(c * 100)));
          nota(g, f.u, scr.x, scr.y, `${pc} % cambiado`, 60, -40, ease(0.02, 0.08, c) * 0.9);
        }
      },
      update(f: Frame) {
        const p = f.p;
        camera.near = 0.02;
        camera.far = 200;
        camera.fov = 40;
        const az = tl.get('az', p) + f.time * 0.01;
        const D = tl.get('D', p);
        pos.set(Math.sin(az) * D, 0.25 + 0.1 * D, Math.cos(az) * D);
        camera.position.copy(pos);
        camera.up.set(0, 1, 0);
        camera.lookAt(TU_EN);

        const c = tl.get('c', p);
        enfocar(nube, f.focal, f.dpr, f.time);
        nube.u.uMaxPx.value = 4 * f.dpr;
        nube.u.uGain.value = 0.1;
        nube.u.uC.value = c;
        enfocar(primera, f.focal, f.dpr, f.time);
        primera.u.uMinPx.value = 3.5 * f.dpr;
        primera.u.uUna.value = tl.get('una', p);
        primera.u.uGain.value = (1.2 + 1.6 * tl.get('una', p)) * (1 - ease(0.05, 0.4, c));
        enfocar(tu, f.focal, f.dpr, f.time);
        tu.u.uMinPx.value = 5 * f.dpr;
        tu.u.uGain.value = 2.8;
      },
      dispose() {},
    };
  },
};
