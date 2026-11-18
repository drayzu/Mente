// Copied from horizontes-sonido (src/sonido/lugares.ts); edit it there and copy again.
import { azar, desdeEspectro, type Azar } from './fft';

/**
 * The second palette: sounds of things, not of instruments. Rain, fire, water, a night field, the
 * sea, wind with gusts, a rumble; and struck ones: a bubble, a heartbeat, a flare of light. The pieces use them so each moment sounds like the place it shows.
 *
 * The recipes are the classic ones of procedural audio (Farnell, «Designing Sound»): a bed of shaped
 * noise and, over it, many small events written around the loop's end, so there is still no seam.
 * These loops are four times longer than a pad's (about 22 s), so the ear does not learn them.
 */

export interface Tabla {
  L: Float32Array;
  R: Float32Array;
  raiz: number;
  lazo: boolean;
}

const TAU = 2 * Math.PI;
const N_CORTO = 1 << 18;
const N_LARGO = 1 << 20;

const gauss = (x: number, c: number, b: number) => Math.exp(-(((x - c) / b) ** 2));
const lp = (f: number, fc: number, orden = 2) => 1 / Math.sqrt(1 + Math.pow(f / fc, 2 * orden));
const hp = (f: number, fc: number, orden = 2) => 1 / Math.sqrt(1 + Math.pow(fc / f, 2 * orden));
const logEntre = (r: Azar, a: number, b: number) => a * Math.pow(b / a, r());
const ataque = (t: number, a: number) => (t >= a ? 1 : 0.5 - 0.5 * Math.cos((Math.PI * t) / a));

/** Noise with a given spectrum, one exact period (stereo, each ear its own phases). */
function cama(sr: number, forma: (f: number) => number, semilla: number, n = N_CORTO) {
  const mag = new Float64Array(n / 2 + 1);
  for (let i = 1; i < n / 2; i++) mag[i] = forma((i * sr) / n);
  const r = azar(semilla);
  return { L: desdeEspectro(mag, n, r), R: desdeEspectro(mag, n, r) };
}

function rms(a: Float32Array) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  return Math.sqrt(s / a.length + 1e-20);
}

/** A bed tiled into a long loop at a given RMS. */
function tender(c: { L: Float32Array; R: Float32Array }, n: number, nivel: number) {
  const k = nivel / rms(c.L);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    L[i] = k * c.L[i % c.L.length];
    R[i] = k * c.R[i % c.R.length];
  }
  return { L, R };
}

/** A slow swell with whole cycles in the loop (so it wraps): 0..1 at sample i. */
function vaiven(n: number, r: Azar, ciclos: number[]) {
  const fases = ciclos.map(() => r() * TAU);
  return (i: number) => {
    let s = 0;
    for (let k = 0; k < ciclos.length; k++) s += Math.sin((TAU * ciclos[k] * i) / n + fases[k]);
    return 0.5 + (0.5 * s) / ciclos.length;
  };
}

/** Adds a small event at i0 (wrapping round the loop's end): `largo` samples of `voz(j)`, panned. */
function evento(L: Float32Array, R: Float32Array, i0: number, largo: number, pan: number, voz: (j: number) => number) {
  const n = L.length;
  const gl = Math.sqrt(1 - pan);
  const gr = Math.sqrt(pan);
  for (let j = 0; j < largo; j++) {
    const s = voz(j);
    const k = (i0 + j) % n;
    L[k] += s * gl;
    R[k] += s * gr;
  }
}

function normalizar(t: Tabla, nivel = 0.12): Tabla {
  const k = nivel / Math.sqrt((rms(t.L) ** 2 + rms(t.R) ** 2) / 2);
  for (let i = 0; i < t.L.length; i++) {
    t.L[i] *= k;
    t.R[i] *= k;
  }
  return t;
}

