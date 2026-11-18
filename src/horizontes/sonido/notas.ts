// Copied from horizontes-sonido (src/sonido/notas.ts); edit it there and copy again.
/** Note names to Hz (A4 = 440): «D3», «F#4», «Bb2». */
export function hz(nombre: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(nombre);
  if (!m) throw new Error(`not a note: ${nombre}`);
  const base = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1] as 'C'];
  const alt = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return 440 * Math.pow(2, (base + alt + 12 * (Number(m[3]) - 4)) / 12);
}

/** Several at once: «D3 A3 E4». */
export const acorde = (s: string) => s.trim().split(/\s+/).map(hz);
