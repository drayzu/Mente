// Copied from horizontes-sonido (src/sonido/instrumentos.ts); edit it there and copy again.
import { azar, desdeEspectro, type Azar } from './fft';
import { LUGARES, SUCESOS, TIMBRES } from './lugares';

/**
 * The series' instruments, made from numbers (no files, the same on every device and every visit).
 *
 * The sustained ones come from PADsynth (Nasca Octavian Paul): each harmonic is a narrow band of
 * noise, not a sine, so a single table already sounds like an ensemble (a choir, many strings),
 * and since it is built in the spectrum it is one exact period: it loops with no seam. The
 * struck ones are modal (a few partials, each with its own decay) or FM, like real bars and tines.
 * Everything is a table: playing one higher is playing it faster.
 */

export interface Tabla {
  L: Float32Array;
  R: Float32Array;
  /** The pitch at rate 1 (Hz); 0 for sounds with no pitch. */
  raiz: number;
  /** Plays as a loop (sustained) or once (struck). */
  lazo: boolean;
}

const N_PAD = 1 << 18;

interface Parcial {
  /** Ratio to the root. */
  r: number;
  a: number;
}

/**
 * PADsynth: harmonics as Gaussian bands `bw` cents wide (wider the higher, by `escala`), random
 * phases, one inverse FFT per channel (independent phases: a wide, decorrelated stereo).
 */
function padsynth(sr: number, f0: number, parciales: Parcial[], bw: number, escala: number, semilla: number, n = N_PAD): Tabla {
  const mag = new Float64Array(n / 2 + 1);
  for (const { r, a } of parciales) {
    const f = f0 * r;
    if (f > sr / 2 - 500 || a <= 0) continue;
    const bwHz = (Math.pow(2, bw / 1200) - 1) * f0 * Math.pow(r, escala);
    const centro = (f / sr) * n;
    const ancho = Math.max(0.5, (bwHz / sr) * n);
    const desde = Math.max(1, Math.floor(centro - 4 * ancho));
    const hasta = Math.min(n / 2 - 1, Math.ceil(centro + 4 * ancho));
    for (let i = desde; i <= hasta; i++) {
      const x = (i - centro) / ancho;
      mag[i] += (a * Math.exp(-x * x)) / Math.sqrt(ancho);
    }
  }
  const r = azar(semilla);
  return normalizar({ L: desdeEspectro(mag, n, r), R: desdeEspectro(mag, n, r), raiz: f0, lazo: true });
}

/** A loop of noise with a given spectral shape (pink tilt × a band), seamless by the same trick. */
function ruido(sr: number, forma: (f: number) => number, semilla: number, n = N_PAD): Tabla {
  const mag = new Float64Array(n / 2 + 1);
  for (let i = 1; i < n / 2; i++) mag[i] = forma((i * sr) / n);
  const r = azar(semilla);
  return normalizar({ L: desdeEspectro(mag, n, r), R: desdeEspectro(mag, n, r), raiz: 0, lazo: true });
}

/** Every table at the same loudness (RMS 0.12): the mix sets levels, not the recipes. */
function normalizar(t: Tabla, rms = 0.12): Tabla {
  let s = 0;
  for (let i = 0; i < t.L.length; i++) s += t.L[i] * t.L[i] + t.R[i] * t.R[i];
  const k = rms / Math.sqrt(s / (2 * t.L.length) + 1e-20);
  for (let i = 0; i < t.L.length; i++) {
    t.L[i] *= k;
    t.R[i] *= k;
  }
  return t;
}

const gauss = (x: number, c: number, b: number) => Math.exp(-(((x - c) / b) ** 2));
/** A gentle low-pass shape (second order), and its high-pass twin. */
const lp = (f: number, fc: number, orden = 2) => 1 / Math.sqrt(1 + Math.pow(f / fc, 2 * orden));
const hp = (f: number, fc: number, orden = 2) => 1 / Math.sqrt(1 + Math.pow(fc / f, 2 * orden));

/** Vowel formants (Hz, gain, width) for a mixed choir. */
const VOCALES = {
  a: [
    [750, 1, 160],
    [1150, 0.55, 180],
    [2700, 0.2, 260],
    [3700, 0.08, 300],
  ],
  o: [
    [480, 1, 140],
    [850, 0.45, 160],
    [2650, 0.1, 260],
    [3500, 0.04, 300],
  ],
  u: [
    [340, 1, 120],
    [720, 0.25, 150],
    [2500, 0.05, 260],
  ],
} as const;

export type Receta = (sr: number, raiz: number) => Tabla;

