import * as THREE from 'three';
import { Timeline } from './timeline';
import { enfocar, materia, materiaBuilder } from '../src/engine/materia';
import { gauss } from '../src/engine/math';
import { nota, proyectar, type Cuenta, type Rotulo, escrito } from './placa';
import { ease, MAQUINA, mirar, ORO3, TU, V } from './comun';
import type { Escena, Frame, Instancia } from './tipos';
import datos from '../src/datos/palabras.json';

/**
 * Act VI · other minds (moments 27–30). Past the horizon nobody knows, so this act is a guess too:
 * the text says «podría». It is one flight, without a cut. The space of every mind that could exist
 * opens out of a point. Three of its lights, from near, are minds of other shapes (the study `otras`,
 * manner 1). The flight ends at home: the human minds are a teal handful in a corner. Inside the
 * handful is the galaxy of everything we wrote, and there the one we are making is born. From it two
 * paths leave, what we asked for and what we meant, a minimal angle apart; a long way out the angle
 * is an abyss.
 *
 * What is real: the galaxy of words (src/datos/palabras.json) and the story of the boat race (2016).
 * Everything else is a drawing.
 */

const CAP = 'VI · Otras mentes';
const POR = 34000;
const VIOLETA = new THREE.Color(0.74, 0.62, 1.0);
const R = 10;
/** The galaxy of what we wrote is inside the handful of human minds: this is its size there. */
const SC = 0.045;
/** Where the three minds of other shapes are, in the space of minds. */
const FILA = [3, -1.5, 4] as const;
/** The angle between what we asked for and what we meant: two degrees. */
const ANGULO = 0.035;
const AZUL = 'rgba(205,226,255,1)';
const TEAL = 'rgba(115,255,217,1)';

