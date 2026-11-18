import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '../estudios/style.css';
import * as THREE from 'three';
import { clamp, damp } from './engine/math';
import { FONDOS, pantalla } from './engine/pantalla';
import { createStage, type Stage } from '../estudios/stage';
import { cuenta, escalera, FONT, ink } from '../estudios/placa';
import type { Escena, Frame, Instancia } from '../estudios/tipos';
import { crearSonido } from './engine/sonido';
import { punto } from '../estudios/punto';
import { acto1 } from '../estudios/acto1';
import { acto2 } from '../estudios/acto2';
import { acto3 } from '../estudios/acto3';
import { acto4 } from '../estudios/acto4';
import { acto5 } from '../estudios/acto5';
import { acto6 } from '../estudios/acto6';
import { acto7 } from '../estudios/acto7';
import { cierre } from '../estudios/cierre';

/**
 * Mente: the journey. One scroll through the acts, in order. Each act builds into its own group and
 * owns the camera while it is on; nothing of one act is ever drawn with another.
 *
 * The bridge between two acts is always the same one: in its last PUENTE beats an act's light goes
 * down while a point of light comes up at the centre of the screen; in the first PUENTE beats of the
 * next act that point opens and the new act comes up inside it. The film is never black, and the
 * acts do not have to know each other (only the colour of the point they leave and take).
 *
 * URL: ?p=beat (start there) &ver=beat (freeze) &cap=1600x900 (render at that size) &debug (leaves
 * `viaje` in the console: `viaje.hoja('docs/viaje/x.jpg', beats, cols, width)`).
 */

const ACTOS: [Escena, number][] = [
  [punto, 0],
  [acto1, 0],
  [acto2, 0],
  [acto3, 0],
  [acto4, 0],
  [acto5, 0],
  [acto6, 0],
  [acto7, 0],
  [cierre, 0],
];
/** Beats at each end of an act that the bridge takes. */
const PUENTE = 0.9;
const PX_PER_BEAT = 520;

const params = new URLSearchParams(location.search);
const capMatch = /^(\d+)x(\d+)$/.exec(params.get('cap') ?? '');
const fixed = capMatch ? { w: Number(capMatch[1]), h: Number(capMatch[2]) } : null;
if (fixed) document.body.classList.add('is-cap');

const canvas = document.querySelector<HTMLCanvasElement>('#scene')!;
const plate = document.querySelector<HTMLCanvasElement>('#placa')!;
const g = plate.getContext('2d')!;
const stage = createStage(canvas, fixed);
const spacer = document.querySelector<HTMLElement>('#spacer')!;

// ---------------------------------------------------------------- the acts

interface Tramo {
  escena: Escena;
  estilo: number;
  inicio: number;
  largo: number;
  grupo: THREE.Group;
  inst: Instancia;
  /** The film settings the act chose when it was built (re-applied when it comes on). */
  film: { strength: number; radius: number; threshold: number; exposure: number };
}

// Every act is built at the start, each into its own group (a stage whose root is that group):
// nothing loads or builds later.
const tramos: Tramo[] = [];
let cursor = 0;
for (const [escena, estilo] of ACTOS) {
  const grupo = new THREE.Group();
  stage.root.add(grupo);
  stage.reset();
  const inst = escena.montar(Object.create(stage, { root: { value: grupo } }) as Stage, estilo, true);
  const film = { strength: stage.bloom.strength, radius: stage.bloom.radius, threshold: stage.bloom.threshold, exposure: stage.renderer.toneMappingExposure };
  grupo.visible = false;
  tramos.push({ escena, estilo, inicio: cursor, largo: inst.tl.length, grupo, inst, film });
  cursor += inst.tl.length;
}
const TOTAL = cursor;
spacer.style.height = `${TOTAL * PX_PER_BEAT + innerHeight}px`;