/** A harmonic pad's recipe: everything that shapes its colour. */
export interface Timbre {
  /** Each harmonic's band (cents) and how much wider the higher ones are (0: all the same). */
  bw: number;
  escala: number;
  /** Harmonic k at k^-tilt; a low-pass (Hz) over it all; even harmonics this much (a hollow, clarinet-like colour below 1). */
  tilt: number;
  lp: number;
  pares?: number;
  /** Vowel formants mixed in (a choir), and how much plain harmonic is left under them. */
  vocal?: Partial<Record<keyof typeof VOCALES, number>>;
  piso?: number;
  nh?: number;
}

/** A harmonic pad from its recipe (PADsynth). */
export function pad(t: Timbre, semilla: number): Receta {
  return (sr, f0) => {
    const ps: Parcial[] = [];
    for (let k = 1; k <= (t.nh ?? 64); k++) {
      const f = f0 * k;
      let a = Math.pow(k, -t.tilt) * lp(f, t.lp, 2) * (k % 2 ? 1 : (t.pares ?? 1));
      if (t.vocal) {
        let v = 0;
        for (const [nombre, peso] of Object.entries(t.vocal)) v += (peso ?? 0) * VOCALES[nombre as keyof typeof VOCALES].reduce((s, [c, g, b]) => s + g * gauss(f, c, b), 0);
        a *= (t.piso ?? 0.04) + v;
      }
      ps.push({ r: k, a });
    }
    return padsynth(sr, f0, ps, t.bw, t.escala, semilla);
  };
}

/** The sustained instruments, by name; each is built at the roots its players ask for. */
export const SOSTENIDOS: Record<string, Receta> = {
  // (each chosen among variants by the learned judges and the roughness measure: `oido/`, ESTADO.md)
  /** A choir far away on «oo»: warm, with no edge. */
  coro: pad({ bw: 35, escala: 0.6, tilt: 0.9, lp: 2500, vocal: { o: 0.5, u: 0.5 }, piso: 0.3 }, 11),
  /** A warm pad, like many soft strings with the bow far from the bridge. */
  calido: pad({ bw: 14, escala: 0.8, tilt: 1, lp: 1800, pares: 0.7, nh: 48 }, 23),
  /** A high shimmer, almost pure: the light of many stars. */
  brillo: pad({ bw: 10, escala: 0.5, tilt: 2, lp: 8000, nh: 6 }, 41),
  /** Glass: a pure tone with a few soft harmonics, like a glass harmonica held. */
  vidrio: pad({ bw: 6, escala: 0.5, tilt: 2.5, lp: 6000, nh: 6 }, 37),
  /** Strings with some bow in them, like cellos far off (the second palette: lugares.ts). */
  cuerdas: pad(TIMBRES.cuerdas, 83),
  /**
   * The early universe's sound (Tiempo, «El universo sonaba»): overtones at the ratios of the
   * acoustic peaks of the microwave background (multipoles ≈ 220, 537, 810, 1120, 1420), each a
   * wide band, so it roars like a hall full of wind rather than ringing like a bell.
   */
  plasma: (sr, f0) =>
    padsynth(
      sr,
      f0,
      [
        { r: 1, a: 1 },
        { r: 2.44, a: 0.7 },
        { r: 3.68, a: 0.45 },
        { r: 5.09, a: 0.28 },
        { r: 6.45, a: 0.16 },
      ],
      70,
      0.8,
      59,
    ),
  /** Deep and round, for the vast things (black holes, the galaxy): the root and its fifth above, no edge. */
  hondo: (sr, f0) =>
    padsynth(
      sr,
      f0,
      [
        { r: 1, a: 1 },
        { r: 2, a: 0.35 },
        { r: 3, a: 0.2 },
        { r: 4, a: 0.06 },
        { r: 6, a: 0.04 },
      ],
      14,
      0.6,
      53,
    ),
};