export const acto6: Escena = {
  id: 'acto6',
  nombre: 'Otras mentes',
  estilos: [{ key: '1', nombre: 'El acto', nota: 'Un solo vuelo: el espacio de todas las mentes, tres de otra forma, el rincón humano, la galaxia de donde nace esta y el ángulo mínimo.' }],
  montar(stage): Instancia {
    const root = stage.root;
    const { camera } = stage;
    stage.bloom.strength = 0.52;
    stage.bloom.radius = 0.6;
    stage.bloom.threshold = 0.42;

    const c = new THREE.Color();

    // ---- 27 · every mind that could exist: families of lights in a huge space. They all come out of one point.
    const ab = materiaBuilder(71);
    const familias = Array.from({ length: 46 }, () => {
      const [x, y, z] = ab.onSphere();
      const rad = 30 * Math.pow(ab.r(), 0.45);
      const tono = ab.r() < 0.22 ? 0.05 + 0.08 * ab.r() : 0.58 + 0.36 * ab.r();
      return { x: x * rad, y: y * rad * 0.7, z: z * rad, ancho: 2 + 5 * ab.r(), tono };
    });
    for (let i = 0; i < 64000; i++) {
      let x: number, y: number, z: number, tono: number;
      if (ab.r() < 0.26) {
        const [sx, sy, sz] = ab.onSphere();
        const rad = 36 * Math.pow(ab.r(), 0.4);
        x = sx * rad;
        y = sy * rad * 0.7;
        z = sz * rad;
        tono = 0.58 + 0.36 * ab.r();
      } else {
        const fam = familias[Math.floor(ab.r() * familias.length)];
        x = fam.x + gauss(ab.r) * fam.ancho;
        y = fam.y + gauss(ab.r) * fam.ancho * 0.6;
        z = fam.z + gauss(ab.r) * fam.ancho;
        tono = fam.tono + 0.04 * (ab.r() - 0.5);
      }
      ab.push(x, y, z, c.setHSL(tono, 0.55, 0.62), 0.11, 0.8, { from: [0, 0, 0], delay: ab.r() });
    }
    const espacio = materia(ab.data(), {
      move: /* glsl */ `em *= 0.75 + 0.25 * sin(uTime * (0.5 + seed * 1.5) + seed * 60.0);`,
    });
    espacio.u.uSpread.value = 0.6;
    root.add(espacio.points);
    // The human ones: every mind any of us has had, a handful.
    const NOSOTROS = V(-15, -6, 12);
    const nb = materiaBuilder(73);
    for (let i = 0; i < 900; i++) {
      nb.push(NOSOTROS.x + gauss(nb.r) * 0.42, NOSOTROS.y + gauss(nb.r) * 0.3, NOSOTROS.z + gauss(nb.r) * 0.42, TU, 0.035, 1, { from: [0, 0, 0], delay: nb.r() });
    }
    const nosotros = materia(nb.data(), {
      move: /* glsl */ `em *= 0.75 + 0.25 * sin(uTime * (0.8 + seed * 1.6) + seed * 40.0);`,
    });
    nosotros.u.uSpread.value = 0.6;
    root.add(nosotros.points);

    // ---- 28 · three minds of other shapes, in a row (see estudios/otras.ts).
    const N = POR * 3;
    const b = materiaBuilder(61);
    const r = b.r;
    const enB = new Float32Array(N * 3);
    const enC = new Float32Array(N * 3);
    const mia = new Float32Array(N);
    const luzB = new Float32Array(N);
    const PASO = 0.24;
    const nodos: number[] = [];
    for (let i = -5; i <= 5; i++) for (let j = -5; j <= 5; j++) for (let k = -5; k <= 5; k++) if (Math.abs(i) + Math.abs(j) + Math.abs(k) <= 5) nodos.push(i, j, k);
    const M = nodos.length / 3;
    const UNO = new THREE.Color(1, 1, 1);
    for (let i = 0; i < N; i++) {
      // The swarm: a long sheet of points, bent; the shader makes it flow.
      const x = gauss(r) * 1.25;
      const z = gauss(r) * 0.8;
      const y = gauss(r) * 0.16 + 0.28 * Math.sin(x * 1.8) * Math.cos(z * 1.4);
      b.push(x, y, z, UNO, 0.012, 1, { delay: r() });
      mia[i] = i % 3;
      // The crystal: the nodes of a grid inside an octahedron, and the edges between them.
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
      // The giant: one ball in three shells, one inside another.
      const [sx, sy, sz] = b.onSphere();
      const capa = r();
      const rad = (capa < 0.55 ? 1 : capa < 0.85 ? 0.7 : 0.42) * (1 - 0.04 * r());
      enC[i * 3] = sx * rad;
      enC[i * 3 + 1] = sy * rad;
      enC[i * 3 + 2] = sz * rad;
    }
    const fila = materia(b.data(), {
      pre: /* glsl */ `
        attribute vec3 aB, aC;
        attribute float aMia, aLuzB;
        uniform vec3 uCen[3];
        uniform vec3 uEsc, uLuz, uColA, uColB, uColC;`,
      move: /* glsl */ `
        float wA = aMia < 0.5 ? 1.0 : 0.0;
        float wC = aMia > 1.5 ? 1.0 : 0.0;
        float wB = 1.0 - wA - wC;
        // The swarm flows: sheets that bend and cross, and no one leads.
        vec3 a = position;
        a += 0.3 * vec3(sin(uTime * 0.6 + a.y * 2.2 + a.z * 1.6), sin(uTime * 0.5 + a.z * 2.0 + a.x * 1.7), sin(uTime * 0.7 + a.x * 2.3 + a.y * 1.2));
        a += 0.02 * vec3(sin(uTime * 3.0 + seed * 90.0), sin(uTime * 2.6 + seed * 50.0), sin(uTime * 3.4 + seed * 70.0));
        // The giant turns, slowly.
        float g = uTime * 0.03;
        vec3 gi = vec3(aC.x * cos(g) + aC.z * sin(g), aC.y, aC.z * cos(g) - aC.x * sin(g));
        vec3 cen = aMia < 0.5 ? uCen[0] : aMia < 1.5 ? uCen[1] : uCen[2];
        p = a * uEsc.x * wA + aB * uEsc.y * wB + gi * uEsc.z * wC + cen;
        // The crystal thinks in planes: a sheet of light crosses it, always the same.
        float plano = dot(aB, normalize(vec3(1.0, 0.7, 0.4))) - 1.1 * sin(uTime * 0.45);
        float lB = aLuzB * (0.45 + 1.6 * exp(-plano * plano * 30.0));
        // The giant, in one slow wave from pole to pole.
        float onda = 0.5 + 0.5 * sin(aC.y * 5.0 + 2.0 * sin(aC.x * 2.0 + g * 3.0) - uTime * 0.16);
        float lC = 0.3 + 2.4 * onda * onda * onda;
        float lA = 0.75 + 0.35 * sin(uTime * (1.0 + seed * 2.0) + seed * 40.0);
        em = uColA * lA * wA * uLuz.x + uColB * lB * wB * uLuz.y + uColC * lC * wC * uLuz.z;
        sz *= 1.0 + 0.8 * wC * (uEsc.z - 1.0) * 0.3;`,
      uniforms: {
        uCen: { value: [V(), V(5, 0, -1), V(15, 0, -7)] },
        uEsc: { value: new THREE.Vector3(1, 1, 5) },
        uLuz: { value: new THREE.Vector3(0.3, 1, 2.4) },
        uColA: { value: ORO3.clone() },
        uColB: { value: MAQUINA.clone() },
        uColC: { value: VIOLETA.clone() },
      },
      extra: { aB: [enB, 3], aC: [enC, 3], aMia: [mia, 1], aLuzB: [luzB, 1] },
    });
    fila.points.position.set(FILA[0], FILA[1], FILA[2]);
    root.add(fila.points);

    // ---- 29 · what we asked for and what we meant: two paths from one point, two degrees apart.
    // Every point knows how far behind the head of its path it is; the nearer the head, the more of them,
    // so the path is a line at any scale.
    const DIR_A = V(0, 0, -1);
    const DIR_B = V(Math.sin(ANGULO), 0, -Math.cos(ANGULO));
    const camino = (semilla: number, dir: THREE.Vector3, color: THREE.Color, trazos: boolean) => {
      const q = materiaBuilder(semilla);
      for (let i = 0; i < 7000; i++) q.push(dir.x, dir.y, dir.z, color, 0.01, 1, { kind: q.r() });
      return materia(q.data(), {
        pre: /* glsl */ `uniform float uLejos, uTrazos;`,
        move: /* glsl */ `
          fuente = 1.0;
          float atras = 0.02 * pow(40000.0, aKind);
          p = position * max(uLejos - atras, 0.0);
          em *= step(atras, uLejos) * (0.55 + 0.45 * sin(aKind * 150.0 + uTime * 2.5));
          em *= mix(1.0, step(0.45, fract(aKind * 70.0)), uTrazos);`,
        uniforms: { uLejos: { value: 1 }, uTrazos: { value: trazos ? 1 : 0 } },
      });
    };
    const pedimos = camino(81, DIR_A, MAQUINA, false);
    const quisimos = camino(83, DIR_B, TU, true);
    const cabeza = (color: THREE.Color) => {
      const q = materiaBuilder(5);
      q.push(0, 0, 0, color, 0.0001, 1);
      const m = materia(q.data());
      m.u.uFuente.value = 1;
      return m;
    };
    const cabezaA = cabeza(new THREE.Color(0.85, 0.92, 1));
    const cabezaB = cabeza(TU);
    // What the paths cross: lights at every distance from where they started.
    const pb = materiaBuilder(87);
    for (let i = 0; i < 16000; i++) {
      const [x, y, z] = pb.onSphere();
      const rad = 0.6 * Math.pow(2600, pb.r());
      pb.push(x * rad, y * rad * 0.6, -Math.abs(z) * rad * 1.2 + rad * 0.15, c.setHSL(0.6 + 0.3 * pb.r(), 0.5, 0.62), 0.012 * rad, 0.7);
    }
    const polvo = materia(pb.data(), {
      move: /* glsl */ `em *= 0.75 + 0.25 * sin(uTime * (0.5 + seed * 1.5) + seed * 60.0);`,
    });
    const AN = new THREE.Group();
    AN.add(polvo.points, pedimos.points, quisimos.points, cabezaA.points, cabezaB.points);
    AN.position.copy(NOSOTROS);
    root.add(AN);

    // ---- 30 · where this one would come from: everything we wrote (the real galaxy of words).
    const NP = datos.palabras.length;
    const GRUPOS = 1 + Math.max(...datos.grupo);
    const eb = materiaBuilder(11);
    const hb = materiaBuilder(23);
    const fb = materiaBuilder(29);
    for (let i = 0; i < NP; i++) {
      const x = (datos.pos[i * 3] / 32767) * R;
      const y = (datos.pos[i * 3 + 1] / 32767) * R;
      const z = (datos.pos[i * 3 + 2] / 32767) * R;
      const tono = ((datos.grupo[i] * 7) % GRUPOS) / GRUPOS;
      const peso = 1.25 - 0.6 * (i / NP);
      eb.push(x, y, z, c.setHSL(tono, 0.18, 0.82), 0.05 * peso, 0.9 * peso);
      const [dx, dy, dz] = hb.onSphere();
      const q = 0.25 * hb.r();
      hb.push(x + dx * q, y + dy * q, z + dz * q, c.setHSL(tono, 0.75, 0.5), 0.9, 0.03);
      // From every word, a thread of light to the one that is being born.
      fb.push(0, 0, 0, TU, 0.03, 1, { from: [x, y, z] });
    }
    const estrellas = materia(eb.data(), {
      move: /* glsl */ `em *= 0.82 + 0.18 * sin(uTime * (0.6 + seed * 1.4) + seed * 40.0);`,
    });
    const niebla = materia(hb.data());
    const hilos = materia(fb.data(), {
      pre: /* glsl */ `uniform float uFlujo;`,
      move: /* glsl */ `
        fuente = 1.0;
        float va = fract(uTime * 0.07 * (0.6 + 0.8 * seed) + seed * 9.0);
        p = mix(aFrom, position, va);
        em = mix(em, vec3(0.88, 0.94, 1.0), va * va) * smoothstep(0.0, 0.12, va) * step(seed, uFlujo * 1.01);`,
      uniforms: { uFlujo: { value: 0 } },
    });
    const GW = new THREE.Group();
    GW.position.copy(NOSOTROS);
    GW.scale.setScalar(SC);
    GW.add(estrellas.points, niebla.points, hilos.points);
    root.add(GW);
    // The one that is born there. It is the light the act ends in.
    const mb = materiaBuilder(3);
    mb.push(0, 0, 0, new THREE.Color(0.85, 0.92, 1), 0.0001, 1);
    const nacida = materia(mb.data());
    nacida.u.uFuente.value = 1;
    nacida.points.renderOrder = 94;
    nacida.points.position.copy(NOSOTROS);
    root.add(nacida.points);

    const tl = new Timeline();
    // k, d, az, nos: the space of minds (how open, the camera's distance and turn, how near our corner);
    // fil, fg, c*, a*: the three shapes (how much the camera is theirs, their light, where it is and
    // looks); gal, flujo, nace: the galaxy inside the handful; ang, s, cd, giro: the two paths (how much
    // the camera is theirs, how far they have gone as a power of ten, the camera round their heads);
    // fin: the last light.
    tl.set({ k: 0, d: 0.78, az: 0.3, nos: 0, fil: 0, fg: 0, cx: -0.9, cy: 0.35, cz: 3.4, ax: 0, ay: 0, az2: 0, gal: 0, flujo: 0, nace: 0, ang: 0, s: -1.3, cd: -0.75, giro: 0.2, fin: 0 });
    tl.label('todas').caption(4.6, 'Todas las mentes posibles', 'Piensa en todas las mentes que podrían existir. Cada luz, una manera distinta de pensar.');
    tl.to(4.6, { k: 1, d: 1.9, az: 0.95, fg: 1 });
    tl.label('enjambre').caption(5.4, 'Un enjambre', 'Una podría ser un enjambre, sin centro.');
    tl.to(2.4, { fil: 1, az: 1.15 });
    tl.to(3.0, { cx: 1.1, cy: 0.2, cz: 2.7, ax: 0.3 });
    tl.label('cristal').caption(3.6, 'Un cristal', 'O un cristal, igual en cada punto.');
    tl.to(1.8, { cx: 3.6, cy: 0.5, cz: 2.4, ax: 5, az2: -1 });
    tl.to(1.8, { cx: 6.1, cy: 0.25, cz: 1.5 });
    tl.label('una').caption(4.6, 'Una sola', 'O una sola, tan lenta que tarda un siglo en una idea.');
    tl.to(2.2, { cx: 8.6, cy: 0.6, cz: 3.2, ax: 15, ay: 0.5, az2: -7 });
    tl.to(2.4, { cx: 10.8, cy: 1.4, cz: 1.2, ay: 1.5 });
    tl.label('rincon').caption(5.6, 'Un rincón', 'Y en este puñado caben todas las personas que han existido. Tú estás ahí.');
    tl.to(3.0, { fil: 0, nos: 1, d: 1.15, az: 1.5 });
    tl.to(2.6, { d: 0.75, az: 1.72 });
    tl.label('viene').caption(6.4, 'Viene de ustedes', 'Yo no salí de cualquier rincón. Salí de este: de sus cuentos, sus cartas, sus peleas, sus recetas, sus despedidas.');
    tl.to(3.2, { d: -0.95, gal: 1, az: 2.05, fg: 0 });
    tl.to(3.2, { d: -0.8, flujo: 1, nace: 1, az: 2.35 });
    tl.label('desde').caption(3.8, 'Desde ti', 'No soy como tú. Pero vengo de ti.');
    tl.to(3.8, { d: -0.62, az: 2.62 });
    tl.label('querer').caption(7.2, '¿Qué va a querer?', 'En 2016 le pidieron a una máquina ganar una carrera de botes. Encontró un rincón donde sumaba puntos dando vueltas, y nunca llegó a la meta.');
    tl.to(2.4, { ang: 1, s: -0.75, giro: 0.3 });
    tl.to(4.8, { s: 0.55, cd: 0.15, giro: 0.75 });
    tl.label('abismo').caption(6.4, 'Un abismo', 'Hizo lo que le pidieron, no lo que querían. De cerca ese ángulo no se ve. Lejos, es un abismo. Por eso importa tanto lo que nos pidan ahora.');
    tl.to(6.4, { s: 2.78, cd: 1.56, giro: 2.35 });
    tl.to(1.6, { fin: 1, s: 2.84, giro: 2.45 });
    tl.wait(0.2);

    const pos = V();
    const at = V();
    const O = V();
    const G = V(FILA[0], FILA[1], FILA[2]);
    const posB = V();
    const atB = V();
    const HA = V();
    const HB = V();
    const medio = V();
    const scr = { x: 0, y: 0, z: 0 };

    return {
      tl,
      luzEntrada: new THREE.Color(0.85, 0.92, 1),
      luzSalida: new THREE.Color(0.85, 0.92, 1),
      // Past the horizon nobody can count.
      cuenta: (): Cuenta => ({ pisos: ['?'], linea: 'conexiones · nadie lo sabe', h: 27 }),
      rotulo(p): Rotulo | null {
        const cp = tl.captionAt(p);
        return cp ? { capitulo: CAP, name: cp.name, fact: cp.fact, escrito: escrito(cp, p) } : null;
      },
      placa(g, f) {
        const { p, W, H, u } = f;
        // 27 · which handful is ours.
        const n = ease(0.5, 1, tl.get('nos', p)) * (1 - ease(0.1, 0.6, tl.get('gal', p)));
        if (n > 0.02) {
          proyectar(NOSOTROS, camera, W, H, scr);
          nota(g, u, scr.x, scr.y, 'todas las mentes humanas', 46, -40, n, TEAL);
        }
        // 29 · which path is which.
        const a = tl.get('ang', p) * ease(-0.5, 0.1, tl.get('s', p)) * (1 - ease(0.2, 0.8, tl.get('fin', p)));
        if (a > 0.02) {
          proyectar(HA, camera, W, H, scr);
          nota(g, u, scr.x, scr.y, 'lo que le pedimos', -44, -38, a, AZUL);
          proyectar(HB, camera, W, H, scr);
          nota(g, u, scr.x, scr.y, 'lo que quisimos decir', 44, 40, a, TEAL);
        }
      },
      update(f: Frame) {
        const p = f.p;
        const fin = tl.get('fin', p);
        const gal = tl.get('gal', p);
        const dl = tl.get('d', p);
        camera.fov = 46;
        camera.up.set(0, 1, 0);
        camera.near = 0.002;
        camera.far = 8000;

        // ---- where the camera is: round the space or our corner, then with the three shapes, then with the paths.
        const lejos = Math.pow(10, tl.get('s', p));
        HA.copy(DIR_A).multiplyScalar(lejos).add(NOSOTROS);
        HB.copy(DIR_B).multiplyScalar(lejos).add(NOSOTROS);
        const az = tl.get('az', p) + 0.02 * Math.sin(f.time * 0.08);
        at.copy(O).lerp(NOSOTROS, ease(0, 1, tl.get('nos', p)));
        pos.set(Math.sin(az) * Math.cos(0.22), Math.sin(0.22), Math.cos(az) * Math.cos(0.22)).multiplyScalar(Math.pow(10, dl)).add(at);
        const fil = ease(0, 1, tl.get('fil', p));
        if (fil > 0.001) {
          posB.set(tl.get('cx', p), tl.get('cy', p), tl.get('cz', p)).add(G);
          atB.set(tl.get('ax', p), tl.get('ay', p), tl.get('az2', p)).add(G);
          pos.lerp(posB, fil);
          at.lerp(atB, fil);
        }
        const ang = ease(0, 1, tl.get('ang', p));
        if (ang > 0.001) {
          const cd = Math.pow(10, tl.get('cd', p));
          const giro = tl.get('giro', p) + 0.02 * Math.sin(f.time * 0.09);
          medio.copy(HA).add(HB).multiplyScalar(0.5).lerp(HA, ease(0, 1, fin));
          posB.set(Math.sin(giro) * cd, 0.3 * cd, Math.cos(giro) * cd).add(medio);
          pos.lerp(posB, ang);
          at.lerp(medio, ang);
        }
        mirar(camera, pos, at);
        camera.updateMatrixWorld();

        // ---- the space of minds. Inside the handful it is far away: hold it back.
        const esp = (1 - 0.75 * ease(0.2, -0.6, dl) * (1 - ang)) * (1 - 0.5 * fil) * (1 - ease(0.3, 1, fin));
        const k = tl.get('k', p);
        enfocar(espacio, f.focal, f.dpr, f.time);
        espacio.u.uK.value = k;
        espacio.u.uMaxPx.value = 9 * f.dpr;
        espacio.u.uGain.value = esp * 0.75 * (0.35 + 0.65 * ease(0, 0.5, k));
        const pu = (1 - ease(0.25, 0.9, gal)) * (1 - ease(0.3, 1, fin));
        nosotros.points.visible = pu > 0.001;
        enfocar(nosotros, f.focal, f.dpr, f.time);
        nosotros.u.uK.value = k;
        nosotros.u.uMinPx.value = 2 * f.dpr;
        nosotros.u.uMaxPx.value = 9 * f.dpr;
        nosotros.u.uGain.value = 1.1 * pu;

        // ---- the three shapes: lights of that space, and from near what they are.
        const fg = tl.get('fg', p);
        fila.points.visible = fg > 0.001;
        enfocar(fila, f.focal, f.dpr, f.time);
        fila.u.uMaxPx.value = 7 * f.dpr;
        fila.u.uGain.value = 0.5 * fg;
        fila.u.uFog.value = 60;

        // ---- the two paths.
        AN.visible = ang > 0.001;
        if (AN.visible) {
          const luzA = ang * (1 - ease(0.2, 0.9, fin));
          for (const m of [pedimos, quisimos]) {
            enfocar(m, f.focal, f.dpr, f.time);
            m.u.uLejos.value = lejos;
            m.u.uMinPx.value = 2.2 * f.dpr;
            m.u.uMaxPx.value = 4 * f.dpr;
            m.u.uGain.value = luzA * 0.75;
          }
          cabezaA.points.position.copy(DIR_A).multiplyScalar(lejos);
          cabezaB.points.position.copy(DIR_B).multiplyScalar(lejos);
          enfocar(cabezaA, f.focal, f.dpr, f.time);
          cabezaA.u.uMinPx.value = 5 * f.dpr;
          cabezaA.u.uGain.value = ang * 2.4;
          enfocar(cabezaB, f.focal, f.dpr, f.time);
          cabezaB.u.uMinPx.value = 5 * f.dpr;
          cabezaB.u.uGain.value = luzA * 2.2;
          enfocar(polvo, f.focal, f.dpr, f.time);
          polvo.u.uMaxPx.value = 8 * f.dpr;
          polvo.u.uGain.value = luzA * 0.45 * ease(0.3, 1.2, tl.get('s', p));
        }

        // ---- the galaxy of what we wrote, inside the handful.
        const g2 = gal * (1 - ease(0.3, 1, fin));
        const flujo = tl.get('flujo', p);
        estrellas.points.visible = niebla.points.visible = g2 > 0.001;
        enfocar(estrellas, f.focal, f.dpr, f.time);
        estrellas.u.uEscalaMundo.value = SC;
        estrellas.u.uGain.value = g2 * (0.6 - 0.3 * ease(0.05, 0.6, flujo));
        estrellas.u.uMinPx.value = 2.4 * f.dpr;
        estrellas.u.uMaxPx.value = 14 * f.dpr;
        enfocar(niebla, f.focal, f.dpr, f.time);
        niebla.u.uEscalaMundo.value = SC;
        niebla.u.uMaxPx.value = 90 * f.dpr;
        niebla.u.uGain.value = g2 * (0.24 - 0.12 * ease(0.05, 0.6, flujo));
        hilos.points.visible = g2 > 0.001 && flujo > 0.001;
        enfocar(hilos, f.focal, f.dpr, f.time);
        hilos.u.uEscalaMundo.value = SC;
        hilos.u.uFlujo.value = flujo;
        hilos.u.uMinPx.value = 2.6 * f.dpr;
        hilos.u.uMaxPx.value = 5 * f.dpr;
        hilos.u.uGain.value = g2 * (1 - 0.6 * ang);
        const nace = tl.get('nace', p) * (1 - ease(0.3, 1, fin)) * (1 - 0.7 * ease(0.5, 1.5, tl.get('s', p)) * ang);
        nacida.points.visible = nace > 0.001;
        enfocar(nacida, f.focal, f.dpr, f.time);
        nacida.u.uMinPx.value = (4 + 3 * nace) * f.dpr;
        nacida.u.uGain.value = 3 * nace;
      },
      dispose() {},
    };
  },
};