/** Sustained places (no pitch). */
export const LUGARES: Record<string, (sr: number) => Tabla> = {
  /**
   * Rain: a soft hiss (the thousands of drops too far to tell apart) and, over it, the near ones,
   * each a tiny bright tick, with a few heavier drops landing on something.
   */
  lluvia: (sr) => {
    const n = N_LARGO;
    const { L, R } = tender(
      cama(sr, (f) => (1 / Math.sqrt(f)) * hp(f, 700, 2) * (1 + 1.5 * gauss(f, 4500, 3000)) * lp(f, 11000, 2), 101),
      n,
      0.06,
    );
    const r = azar(103);
    const seg = n / sr;
    for (let k = 0; k < seg * 190; k++) {
      const w = (TAU * logEntre(r, 1800, 7500)) / sr;
      const tau = r.entre(0.0004, 0.0016) * sr;
      const a = 0.02 + 0.3 * Math.pow(r(), 4);
      const ph = r() * TAU;
      evento(L, R, Math.floor(r() * n), Math.ceil(tau * 7), r(), (j) => a * Math.exp(-j / tau) * Math.sin(w * j + ph));
    }
    for (let k = 0; k < seg * 5; k++) {
      const w = (TAU * logEntre(r, 480, 1100)) / sr;
      const tau = r.entre(0.006, 0.014) * sr;
      const a = r.entre(0.04, 0.14);
      const sube = 0.0008 * sr;
      evento(L, R, Math.floor(r() * n), Math.ceil(tau * 7), r(), (j) => a * Math.min(1, j / sube) * Math.exp(-j / tau) * Math.sin(w * j * (1 + 0.2 * Math.exp(-j / (tau * 0.3)))));
    }
    return normalizar({ L, R, raiz: 0, lazo: true });
  },

  /**
   * Fire: a low breath that flutters, a faint hiss, and the crackle: sparse sharp little bursts, a
   * few of them louder pops with a small thump under them.
   */
  fuego: (sr) => {
    const n = N_LARGO;
    const grave = cama(sr, (f) => Math.pow(f, -0.9) * hp(f, 45, 2) * lp(f, 420, 2), 107);
    const siseo = cama(sr, (f) => Math.pow(f, -0.3) * hp(f, 2500, 2) * lp(f, 9000, 2), 109);
    const kg = 0.07 / rms(grave.L);
    const ks = 0.012 / rms(siseo.L);
    const r = azar(113);
    const lento = vaiven(n, r, [3, 7, 13]);
    const aleteo = vaiven(n, r, [97, 151, 211]);
    const L = new Float32Array(n);
    const R = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const e = (0.45 + 0.55 * lento(i)) * (0.7 + 0.3 * aleteo(i));
      const m = i % N_CORTO;
      L[i] = kg * grave.L[m] * e + ks * siseo.L[m] * (0.4 + 0.6 * e);
      R[i] = kg * grave.R[m] * e + ks * siseo.R[m] * (0.4 + 0.6 * e);
    }
    const seg = n / sr;
    // the crackle: differentiated noise (bright), dying in a few milliseconds
    for (let k = 0; k < seg * 10; k++) {
      const tau = r.entre(0.0008, 0.005) * sr;
      const a = 0.015 + 0.3 * Math.pow(r(), 5);
      let prev = 0;
      evento(L, R, Math.floor(r() * n), Math.ceil(tau * 7), r.entre(0.2, 0.8), (j) => {
        const x = r.normal();
        const y = x - 0.7 * prev;
        prev = x;
        return a * y * Math.exp(-j / tau);
      });
    }
    // the pops
    for (let k = 0; k < seg * 0.5; k++) {
      const tau = r.entre(0.006, 0.012) * sr;
      const a = r.entre(0.2, 0.4);
      const w = (TAU * r.entre(90, 140)) / sr;
      let prev = 0;
      evento(L, R, Math.floor(r() * n), Math.ceil(0.25 * sr), r.entre(0.3, 0.7), (j) => {
        const x = r.normal();
        const y = x - 0.5 * prev;
        prev = x;
        return a * (y * Math.exp(-j / tau) + 0.5 * Math.sin(w * j) * Math.exp(-j / (0.04 * sr)) * Math.min(1, j / (0.002 * sr)));
      });
    }
    return normalizar({ L, R, raiz: 0, lazo: true });
  },

  /**
   * Bubbles under water: each a small tone that rises as it fades (the smaller, the higher), over
   * the soft body of the water itself.
   */
  burbujas: (sr) => {
    const n = N_LARGO;
    const { L, R } = tender(
      cama(sr, (f) => Math.pow(f, -1) * hp(f, 60, 2) * lp(f, 380, 2), 127),
      n,
      0.03,
    );
    const r = azar(131);
    const seg = n / sr;
    for (let k = 0; k < seg * 13; k++) {
      const f0 = logEntre(r, 320, 2600);
      const dur = (0.014 + 0.07 * Math.pow(320 / f0, 0.7)) * sr;
      const sube = r.entre(0.25, 0.9);
      const a = 0.25 * Math.pow(r(), 2) * Math.pow(320 / f0, 0.35) + 0.01;
      const tau = dur / 2.5;
      const at = 0.002 * sr;
      let ph = 0;
      evento(L, R, Math.floor(r() * n), Math.ceil(dur * 2.4), r(), (j) => {
        ph += (TAU * f0 * (1 + (sube * j) / dur)) / sr;
        return a * Math.min(1, j / at) * Math.exp(-j / tau) * Math.sin(ph);
      });
    }
    return normalizar({ L, R, raiz: 0, lazo: true });
  },

  /**
   * A field at night: a handful of crickets, each with its own pitch, place and pace, chirping in
   * short runs of pulses (and missing one now and then).
   */
  grillos: (sr) => {
    const n = N_LARGO;
    const L = new Float32Array(n);
    const R = new Float32Array(n);
    const r = azar(137);
    // each cricket keeps its own steady pace: a chirp of three or four syllables of pure tone,
    // some 20 ms each, soft at both ends
    const grillo = (f: number, veces: number, a: number, pan: number, cuantos: number) => {
      const silaba = sr / 31;
      const largo = Math.floor(silaba * 0.75);
      const w = (TAU * f) / sr;
      const fase = r();
      for (let c = 0; c < veces; c++) {
        const i0 = Math.floor(((c + fase) / veces) * n) % n;
        for (let q = 0; q < cuantos; q++) evento(L, R, (i0 + Math.floor(q * silaba)) % n, largo, pan, (j) => a * (0.7 + 0.3 * (q / cuantos)) * Math.sin((Math.PI * j) / largo) ** 2 * Math.sin(w * j));
      }
    };
    grillo(4650, 44, 0.3, 0.35, 3);
    grillo(4320, 37, 0.16, 0.75, 4);
    grillo(4980, 51, 0.08, 0.15, 3);
    grillo(4120, 31, 0.05, 0.9, 3);
    return normalizar({ L, R, raiz: 0, lazo: true });
  },

  /** The sea from the shore: the wave's low body swelling and falling, and its foam after the crest. */
  mar: (sr) => {
    const n = N_LARGO;
    const cuerpo = cama(sr, (f) => Math.pow(f, -0.8) * hp(f, 55, 2) * lp(f, 900, 2), 139);
    const espuma = cama(sr, (f) => Math.pow(f, -0.4) * hp(f, 1400, 2) * lp(f, 7000, 2), 149);
    const kc = 0.08 / rms(cuerpo.L);
    const ke = 0.035 / rms(espuma.L);
    const r = azar(151);
    const f1 = r() * TAU;
    const f2 = r() * TAU;
    const L = new Float32Array(n);
    const R = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = i / n;
      // three waves in the loop, none quite like the other
      const ola = 0.5 + 0.5 * Math.sin(TAU * 3 * x + f1 + 0.5 * Math.sin(TAU * x + f2));
      const cola = 0.5 + 0.5 * Math.sin(TAU * 3 * x + f1 + 0.5 * Math.sin(TAU * x + f2) - 0.9);
      const e1 = 0.22 + 0.78 * Math.pow(ola, 1.6);
      const e2 = 0.05 + 0.95 * Math.pow(cola, 3);
      const m = i % N_CORTO;
      L[i] = kc * cuerpo.L[m] * e1 + ke * espuma.L[m] * e2;
      R[i] = kc * cuerpo.R[m] * e1 + ke * espuma.R[m] * e2;
    }
    return normalizar({ L, R, raiz: 0, lazo: true });
  },

  /** Wind with gusts: the air rising and falling, never twice the same. */
  rafaga: (sr) => {
    const n = N_LARGO;
    const cuerpo = cama(sr, (f) => (1 / Math.sqrt(f)) * hp(f, 110, 2) * lp(f, 2600, 2), 157);
    const kc = 0.1 / rms(cuerpo.L);
    const r = azar(163);
    const racha = vaiven(n, r, [2, 5, 11, 23, 37]);
    const fina = vaiven(n, r, [61, 97, 139]);
    const L = new Float32Array(n);
    const R = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const e = (0.45 + 0.55 * racha(i)) * (0.85 + 0.15 * fina(i));
      const m = i % N_CORTO;
      L[i] = kc * cuerpo.L[m] * e;
      R[i] = kc * cuerpo.R[(m + 40000) % N_CORTO] * e;
    }
    return normalizar({ L, R, raiz: 0, lazo: true });
  },

  /** A rumble with no pitch, felt more than heard: something huge, far away or all around. */
  rumor: (sr) => {
    const c = cama(sr, (f) => Math.pow(f, -1.1) * hp(f, 28, 3) * lp(f, 130, 3), 167);
    return normalizar({ L: c.L, R: c.R, raiz: 0, lazo: true });
  },
};