/** Sustained sounds without a pitch. */
export const TEXTURAS: Record<string, (sr: number) => Tabla> = {
  // (the places: rain, fire, bubbles, crickets, the sea, gusts, a rumble)
  ...LUGARES,
  /** Air: pink noise between 120 Hz and 3 kHz, soft at both ends (the scroll's wind). */
  aire: (sr) => ruido(sr, (f) => (1 / Math.sqrt(f)) * hp(f, 120, 2) * lp(f, 3000, 2), 61),
  /** Radio far away: a narrow band of static and some crackle. */
  radio: (sr) => {
    const t = ruido(sr, (f) => (1 / Math.sqrt(f)) * hp(f, 450, 3) * lp(f, 2800, 3), 67);
    const r = azar(71);
    const n = t.L.length;
    // crackle: sparse little bursts, written around the loop's end so there is still no seam
    for (let k = 0; k < (n / sr) * 9; k++) {
      const i0 = Math.floor(r() * n);
      const a = 0.25 * Math.pow(r(), 3);
      const tau = r.entre(0.0004, 0.002) * sr;
      const ch = r() < 0.5 ? t.L : t.R;
      for (let j = 0; j < tau * 5; j++) ch[(i0 + j) % n] += a * r.normal() * Math.exp(-j / tau);
    }
    return t;
  },
  /**
   * A swarm of glass: far wind chimes, each a small struck tone from a consonant set (harmonics 4–12
   * of a low D), ringing a moment and fading (the swarm of collectors in the light).
   */
  enjambre: (sr) => {
    const n = N_PAD;
    const L = new Float32Array(n);
    const R = new Float32Array(n);
    const r = azar(73);
    const raiz = 146.8;
    const armonicos = [4, 5, 6, 8, 9, 10, 12];
    for (let k = 0; k < (n / sr) * 14; k++) {
      const f = raiz * armonicos[Math.floor(r() * armonicos.length)];
      const tau = r.entre(0.25, 0.7) * sr;
      const i0 = Math.floor(r() * n);
      const a = 0.05 * (0.25 + 0.75 * r() ** 2);
      const pan = r();
      const w = (2 * Math.PI * f) / sr;
      const w2 = w * 2.76;
      for (let j = 0; j < tau * 5; j++) {
        const e = Math.exp(-j / tau) * Math.min(1, j / (0.003 * sr));
        const s = a * e * (Math.sin(w * j) + 0.12 * Math.exp(-j / (tau * 0.3)) * Math.sin(w2 * j));
        L[(i0 + j) % n] += s * Math.sqrt(1 - pan);
        R[(i0 + j) % n] += s * Math.sqrt(pan);
      }
    }
    return normalizar({ L, R, raiz: 0, lazo: true });
  },
};

const TAU = 2 * Math.PI;

/** A struck sound: `largo` seconds, built sample by sample from `voz(t)`, with a short fade at the end. */
function golpeado(sr: number, largo: number, voz: (t: number) => [number, number]): Tabla {
  const n = Math.floor(largo * sr);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const [l, r] = voz(i / sr);
    const cola = Math.min(1, (n - i) / (0.05 * sr));
    L[i] = l * cola;
    R[i] = r * cola;
  }
  let pico = 1e-9;
  for (let i = 0; i < n; i++) pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]));
  for (let i = 0; i < n; i++) {
    L[i] *= 0.5 / pico;
    R[i] *= 0.5 / pico;
  }
  return { L, R, raiz: 0, lazo: false };
}

/** A soft attack: a raised cosine over `a` seconds (no click, like a felt mallet). */
const ataque = (t: number, a: number) => (t >= a ? 1 : 0.5 - 0.5 * Math.cos((Math.PI * t) / a));

type RecetaGolpe = (sr: number, f: number, r: Azar) => Tabla;

/** FM at 1 : 1 (an electric piano's tine): `indice` of brightness fading over `brilla` s, the tone over `decae` s. */
function tine(sr: number, f: number, indice: number, brilla: number, decae: number, golpe: number): Tabla {
  return golpeado(sr, 6, (t) => {
    const i = indice * Math.exp(-t / brilla) + 0.15;
    const env = ataque(t, 0.003) * Math.exp(-t / decae);
    const tn = golpe * Math.exp(-t / 0.04) * Math.sin(TAU * f * 7.1 * t);
    const s = env * Math.sin(TAU * f * t + i * Math.sin(TAU * f * t)) + tn;
    // a few cents apart in each ear: a little width
    const s2 = env * Math.sin(TAU * f * 1.0007 * t + i * Math.sin(TAU * f * 1.0007 * t)) + tn;
    return [s, s2];
  });
}

