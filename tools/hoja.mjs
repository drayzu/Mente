// A contact sheet without a window: headless Chrome (with the GPU) against the dev server.
//   node tools/hoja.mjs estudio <out.jpg> "<query>" <from> <to> <step> [cols] [width]
//   node tools/hoja.mjs viaje   <out.jpg> <from> <to> <step> [cols] [width]
//   node tools/hoja.mjs puentes <out.jpg>      (seven frames round every change of act)
// `out` is inside docs/ or capturas/. Exit code 1 if the page logged an error or a warning.
import { abrir } from './cromo.mjs';

const [modo, out, ...r] = process.argv.slice(2);
const query = modo === 'estudio' ? r.shift() : '';
const [desde, hasta, paso, cols = 6, tw = 400] = r.map(Number);
const c = await abrir();
await c.ir(modo === 'estudio' ? `estudios/index.html?${query}&clean&debug&cap=1600x900` : 'index.html?debug&cap=1600x900');
const api = modo === 'estudio' ? 'estudio' : 'viaje';
let beats = [];
let columnas = cols;
if (modo === 'puentes') {
  const t = await c.evaluar('viaje.tramos()');
  const d = [-1.0, -0.6, -0.25, 0, 0.25, 0.6, 1.0];
  for (const x of t.slice(1)) for (const k of d) beats.push(+(x[2] + k).toFixed(2));
  columnas = d.length;
} else for (let b = desde; b <= hasta + 1e-6; b += paso) beats.push(+b.toFixed(3));
console.log(await c.evaluar(`${api}.hoja(${JSON.stringify(out)}, ${JSON.stringify(beats)}, ${columnas}, ${modo === 'puentes' ? 340 : tw})`), out);
process.exit((await c.cerrar()) ? 1 : 0);