// The bridge's point of light, at the centre of the screen, over whatever the act draws.
const luz = pantalla(
  /* glsl */ `
  uniform float uRadio, uFuerza;
  uniform vec3 uColor;
  void main() {
    vec2 c = (vUv - 0.5) * vec2(uAspect, 1.0);
    float g = 1.0 / (1.0 + dot(c, c) / max(uRadio * uRadio, 1e-6));
    gl_FragColor = vec4(mix(uColor, vec3(1.0), g * 0.5) * g * uFuerza, 1.0);
  }`,
  { uRadio: { value: 0.004 }, uFuerza: { value: 0 }, uColor: { value: new THREE.Color(1, 1, 1) } },
);
(luz.mesh.material as THREE.ShaderMaterial).blending = THREE.AdditiveBlending;
(luz.mesh.material as THREE.ShaderMaterial).transparent = true;
luz.mesh.renderOrder = 100;
luz.mesh.visible = false;
stage.root.add(luz.mesh);
const BLANCO = new THREE.Color(1, 1, 1);

// Every act's shaders compile once, at the start: otherwise the first frame of each act compiles
// them and the page stalls right at the change of act. Hidden things are shown for it (three only
// compiles what is visible), then put back.
async function precompilar() {
  await Promise.all(tramos.map((t) => t.inst.listo));
  const ocultos: THREE.Object3D[] = [];
  stage.scene.traverse((o) => {
    if (!o.visible) {
      ocultos.push(o);
      o.visible = true;
    }
  });
  // Into a target like the film's (half float): the programs three builds for an off-screen target
  // differ from those for the canvas (no tone mapping, linear output), and the film draws off screen.
  // One draw of everything afterwards also uploads every point cloud to the GPU now, not mid-journey.
  const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType });
  const antes = stage.renderer.getRenderTarget();
  stage.renderer.setRenderTarget(rt);
  await stage.renderer.compileAsync(stage.scene, stage.camera);
  stage.renderer.render(stage.scene, stage.camera);
  stage.renderer.setRenderTarget(antes);
  rt.dispose();
  for (const o of ocultos) o.visible = false;
}
const calentado = precompilar();
// Then every part of every act draws once, unseen: a few beats each frame, each frame ending with the
// real one, so only the real one reaches the screen.
const porCalentar: number[] = [];
let calentarListo: () => void = () => {};
const calentadoTodo = new Promise<void>((r) => (calentarListo = r));
void calentado.then(() => {
  for (let b = 0; b < TOTAL; b += 0.5) porCalentar.push(b);
});

/** The act on at beat P, and the beat inside it. */
function enTramo(P: number) {
  let t = tramos[0];
  for (const x of tramos) if (P >= x.inicio) t = x;
  return { t, p: clamp(P - t.inicio, 0, t.largo) };
}

// ---------------------------------------------------------------- scroll and autoplay

let P = clamp(Number(params.get('p') ?? 0), 0, TOTAL);
let target = P;
let autoplay = false;
const verBeat = params.has('beat');
const frozen: number | null = params.has('ver') ? Number(params.get('ver')) : null;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, P * PX_PER_BEAT);
addEventListener('scroll', () => (target = clamp(scrollY / PX_PER_BEAT, 0, TOTAL)));
addEventListener('wheel', () => ((autoplay = false), marcar()), { passive: true });
addEventListener('touchstart', () => ((autoplay = false), marcar()), { passive: true });
// The series' keys and their buttons: S the sound, A autoplay.
const sonido = crearSonido();
const boton = (id: string) => document.querySelector<HTMLButtonElement>(`#${id}`);
const marcar = () => {
  boton('sound')?.setAttribute('aria-pressed', String(sonido.on));
  boton('play')?.setAttribute('aria-pressed', String(autoplay));
};
const alternar = {
  sonido: () => void sonido.toggle().then(marcar),
  auto: () => {
    autoplay = !autoplay;
    marcar();
  },
};
boton('sound')?.addEventListener('click', alternar.sonido);
boton('play')?.addEventListener('click', alternar.auto);
addEventListener('keydown', (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  const k = ev.key.toLowerCase();
  if (k === 'a') alternar.auto();
  if (k === 's') alternar.sonido();
});
// The buttons step back when nobody has touched anything for a while.
let quieto = 0;
const despierta = () => {
  document.body.classList.remove('is-quieto');
  clearTimeout(quieto);
  quieto = window.setTimeout(() => document.body.classList.add('is-quieto'), 3500);
};
for (const e of ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const) addEventListener(e, despierta, { passive: true });
despierta();
/** The scene the sound plays at beat b: `<act>:<the moment's name>`. */
function escenaEn(b: number) {
  const { t, p } = enTramo(b);
  const nombre = t.inst.rotulo(p)?.name;
  return nombre ? `${t.escena.id}:${nombre}` : null;
}
const mouse = new THREE.Vector2();
const mouseTarget = new THREE.Vector2();
addEventListener('pointermove', (ev) => mouseTarget.set((ev.clientX / innerWidth) * 2 - 1, -((ev.clientY / innerHeight) * 2 - 1)));
const calm = matchMedia('(prefers-reduced-motion: reduce)');