/** The struck instruments: each at the pitch asked for (Hz). */
export const GOLPES: Record<string, RecetaGolpe> = {
  // (struck places: a bubble, a heartbeat, a flare of light)
  ...SUCESOS,
  /** A vibraphone without its motor: tuned bars (1 : 4 : 10), a felt mallet. */
  vibrafono: (sr, f) => {
    const modos = [
      [1, 1, 3.2],
      [3.99, 0.22, 0.9],
      [9.85, 0.05, 0.3],
    ];
    return golpeado(sr, 6, (t) => {
      let s = 0;
      for (const [m, a, d] of modos) if (f * m < sr / 2.2) s += a * Math.exp(-t / d) * Math.sin(TAU * f * m * t);
      s *= ataque(t, 0.004);
      return [s, s];
    });
  },
  /** An electric piano's tine (FM, 1 : 1, its brightness fading as it rings), warm and round. */
  piano: (sr, f) => tine(sr, f, 1.4, 0.7, 2.4, 0.04),
  /** The same, struck more softly: rounder, longer. */
  'piano-suave': (sr, f) => tine(sr, f, 0.8, 0.9, 3.2, 0.015),
  /** The same, struck harder: a brighter bell. */
  'piano-claro': (sr, f) => tine(sr, f, 2.2, 0.5, 2.4, 0.05),
  /** A small glass bell, struck very softly. */
  cristal: (sr, f) => {
    const modos = [
      [1, 1, 4],
      [2.0, 0.08, 2],
      [3.0, 0.07, 1.2],
      [5.43, 0.02, 0.35],
    ];
    return golpeado(sr, 6, (t) => {
      let s = 0;
      for (const [m, a, d] of modos) if (f * m < sr / 2.2) s += a * Math.exp(-t / d) * Math.sin(TAU * f * m * t);
      s *= ataque(t, 0.006);
      return [s, s];
    });
  },
  /** A deep, soft thump felt through the structure (a launch, something huge arriving). */
  golpe: (sr, f, r) => {
    let ph = 0;
    let lp1 = 0;
    let lp2 = 0;
    return golpeado(sr, 3, (t) => {
      const fi = f * (0.55 + 0.45 * Math.exp(-t / 0.25));
      ph += (TAU * fi) / sr;
      const cuerpo = Math.sin(ph) * Math.exp(-t / 0.8) * ataque(t, 0.008);
      // a breath of low noise under it
      lp1 += 0.02 * (r.normal() - lp1);
      lp2 += 0.02 * (lp1 - lp2);
      const aire = 6 * lp2 * Math.exp(-t / 0.35) * ataque(t, 0.01);
      const s = cuerpo + aire;
      return [s, s];
    });
  },
  /** A whoosh: soft noise through a resonant band that opens and closes, crossing from one side to the other. */
  soplo: (sr, f, r) => {
    const dur = 2.6;
    const st = [0, 0];
    let rosa = 0;
    let lp1 = 0;
    return golpeado(sr, dur, (t) => {
      const u = t / dur;
      const fc = f * (0.5 + 1.5 * Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 2);
      const env = Math.sin(Math.PI * u) ** 2;
      // a state-variable band-pass (Q ≈ 2), retuned every sample, fed with a darkened noise
      const g = Math.tan((Math.PI * Math.min(fc, sr / 4)) / sr);
      const k = 0.5;
      rosa += 0.12 * (r.normal() - rosa);
      const hp = (rosa - (k + g) * st[0] - st[1]) / (1 + g * (g + k));
      const bp = g * hp + st[0];
      st[0] = g * hp + bp;
      const low = g * bp + st[1];
      st[1] = g * bp + low;
      lp1 += 0.25 * (bp - lp1);
      const s = lp1 * env;
      const pan = 0.2 + 0.6 * u;
      return [s * Math.sqrt(1 - pan), s * Math.sqrt(pan)];
    });
  },
  /** A drop: a soft tone that falls a little as it fades (a thought, a bit). */
  gota: (sr, f) =>
    golpeado(sr, 0.8, (t) => {
      const fi = f * (1 + 0.25 * Math.exp(-t / 0.012));
      const s = Math.sin(TAU * fi * t) * Math.exp(-t / 0.12) * ataque(t, 0.002);
      return [s, s];
    }),
  /** A spark: a tiny crackle (nerves passing signals). */
  chispa: (sr, f, r) => {
    let a = 0;
    return golpeado(sr, 0.25, (t) => {
      a += 0.35 * (r.normal() - a);
      const s = (r.normal() - a) * (Math.exp(-t / 0.004) + 0.4 * Math.exp(-Math.abs(t - 0.03) / 0.003)) * Math.sin(TAU * f * t) ** 2;
      return [s, s * 0.8];
    });
  },
};

/** Builds a sustained instrument at a root, a texture, or a struck sound (at a pitch) by name. */
export function forjar(sr: number, nombre: string, raiz = 0, semilla = [...`${nombre}@${raiz.toFixed(2)}`].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7)): Tabla {
  if (nombre in SOSTENIDOS) return SOSTENIDOS[nombre](sr, raiz);
  if (nombre in TEXTURAS) return TEXTURAS[nombre](sr);
  if (nombre in GOLPES) return GOLPES[nombre](sr, raiz, azar(semilla));
  throw new Error(`no instrument «${nombre}»`);
}
