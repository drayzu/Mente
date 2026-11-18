// Copied from horizontes-sonido (src/sonido/sala.ts); edit it there and copy again.
import { azar } from './fft';

/**
 * The room every sound plays in: a long, dark hall, made from numbers. Noise in five bands, each
 * dying at its own pace (the lows ring for seconds, the highs fade soon, as in a real hall), a few
 * early reflections, and each ear with its own noise so the space is wide.
 */

/** RBJ biquad coefficients (low-pass, high-pass, band-pass with 0 dB peak). */
function biquad(tipo: 'lp' | 'hp' | 'bp', f: number, q: number, sr: number) {
  const w = (2 * Math.PI * f) / sr;
  const c = Math.cos(w);
  const al = Math.sin(w) / (2 * q);
  let b0: number, b1: number, b2: number;
  if (tipo === 'lp') [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
  else if (tipo === 'hp') [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
  else [b0, b1, b2] = [al, 0, -al];
  const a0 = 1 + al;
  const k = [b0 / a0, b1 / a0, b2 / a0, (-2 * c) / a0, (1 - al) / a0];
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  return (x: number) => {
    const y = k[0] * x + k[1] * x1 + k[2] * x2 - k[3] * y1 - k[4] * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
}

export interface Sala {
  L: Float32Array;
  R: Float32Array;
}

/**
 * `largo` seconds; `rt`, the time each band takes to fall 60 dB (low → high); `predelay` before the
 * tail begins.
 */
export function sala(sr: number, largo = 6, rt = [5.5, 4.6, 3.4, 2.2, 1.2], predelay = 0.02, semilla = 5): Sala {
  const n = Math.floor(largo * sr);
  const bandas = [
    ['lp', 250, 0.7],
    ['bp', 500, 0.8],
    ['bp', 1600, 0.8],
    ['bp', 4200, 0.8],
    ['hp', 8000, 0.7],
  ] as const;
  const r = azar(semilla);
  const canales = [new Float32Array(n), new Float32Array(n)];
  const d0 = Math.floor(predelay * sr);
  for (const ch of canales) {
    for (let b = 0; b < bandas.length; b++) {
      const [tipo, f, q] = bandas[b];
      const filtro = biquad(tipo, f, q, sr);
      const k = -6.91 / (rt[b] * sr);
      for (let i = d0; i < n; i++) {
        const t = i - d0;
        ch[i] += filtro(r.normal()) * Math.exp(k * t);
      }
    }
    // the tail swells in over 60 ms (a hall, not a spring)
    for (let i = d0; i < d0 + 0.06 * sr; i++) ch[i] *= (i - d0) / (0.06 * sr);
    // early reflections: a few soft taps, different in each ear
    for (let e = 0; e < 7; e++) {
      const at = Math.floor((0.008 + r() * 0.07) * sr);
      ch[at] += (0.6 - e * 0.06) * (r() < 0.5 ? -1 : 1);
    }
    // the end fades to nothing
    for (let i = n - Math.floor(0.3 * sr); i < n; i++) ch[i] *= (n - i) / (0.3 * sr);
  }
  return { L: canales[0], R: canales[1] };
}
