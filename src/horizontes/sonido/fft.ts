// Copied from horizontes-sonido (src/sonido/fft.ts); edit it there and copy again.
/** A seeded generator (mulberry32): the same seed, the same sound, every time and everywhere. */
export function azar(semilla: number) {
  let s = semilla >>> 0;
  const r = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Object.assign(r, {
    /** Uniform in [a, b). */
    entre: (a: number, b: number) => a + (b - a) * r(),
    /** Normal, mean 0 and deviation 1. */
    normal: () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()),
  });
}
export type Azar = ReturnType<typeof azar>;

/** In-place radix-2 FFT of (re, im), length a power of two; `inversa` without the 1/n. */
export function fft(re: Float64Array, im: Float64Array, inversa = false) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  const signo = inversa ? 1 : -1;
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (signo * 2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    const half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k;
        const b = a + half;
        const xr = re[b] * cr - im[b] * ci;
        const xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr;
        im[b] = im[a] - xi;
        re[a] += xr;
        im[a] += xi;
        const t = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = t;
      }
    }
  }
}

/**
 * A real signal from magnitudes over bins 0..n/2 with random phases: one period of a sound whose
 * spectrum is exactly that, so it loops without a seam. Normalized to a peak of 1.
 */
export function desdeEspectro(mag: Float64Array, n: number, r: Azar): Float32Array {
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 1; i < n / 2; i++) {
    const ph = 2 * Math.PI * r();
    re[i] = mag[i] * Math.cos(ph);
    im[i] = mag[i] * Math.sin(ph);
    re[n - i] = re[i];
    im[n - i] = -im[i];
  }
  fft(re, im, true);
  let pico = 1e-12;
  for (let i = 0; i < n; i++) pico = Math.max(pico, Math.abs(re[i]));
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = re[i] / pico;
  return out;
}