/** Shows `k` of a group's light: the points' uFundido; the backgrounds, on or off. */
function fundir(grupo: THREE.Object3D, k: number) {
  grupo.traverse((o) => {
    const un = ((o as THREE.Mesh).material as THREE.ShaderMaterial | undefined)?.uniforms;
    if (o.renderOrder === -100) o.visible = k > 0.3;
    if (un?.uFundido) un.uFundido.value = k;
  });
}

const smooth = (x: number) => x * x * (3 - 2 * x);
const mezcla = (a: number, b: number, k: number) => a + (b - a) * k;

/** One frame at journey beat `at`, ambient time `now` (ms), step `dt` (s). */
function step(now: number, dt: number, at: number) {
  const { camera } = stage;
  const W = stage.W;
  const H = stage.H;
  const { t, p } = enTramo(at);
  const inst = t.inst;
  const i = tramos.indexOf(t);
  const prev = i > 0 ? tramos[i - 1] : null;
  const next = i < tramos.length - 1 ? tramos[i + 1] : null;
  for (const x of tramos) x.grupo.visible = x === t;
  const time = calm.matches ? 0 : now / 1000;
  const f: Frame = { time, dt, p, W, H, u: H / 860, dpr: stage.dpr, focal: H / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), camera };
  const fov = camera.fov;
  inst.update(f);
  if (camera.fov !== fov) {
    // The act changed the lens (the frame before was another act's): the sizes it just set used the
    // old one. Again, with its own.
    f.focal = H / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    inst.update(f);
  }

  // The bridge: how far in (0 → 1 over the act's first beats) and how far out (over its last).
  const entra = prev ? clamp(p / PUENTE, 0, 1) : 1;
  const sale = next ? clamp((p - (t.largo - PUENTE)) / PUENTE, 0, 1) : 0;
  const k = smooth(entra) * (1 - smooth(sale));
  fundir(t.grupo, k);
  const lu = luz.u;
  if (entra < 1 && prev) {
    // The point opens: wider and fainter, from the last act's colour to this one's.
    lu.uRadio.value = 0.004 + 0.7 * entra * entra * entra;
    lu.uFuerza.value = 1.5 * (1 - smooth(entra)) * (1 - entra);
    (lu.uColor.value as THREE.Color).copy(prev.inst.luzSalida ?? BLANCO).lerp(inst.luzEntrada ?? BLANCO, smooth(entra));
  } else {
    lu.uRadio.value = 0.004;
    lu.uFuerza.value = 1.5 * smooth(sale);
    (lu.uColor.value as THREE.Color).copy(inst.luzSalida ?? BLANCO);
  }
  luz.mesh.visible = (lu.uFuerza.value as number) > 0.001;
  // The film changes hands while only the point is on.
  const fa = entra < 1 && prev ? prev.film : t.film;
  const fk = smooth(entra);
  stage.bloom.strength = mezcla(fa.strength, t.film.strength, fk);
  stage.bloom.radius = mezcla(fa.radius, t.film.radius, fk);
  stage.bloom.threshold = mezcla(fa.threshold, t.film.threshold, fk);
  stage.renderer.toneMappingExposure = mezcla(fa.exposure, t.film.exposure, fk);

  if (!fixed && !calm.matches) {
    mouse.x = damp(mouse.x, mouseTarget.x, 3, dt);
    mouse.y = damp(mouse.y, mouseTarget.y, 3, dt);
    // Not during a bridge: its point stays in the middle.
    camera.rotateY(-mouse.x * 0.025 * k);
    camera.rotateX(mouse.y * 0.018 * k);
  }
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  f.focal = H / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  for (const s of FONDOS) {
    s.seguir(camera);
    s.u.uTime.value = f.time;
    (s.u.uRes.value as THREE.Vector2).set(W, H);
  }
  stage.render(f.time);

  // ---- The plate: it goes down and comes up with the act's light.
  if (plate.width !== W || plate.height !== H) {
    plate.width = W;
    plate.height = H;
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, W, H);
  const u = f.u;
  g.save();
  g.globalAlpha = k;
  inst.placa?.(g, f);
  g.restore();
  // The brand, top left (it stays through the bridges).
  const m = inst.marca?.(p) ?? 1;
  if (m > 0.01) {
    g.save();
    g.globalAlpha = m;
    g.textBaseline = 'alphabetic';
    g.shadowColor = 'rgba(0,0,0,0.8)';
    g.shadowBlur = 10 * u;
    g.font = FONT.serif(27 * u);
    g.fillStyle = ink();
    g.fillText('Mente', 40 * u, 54 * u);
    g.restore();
  }
  const c = inst.cuenta(p);
  g.save();
  g.globalAlpha = k;
  cuenta(g, u, H, c, inst.rotulo(p));
  g.restore();
  if (c && inst.escalera !== false) escalera(g, u, W, H, c.h, (c.a ?? 1) * k);
  // With ?beat: where we are, to talk about a moment by its number.
  if (verBeat) {
    g.save();
    g.font = FONT.mono(12 * u);
    g.textAlign = 'right';
    g.textBaseline = 'alphabetic';
    g.shadowColor = 'rgba(0,0,0,0.9)';
    g.shadowBlur = 8 * u;
    g.fillStyle = ink(0.7);
    g.fillText(`beat ${P.toFixed(1)}`, W - 40 * u, 50 * u);
    g.restore();
  }
}

