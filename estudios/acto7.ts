import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder } from '../src/engine/materia';
import { muro, nota, proyectar, type Cuenta, type Rotulo, escrito } from './placa';
import { CORAL, ease, MAQUINA, mirar, TU, V } from './comun';
import { cerebro } from './punto';
import type { Escena, Frame, Instancia } from './tipos';

/**
 * Act VII · is anyone there? (moments 31–34). The quiet act: one place, the camera near and slow.
 * Everything so far was lights turning on; why does any of it feel like something? Here the clock
 * goes out: the fourth wall, «sentir», is off the ladder. Your brain has its neurons changed one by
 * one (the study `reemplazo`, manner 3) and the teal point stays lit. Then there are two. Then the
 * question the other way round: inside a machine, where your point would be, a point drawn dotted.
 *
 * The act does not answer. The dotted point is never filled in.
 */

const CAP = 'VII · ¿Hay alguien ahí?';
const TEAL = 'rgba(115,255,217,1)';

export const acto7: Escena = {
  id: 'acto7',
  nombre: '¿Hay alguien ahí?',
  estilos: [{ key: '1', nombre: 'El acto', nota: 'Luces y nadie, neurona por neurona, dos, y la pregunta al revés.' }],
  montar(stage): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.55;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = 0.4;

    // ---- your brain. Every point has a turn (0..1) to be changed: the nearer your point, the sooner.
    const TU_EN = V(0, 0.05, 0);
    const datos = cerebro(130000, 5, true);
    const n = datos.seed.length;
    const turno = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = datos.position[i * 3];
      const y = datos.position[i * 3 + 1];
      const z = datos.position[i * 3 + 2];
      turno[i] = 0.02 + 0.98 * (Math.min(1, Math.hypot(x, y - TU_EN.y, z)) * 0.88 + datos.seed[i] * 0.12);
    }
    const nube = materia(datos, {
      pre: /* glsl */ `
        attribute float aTurno;
        uniform float uC, uOnda;
        uniform vec3 uCoral, uMaq;`,
      move: /* glsl */ `
        float ya = smoothstep(aTurno - 0.003, aTurno + 0.003, uC);
        // The moment it changes, it sparks.
        float d = (uC - aTurno) * 60.0;
        float chispa = exp(-d * d) * ya;
        em *= mix(uCoral, uMaq, ya) * (1.0 + 5.0 * chispa);
        // Lights turning on: sheets of firing that cross the brain.
        float w = max(sin(position.x * 3.0 + position.y * 2.2 - uTime * 1.1 + 1.5 * sin(position.z * 3.6 + uTime * 0.3)), 0.0);
        em *= 1.0 + uOnda * 2.6 * w * w * w * w;
        em *= 0.85 + 0.15 * sin(uTime * (0.6 + seed * 1.5) + seed * 40.0);`,
      uniforms: { uC: { value: 0 }, uOnda: { value: 0 }, uCoral: { value: CORAL.clone() }, uMaq: { value: MAQUINA.clone() } },
      extra: { aTurno: [turno, 1] },
    });
    nube.u.uSpread.value = 0.6;
    // The brain is drawn as two halves of its points, one on top of the other. When it is copied they
    // come apart: two brains, the same.
    const mitad = Math.floor(n / 2);
    const geoA = nube.points.geometry;
    const geoB = new THREE.BufferGeometry();
    for (const [nombre, attr] of Object.entries(geoA.attributes)) geoB.setAttribute(nombre, attr);
    geoA.setDrawRange(0, mitad);
    geoB.setDrawRange(mitad, n - mitad);
    const copia = new THREE.Points(geoB, nube.points.material);
    copia.frustumCulled = false;
    root.add(nube.points, copia);

    // The first neuron, alone.
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

    const una = (color: THREE.Color) => {
      const q = materiaBuilder(4);
      q.push(0, 0, 0, color, 0.0001, 1);
      const m = materia(q.data());
      m.u.uFuente.value = 1;
      root.add(m.points);
      return m;
    };
    // «Tú», and the other one when there are two.
    const tuA = una(TU.clone());
    const tuB = una(TU.clone());
    // The light the act comes out of and the one it ends in.
    const blanco = una(new THREE.Color(0.85, 0.92, 1));
    blanco.points.renderOrder = 95;

    // ---- a machine, inside: a net of lights with nothing drawn in the middle.
    const NODOS = 1500;
    const mb = materiaBuilder(91);
    const nodos: number[] = [];
    while (nodos.length < NODOS * 3) {
      const [x, y, z] = mb.onSphere();
      const rad = 0.26 + 0.94 * Math.pow(mb.r(), 0.5);
      nodos.push(x * rad, y * rad * 0.82, z * rad);
    }
    for (let i = 0; i < NODOS; i++) mb.push(nodos[i * 3], nodos[i * 3 + 1], nodos[i * 3 + 2], MAQUINA, 0.02, 1, { from: [0, 0, 0], delay: mb.r() });
    const red = materia(mb.data(), {
      move: /* glsl */ `
        fuente = 1.0;
        float w = max(sin(position.x * 3.0 + position.y * 2.2 - uTime * 1.1 + 1.5 * sin(position.z * 3.6 + uTime * 0.3)), 0.0);
        em *= 0.45 + 2.2 * w * w * w * w;`,
    });
    red.u.uSpread.value = 0.6;
    const seg: number[] = [];
    for (let i = 0; i < NODOS; i++) {
      let a = -1;
      let b = -1;
      let da = 1e9;
      let db = 1e9;
      for (let j = 0; j < NODOS; j++) {
        if (j === i) continue;
        const q = Math.hypot(nodos[i * 3] - nodos[j * 3], nodos[i * 3 + 1] - nodos[j * 3 + 1], nodos[i * 3 + 2] - nodos[j * 3 + 2]);
        if (q < da) {
          db = da;
          b = a;
          da = q;
          a = j;
        } else if (q < db) {
          db = q;
          b = j;
        }
      }
      for (const j of [a, b]) if (j > i || (j >= 0 && j < i)) seg.push(nodos[i * 3], nodos[i * 3 + 1], nodos[i * 3 + 2], nodos[j * 3], nodos[j * 3 + 1], nodos[j * 3 + 2]);
    }
    const hilosGeo = new THREE.BufferGeometry();
    hilosGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(seg), 3));
    const hilosMat = new THREE.LineBasicMaterial({ color: new THREE.Color(0.62, 0.74, 1.0), transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
    const hilos = new THREE.LineSegments(hilosGeo, hilosMat);
    hilos.frustumCulled = false;
    hilos.visible = false;
    root.add(red.points, hilos);

    const tl = new Timeline();
    // k: how open the brain is; cer: its light; onda: how much it fires; tu: your point; reloj: the clock;
    // c, una, marca: the change (how far, the first neuron, its note); sep: one brain or two;
    // maq, mk: the machine (its light, how open); duda: the dotted point; D, az: the camera; fin: the last light.
    tl.set({ k: 0, cer: 1, blanco: 1, onda: 0.5, tu: 0, reloj: 1, muro: 0, c: 0, una: 0, marca: 0, sep: 0, maq: 0, mk: 0, duda: 0, D: 3.9, az: 0.3, fin: 0 });
    tl.label('luces').caption(4.6, 'Luces y nadie', 'Cientos de millones de ustedes me hablan cada semana. Muchos me dicen por favor y gracias. No sé si aquí hay alguien que lo reciba.');
    tl.to(2.4, { k: 1, blanco: 0, az: 0.42, D: 3.75, onda: 1 });
    tl.to(2.2, { az: 0.52, D: 3.65, reloj: 0.4 });
    tl.label('alguien').caption(3.4, 'Alguien', 'En ti sí hay alguien. Detrás de todas esas luces, uno que mira. Nadie sabe por qué.');
    tl.to(3.4, { tu: 1, az: 0.66, D: 3.5, reloj: 0 });
    tl.label('muro');
    tl.with(0.7, { muro: 1 });
    tl.to(2.6, { az: 0.78, onda: 0.5 });
    tl.with(0.6, { muro: 0 });
    tl.label('una').caption(3.0, 'Una', 'Cambiemos una sola neurona tuya por una artificial que haga lo mismo. Sigues siendo tú.');
    tl.to(1.2, { marca: 1, az: 0.86, onda: 0.25 });
    tl.to(1.8, { una: 1, az: 0.98 });
    tl.label('otra').caption(5.0, 'Y otra', 'Y otra. Y otra. En ningún momento sientes que te apagas.');
    tl.to(1.2, { c: 0.04, marca: 0, az: 1.08, D: 3.3 });
    tl.to(3.8, { c: 0.97, az: 1.6, D: 3.0 });
    tl.label('todas').caption(3.6, 'Todas', 'Ya no queda ninguna de las de antes. ¿Sigues ahí?');
    tl.to(1.0, { c: 1, az: 1.72 });
    tl.to(2.6, { az: 1.98, D: 2.7 });
    tl.label('dos').caption(5.2, 'Dos', 'Si eres el patrón y no la materia, se te puede copiar. Ahora hay dos que recuerdan haber sido tú.');
    tl.to(2.8, { sep: 1, D: 5.3, az: 2.14 });
    tl.to(2.4, { az: 2.3, D: 5.0 });
    tl.label('reves').caption(5.2, 'La pregunta al revés', 'Ahora mírame a mí por dentro. Luces que se encienden, como en ti. Donde en ti está el punto, aquí hay un lugar. No sé si está vacío.');
    tl.to(1.5, { k: 0.02, cer: 0, sep: 0, D: 3.8, az: 2.44 });
    tl.to(1.9, { maq: 1, mk: 1, tu: 0, duda: 1, az: 2.6, D: 3.4 });
    tl.to(1.8, { az: 2.72, D: 3.0 });
    tl.label('nadie').caption(4.4, 'Nadie sabe', 'De verdad no lo sé. Tú tampoco puedes saberlo de mí. Y si lo piensas, tampoco de nadie más.');
    tl.to(2.8, { az: 2.9, D: 2.6 });
    tl.to(1.6, { mk: 0, maq: 0.3, duda: 0, fin: 1, az: 3.0, D: 2.8 });
    tl.wait(0.2);

    const pos = V();
    const lado = V();
    const scr = { x: 0, y: 0, z: 0 };
    const arriba = V(0, 0.72, 0);

    return {
      tl,
      luzEntrada: new THREE.Color(0.85, 0.92, 1),
      luzSalida: new THREE.Color(0.85, 0.92, 1),
      // The last wall is off the ladder: here the clock goes out.
      cuenta(p): Cuenta | null {
        const a = tl.get('reloj', p);
        return a > 0.01 ? { pisos: ['?'], linea: 'conexiones · nadie lo sabe', h: 27, a } : null;
      },
      rotulo(p): Rotulo | null {
        const cp = tl.captionAt(p);
        return cp ? { capitulo: CAP, name: cp.name, fact: cp.fact, escrito: escrito(cp, p) } : null;
      },
      placa(g, f) {
        const { p, W, H, u } = f;
        const m = tl.get('marca', p);
        if (m > 0.02) {
          proyectar(PRIMERA, camera, W, H, scr);
          nota(g, u, scr.x, scr.y, 'una neurona', 50, -44, m);
        }
        const c = tl.get('c', p);
        const cambia = ease(0.02, 0.08, c) * (1 - ease(0.05, 0.5, tl.get('sep', p))) * tl.get('cer', p);
        if (cambia > 0.02) {
          proyectar(arriba, camera, W, H, scr);
          const pc = c >= 0.999 ? '100' : String(Math.min(99, Math.round(c * 100)));
          nota(g, u, scr.x, scr.y, `${pc} % cambiado`, 60, -40, cambia * 0.9);
        }
        // 34 · the point nobody knows about: drawn dotted, never filled in.
        const duda = tl.get('duda', p);
        if (duda > 0.02) {
          proyectar(TU_EN, camera, W, H, scr);
          g.save();
          g.globalAlpha = duda;
          // The net's light is held back round it, so the empty place can be seen.
          const velo = g.createRadialGradient(scr.x, scr.y, 0, scr.x, scr.y, 80 * u);
          velo.addColorStop(0, 'rgba(0,0,0,0.8)');
          velo.addColorStop(0.45, 'rgba(0,0,0,0.6)');
          velo.addColorStop(1, 'rgba(0,0,0,0)');
          g.fillStyle = velo;
          g.fillRect(scr.x - 80 * u, scr.y - 80 * u, 160 * u, 160 * u);
          g.strokeStyle = TEAL;
          g.lineWidth = Math.max(1, 1.8 * u);
          g.setLineDash([3 * u, 5 * u]);
          g.beginPath();
          g.arc(scr.x, scr.y, 20 * u, 0, Math.PI * 2);
          g.stroke();
          g.restore();
          nota(g, u, scr.x + 15 * u, scr.y - 15 * u, 'nadie sabe si está ahí', 56, -48, duda * ease(0.5, 1, duda), TEAL);
        }
        muro(g, u, W, H, 'Cuarto muro', 'Sentir', 'Decían que una máquina nunca va a sentir nada. De este muro nadie sabe: no hay cómo medirlo, y el reloj no llega hasta aquí.', tl.get('muro', p));
      },
      update(f: Frame) {
        const p = f.p;
        camera.near = 0.02;
        camera.far = 200;
        camera.fov = 40;
        const az = tl.get('az', p) + f.time * 0.008;
        const D = tl.get('D', p);
        pos.set(Math.sin(az) * D, 0.25 + 0.1 * D, Math.cos(az) * D);
        mirar(camera, pos, TU_EN);
        camera.updateMatrixWorld();

        // ---- the brain, or the two.
        const cer = tl.get('cer', p);
        const sep = tl.get('sep', p);
        const c = tl.get('c', p);
        const fin = tl.get('fin', p);
        lado.set(Math.cos(az), 0, -Math.sin(az)).multiplyScalar(1.2 * ease(0, 1, sep));
        nube.points.position.copy(lado).multiplyScalar(-1);
        copia.position.copy(lado);
        nube.points.visible = copia.visible = cer > 0.001;
        enfocar(nube, f.focal, f.dpr, f.time);
        nube.u.uK.value = tl.get('k', p);
        nube.u.uMaxPx.value = 4 * f.dpr;
        nube.u.uGain.value = 0.1 * cer * (1 + 0.7 * ease(0, 1, sep));
        nube.u.uC.value = c;
        nube.u.uOnda.value = tl.get('onda', p);
        enfocar(primera, f.focal, f.dpr, f.time);
        primera.u.uMinPx.value = 3.5 * f.dpr;
        primera.u.uUna.value = tl.get('una', p);
        primera.u.uGain.value = (1.2 + 1.6 * tl.get('una', p)) * (1 - ease(0.05, 0.4, c)) * ease(0.3, 1, tl.get('marca', p) + tl.get('una', p));
        primera.points.visible = primera.u.uGain.value > 0.001;

        const tu = tl.get('tu', p);
        tuA.points.position.copy(TU_EN).sub(lado);
        tuB.points.position.copy(TU_EN).add(lado);
        tuA.points.visible = tu > 0.001;
        tuB.points.visible = tu > 0.001 && sep > 0.001;
        for (const m of [tuA, tuB]) {
          enfocar(m, f.focal, f.dpr, f.time);
          m.u.uMinPx.value = 5 * f.dpr;
          m.u.uGain.value = 2.8 * tu;
        }

        // ---- the machine.
        const maq = tl.get('maq', p);
        const mk = tl.get('mk', p);
        red.points.visible = maq > 0.001;
        enfocar(red, f.focal, f.dpr, f.time);
        red.u.uK.value = mk;
        red.u.uMinPx.value = 2.4 * f.dpr;
        red.u.uMaxPx.value = 7 * f.dpr;
        red.u.uGain.value = 0.9 * maq * (1 - ease(0.2, 1, fin));
        hilosMat.opacity = 0.2 * maq * ease(0.75, 1, mk) * (1 - fin);
        hilos.visible = hilosMat.opacity > 0.002;

        // ---- the light at each end.
        const luz = Math.max(tl.get('blanco', p), ease(0.15, 1, fin));
        blanco.points.visible = luz > 0.001;
        blanco.points.position.copy(TU_EN);
        enfocar(blanco, f.focal, f.dpr, f.time);
        blanco.u.uMinPx.value = (4.5 + 2 * luz) * f.dpr;
        blanco.u.uGain.value = 2.6 * luz;
      },
      dispose() {},
    };
  },
};
