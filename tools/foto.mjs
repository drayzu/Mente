// Captures of a study without a window: headless Chrome (with the GPU) against the dev server.
//   node tools/foto.mjs <out.jpg> "<url query>" [<out.jpg> "<query>" …]
// The query freezes the beat itself (`m=galaxia&s=1&ver=4.5`). Page errors and console errors are
// printed, and the exit code is 1 if there was any.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const args = process.argv.slice(2);
const port = 9338;
const chrome = spawn(process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), 'mente-foto')}`, '--window-size=1600,900', '--ignore-gpu-blocklist', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try {
    target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
  } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
let errores = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m);
    pending.delete(m.id);
  }
  if (m.method === 'Runtime.exceptionThrown') {
    errores++;
    console.error('[page]', m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
  }
  if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) {
    errores++;
    console.error(`[${m.params.type}]`, m.params.args.map((a) => a.value ?? a.description).join(' '));
  }
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 900, deviceScaleFactor: 1, mobile: false });
for (let i = 0; i < args.length; i += 2) {
  const [file, query] = [args[i], args[i + 1]];
  await send('Page.navigate', { url: `http://localhost:5205/estudios/index.html?${query}` });
  await sleep(4000);
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 90 });
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
  console.log(file);
}
await send('Browser.close');
chrome.kill();
process.exit(errores ? 1 : 0);
