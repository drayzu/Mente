// Headless Chrome (with the GPU) against the dev server, over the DevTools protocol.
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

export const BASE = 'http://localhost:5205/';

/** Opens a page. `errores` counts what the page threw or logged as error or warning. */
export async function abrir({ port = 9339, w = 1600, h = 900 } = {}) {
  const chrome = spawn(process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), `mente-cromo-${port}`)}`, `--window-size=${w},${h}`, '--ignore-gpu-blocklist', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
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
  const pending = new Map();
  const c = {
    errores: 0,
    send: (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); }),
    /** Loads a page of the dev server and waits until it has drawn. */
    async ir(ruta, espera = 2500) {
      await c.send('Page.navigate', { url: BASE + ruta });
      await sleep(espera);
    },
    /** Evaluates an expression in the page (promises are awaited) and returns its value. */
    async evaluar(expr) {
      const m = await c.send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (m.result.exceptionDetails) {
        c.errores++;
        console.error('[eval]', m.result.exceptionDetails.exception?.description ?? m.result.exceptionDetails.text);
        return undefined;
      }
      return m.result.result.value;
    },
    /** The page as a JPEG. */
    async foto(q = 90) {
      return Buffer.from((await c.send('Page.captureScreenshot', { format: 'jpeg', quality: q })).result.data, 'base64');
    },
    async cerrar() {
      await c.send('Browser.close');
      chrome.kill();
      return c.errores;
    },
  };
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
    if (m.method === 'Runtime.exceptionThrown') {
      c.errores++;
      console.error('[page]', m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
    }
    if (m.method === 'Runtime.consoleAPICalled' && (m.params.type === 'error' || m.params.type === 'warning')) {
      c.errores++;
      console.error(`[${m.params.type}]`, m.params.args.map((a) => a.value ?? a.description).join(' '));
    }
  });
  await c.send('Runtime.enable');
  await c.send('Page.enable');
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  return c;
}