/** A struck sound from `voz(t)` (stereo), `largo` seconds, peak at 0.5, a short fade at the end. */
function golpeado(sr: number, largo: number, voz: (t: number) => [number, number]): Tabla {
  const n = Math.floor(largo * sr);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  let pico = 1e-9;
  for (let i = 0; i < n; i++) {
    const [l, r] = voz(i / sr);
    const cola = Math.min(1, (n - i) / (0.03 * sr));
    L[i] = l * cola;
    R[i] = r * cola;
    pico = Math.max(pico, Math.abs(L[i]), Math.abs(R[i]));
  }
  for (let i = 0; i < n; i++) {
    L[i] *= 0.5 / pico;
    R[i] *= 0.5 / pico;
  }
  return { L, R, raiz: 0, lazo: false };
}

/** Struck places, each at the pitch asked for (Hz). */
export const SUCESOS: Record<string, (sr: number, f: number, r: Azar) => Tabla> = {
  /** One bubble: a tone that rises as it fades. */
  burbuja: (sr, f) => {
    let ph = 0;
    return golpeado(sr, 0.2, (t) => {
      ph += (TAU * f * (1 + 0.9 * Math.min(1, t / 0.035) ** 1.5)) / sr;
      const s = Math.sin(ph) * ataque(t, 0.002) * Math.exp(-t / 0.016);
      return [s, s];
    });
  },
  /** A heartbeat: two soft low thumps, the second a little higher and lighter. */
  latido: (sr, f) => {
    const uno = (t: number, fr: number, tau: number) => {
      if (t < 0) return 0;
      const fi = fr * (1 + 0.5 * Math.exp(-t / 0.025));
      return ataque(t, 0.008) * Math.exp(-t / tau) * (Math.sin(TAU * fi * t) + 0.3 * Math.sin(TAU * 2 * fi * t) * Math.exp(-t / (tau * 0.5)));
    };
    return golpeado(sr, 1, (t) => {
      const s = uno(t, f, 0.1) + 0.65 * uno(t - 0.29, f * 1.18, 0.075);
      return [s, s];
    });
  },
  /**
   * A flare of light: a soft swell that opens and fades, a few partials a hair apart in each ear
   * (a star lighting, the light breaking free).
   */
  destello: (sr, f) => {
    const ps = [
      [1, 1, 2.2],
      [2, 0.5, 1.7],
      [3, 0.3, 1.3],
      [4.02, 0.18, 1],
      [5.97, 0.09, 0.7],
    ];
    return golpeado(sr, 6, (t) => {
      let l = 0;
      let r2 = 0;
      for (const [m, a, d] of ps) {
        if (f * m > sr / 2.2) continue;
        const e = a * Math.exp(-t / d);
        l += e * Math.sin(TAU * f * m * t);
        r2 += e * Math.sin(TAU * f * m * 1.0018 * t + 1);
      }
      const at = ataque(t, 0.32);
      return [l * at, r2 * at];
    });
  },
};

/** Sustained pads of the second palette: recipes the first palette's `pad` builds (see instrumentos.ts). */
export const TIMBRES = {
  /** Strings with some bow in them: like cellos far off, warmer and fuller than `calido`. */
  cuerdas: { bw: 26, escala: 1, tilt: 0.95, lp: 3400, nh: 48 },
} as const;
