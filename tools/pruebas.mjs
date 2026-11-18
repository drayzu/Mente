// The journey's tests, without a window: headless Chrome (with the GPU) against the dev server.
//   node tools/pruebas.mjs
// 1. Nothing in the console over the whole journey, forwards and backwards.
// 2. No black and no still stretches.
// 3. A jump (?p=beat) draws the same frame as getting there by scroll.
// 4. The scroll takes the journey where it says.
// 5. Every part draws in time for 60 frames a second.
// Exit code 1 if any fails.
import { abrir } from './cromo.mjs';
import { setTimeout as sleep } from 'node:timers/promises';

const fallos = [];
const falla = (s) => { fallos.push(s); console.log('  FALLA ·', s); };
const dif = (a, b) => { let d = 0, s = 0; for (let i = 0; i < a.length; i++) { d += Math.abs(a[i] - b[i]); s += Math.max(a[i], b[i]); } return d / (s + 50); };

const c = await abrir();
await c.ir('index.html?debug&cap=1600x900');
await c.evaluar('viaje.listo()');
const total = await c.evaluar('viaje.total');
const tramos = await c.evaluar('viaje.tramos()');
console.log(`viaje: ${total.toFixed(1)} beats · ${tramos.map((t) => `${t[0]} ${t[3]}`).join(' · ')}`);

// 1 and 2: the sweep.
const PASO = 0.25;
const ida = await c.evaluar(`(() => { const o = []; for (let b = 0; b <= viaje.total; b += ${PASO}) o.push(viaje.sonda(b)); return o; })()`);
const vuelta = await c.evaluar(`(() => { const o = []; for (let b = viaje.total; b >= 0; b -= ${PASO}) { const s = viaje.sonda(b); o.push({ max: s.max, pos: s.pos }); } return o; })()`);
console.log(`1 · consola: ${c.errores} errores en ${ida.length + vuelta.length} cuadros (ida y vuelta)`);
if (c.errores) falla('errores en la consola');
if ([...ida, ...vuelta].some((s) => s.pos.some((v) => !Number.isFinite(v)))) falla('la cámara tiene un valor que no es un número');

const negros = ida.map((s, i) => [i * PASO, s.max]).filter(([, m]) => m < 100);
console.log(`2 · negro: ${negros.length ? negros.map(([b, m]) => `${b} (${m})`).join(', ') : 'ningún cuadro'}`);
if (negros.length) falla(`cuadros en negro: ${negros.map(([b]) => b).join(', ')}`);
// Still: nothing changes over 1.5 beats or more.
let desde = 0;
const quietos = [];
for (let i = 1; i <= ida.length; i++) {
  if (i < ida.length && dif(ida[i].firma, ida[i - 1].firma) < 0.004) continue;
  if ((i - 1 - desde) * PASO >= 1.5) quietos.push([desde * PASO, (i - 1) * PASO]);
  desde = i;
}
console.log(`2 · quieto: ${quietos.length ? quietos.map(([a, b]) => `${a}–${b}`).join(', ') : 'ningún tramo'}`);
if (quietos.length) falla(`tramos quietos: ${quietos.map(([a, b]) => `${a}–${b}`).join(', ')}`);

// 3: a jump against the sweep. The beats: the middle of every moment and the middle of every bridge.
const momentos = await c.evaluar('viaje.momentos()');
const saltos = [...momentos.map((m) => +(m[0] + 1.3).toFixed(2)), ...tramos.slice(1).map((t) => +(t[2] - 0.3).toFixed(2)), ...tramos.slice(1).map((t) => +(t[2] + 0.3).toFixed(2))];
const antes = await c.evaluar(`${JSON.stringify(saltos)}.map((b) => viaje.sonda(b).firma)`);
let peor = 0;
for (const [i, b] of saltos.entries()) {
  await c.ir(`index.html?debug&cap=1600x900&p=${b}`, 1200);
  const f = await c.evaluar(`viaje.listo().then(() => viaje.sonda(${b}).firma)`);
  const d = f ? dif(antes[i], f) : 1;
  peor = Math.max(peor, d);
  if (d > 0.02) falla(`saltar a ${b} no da el mismo cuadro que llegar (diferencia ${(d * 100).toFixed(1)} %)`);
}
console.log(`3 · saltar = llegar: ${saltos.length} saltos, diferencia máxima ${(peor * 100).toFixed(2)} %`);

// 5: the cost of a frame (before 4, which needs another page).
const ms = await c.evaluar(`(() => { const o = []; for (let b = 0; b <= viaje.total; b += 0.5) o.push([b, viaje.ritmo(b, 12)]); return o; })()`);
const lentos = ms.filter(([, m]) => m > 16.6);
const tope = ms.reduce((a, x) => (x[1] > a[1] ? x : a));
console.log(`5 · ritmo: el cuadro más caro tarda ${tope[1].toFixed(1)} ms (beat ${tope[0]}); media ${(ms.reduce((a, x) => a + x[1], 0) / ms.length).toFixed(1)} ms`);
if (lentos.length) falla(`bajo 60 cuadros por segundo en: ${lentos.map(([b, m]) => `${b} (${m.toFixed(0)} ms)`).join(', ')}`);

// 4: the scroll, in a page like the reader's.
await c.ir('index.html?debug');
await c.evaluar('viaje.listo()');
for (const b of [total * 0.3, total * 0.8, total * 0.1]) {
  await c.evaluar(`scrollTo(0, ${b} * 520)`);
  await sleep(3000);
  const P = await c.evaluar('viaje.P');
  if (Math.abs(P - b) > 0.03) falla(`el scroll a ${b.toFixed(2)} dejó el viaje en ${P.toFixed(2)}`);
}
await c.ir(`index.html?debug&p=${(total * 0.5).toFixed(2)}`, 1500);
const [P, y] = await c.evaluar('[viaje.P, scrollY]');
if (Math.abs(P - total * 0.5) > 0.03 || Math.abs(y / 520 - total * 0.5) > 0.03) falla(`?p=${(total * 0.5).toFixed(2)} dejó el viaje en ${P} (scroll ${y})`);
console.log(`4 · scroll: 3 saltos de scroll y 1 de ?p`);

const errores = await c.cerrar();
if (errores && !fallos.includes('errores en la consola')) falla('errores en la consola');
console.log(fallos.length ? `\n${fallos.length} FALLAS` : '\nTodo bien.');
process.exit(fallos.length ? 1 : 0);