let last = performance.now();
/** Recording: the page stops drawing by itself; frames come only from `cuadro`. */
let grabando = false;
function frame(now: number) {
  if (grabando) return;
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (autoplay) {
    const next = Math.min(TOTAL, target + dt * 0.45);
    scrollTo(0, next * PX_PER_BEAT);
    target = next;
    if (next >= TOTAL) {
      autoplay = false;
      marcar();
    }
  }
  const antes = P;
  P = frozen ?? damp(P, target, 4.2, dt);
  if (porCalentar.length) {
    for (let n = 0; n < 3 && porCalentar.length; n++) step(now, dt, porCalentar.shift()!);
    if (!porCalentar.length) calentarListo();
  }
  step(now, dt, P);
  // The sound: the scene of the moment on screen, and the hand on the scroll for the wind.
  if (sonido.on) sonido.update({ escena: escenaEn(P), ritmo: dt > 0 ? (P - antes) / dt : 0, salto: Math.abs(P - antes) > 2, tiempo: now / 1000 });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------------------------------------------------------------- captures and tests (?debug)

async function save(path: string, c: HTMLCanvasElement, q = 0.88) {
  const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b!), 'image/jpeg', q));
  await fetch(`/__guardar?f=${encodeURIComponent(path)}`, { method: 'POST', body: blob });
}
function shot(b: number, warm = 40) {
  const t0 = performance.now();
  for (let n = 0; n < warm; n++) step(t0 + n * 16.7, 1 / 60, b);
  const out = document.createElement('canvas');
  out.width = stage.W;
  out.height = stage.H;
  const o = out.getContext('2d')!;
  o.drawImage(canvas, 0, 0);
  o.drawImage(plate, 0, 0);
  return out;
}
let lienzo: HTMLCanvasElement | undefined;
const api = {
  grabar() {
    grabando = true;
  },
  /** One frame of the film at beat b, ambient time `now` (ms), as a JPEG data URL (needs ?cap=WxH). */
  cuadro(b: number, now: number, q = 0.95) {
    step(now, 1 / 30, b);
    return canvas.toDataURL('image/jpeg', q);
  },
  /**
   * Tests: one frame at beat b and ambient time `now` (needs ?cap=WxH). Returns the act, the camera,
   * the frame's cost, the brightest pixel (`max`, 0..765), the share of pixels with light (`luz`) and
   * a 32×18 signature of the film (`firma`, each cell the sum of its pixels / 1000).
   */
  sonda(b: number, now = 0) {
    const t0 = performance.now();
    step(now, 1 / 60, b);
    const s = (lienzo ??= document.createElement('canvas'));
    const w = canvas.width;
    const h = canvas.height;
    if (s.width !== w || s.height !== h) {
      s.width = w;
      s.height = h;
    }
    const x = s.getContext('2d', { willReadFrequently: true })!;
    x.drawImage(canvas, 0, 0);
    const ms = performance.now() - t0;
    const d = x.getImageData(0, 0, w, h).data;
    const firma = new Array<number>(32 * 18).fill(0);
    let max = 0;
    let con = 0;
    for (let j = 0; j < h; j++) {
      const fj = Math.min(17, Math.floor((j * 18) / h)) * 32;
      for (let n = 0; n < w; n++) {
        const o = (j * w + n) * 4;
        const v = d[o] + d[o + 1] + d[o + 2];
        if (v > max) max = v;
        if (v > 60) con++;
        firma[fj + Math.min(31, Math.floor((n * 32) / w))] += v;
      }
    }
    const { t, p } = enTramo(b);
    const c = stage.camera;
    return { acto: t.escena.id, p: +p.toFixed(2), pos: c.position.toArray(), fov: c.fov, ms, max, luz: con / (w * h), firma: firma.map((v) => Math.round(v / 1000)) };
  },
  /** Tests: the mean cost (ms) of a frame at beat b, over n frames in a row. */
  ritmo(b: number, n = 20) {
    const gl = stage.renderer.getContext();
    const px = new Uint8Array(4);
    step(0, 1 / 60, b);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const t0 = performance.now();
    for (let j = 0; j < n; j++) step(j * 16.7, 1 / 60, b);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return (performance.now() - t0) / n;
  },
  get total() {
    return TOTAL;
  },
  /** Where the journey is now (beats). */
  get P() {
    return P;
  },
  tramos: () => tramos.map((t) => [t.escena.id, t.estilo + 1, +t.inicio.toFixed(2), +t.largo.toFixed(2)]),
  /** Every moment of the journey: [beat, act, name]. */
  momentos: () => tramos.flatMap((t) => t.inst.tl.momentos.map(([b, n]) => [+(t.inicio + b).toFixed(2), t.escena.id, n])),
  /** The moments the sound's score has no scene for. */
  sinEscena: () => api.momentos().filter(([, a, n]) => !sonido.tiene(`${a}:${n}`)),
  /** The sound of a stretch at autoplay's pace, rendered offline into docs/sonido/<nombre>.wav. */
  async sonar(desde = 0, hasta = TOTAL, nombre = 'viaje') {
    const fps = 15;
    const cuadros = [];
    for (let b = desde, k = 0; b < hasta; b += 0.45 / fps, k++) cuadros.push({ escena: escenaEn(b), ritmo: 0.45, salto: false, tiempo: k / fps });
    const datos = await sonido.renderizar(cuadros, fps);
    await fetch(`/__guardar?f=docs/sonido/${nombre}.wav`, { method: 'POST', body: datos });
    return { segundos: cuadros.length / fps, archivo: `docs/sonido/${nombre}.wav` };
  },
  async listo() {
    await Promise.all(tramos.map((t) => t.inst.listo));
    await calentado;
    await calentadoTodo;
    await document.fonts.ready;
  },
  async hoja(path: string, beats: number[], cols = 5, tw = 384) {
    await api.listo();
    const th = Math.round((tw * stage.H) / stage.W);
    const out = document.createElement('canvas');
    out.width = cols * tw;
    out.height = Math.ceil(beats.length / cols) * th;
    const o = out.getContext('2d')!;
    for (const [n, b] of beats.entries()) {
      const x = (n % cols) * tw;
      const y = Math.floor(n / cols) * th;
      o.drawImage(shot(b), x, y, tw, th);
      o.font = `500 ${Math.round(12 * (tw / 384))}px "Geist Mono Variable"`;
      o.fillStyle = 'rgba(0,0,0,0.6)';
      o.fillRect(x + 6, y + 6, 54 * (tw / 384), 18 * (tw / 384));
      o.fillStyle = '#ece7db';
      o.fillText(b.toFixed(2), x + 10, y + 19 * (tw / 384));
    }
    await save(path, out);
    return [out.width, out.height];
  },
};
if (params.has('debug')) Object.assign(window, { viaje: api });
