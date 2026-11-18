// Copied from horizontes-sonido (src/sonido/motor.ts); edit it there and copy again.
import { azar } from './fft';
import { forjar, GOLPES, type Tabla } from './instrumentos';
import { sala } from './sala';

/**
 * The series' sound engine: instruments made from numbers, played in one hall, mixed gently.
 *
 *   capas (layers) ──┬── seco (dry) ──────────────┐
 *   toques (struck) ─┘── envío ── sala (hall) ────┴── low cut ── glue ── level ── out
 *
 * A layer holds a chord on one sustained instrument: change the chord and the old notes fade as
 * the new ones come in, each note a looping table at its own rate, drifting a little in level so
 * the chord breathes. A struck sound plays once. A piece's score (its `partitura`) only says which
 * chords, which layers how loud, and what to strike when; it never touches nodes.
 */

export interface Plan {
  /** Sustained instruments and the roots to build them at (each note plays from the nearest one). */
  sostenidos: Record<string, number[]>;
  texturas: string[];
  /** Struck instruments and the pitches to have ready (others are built when first asked for). */
  golpes?: Record<string, number[]>;
}

/** Builds tables off the main thread when it can, so the film never stutters while they are made. */
async function forjarTodo(sr: number, pedidos: { nombre: string; raiz: number }[], hilo: boolean): Promise<Tabla[]> {
  if (hilo && typeof Worker !== 'undefined') {
    try {
      const w = new Worker(new URL('./forja.worker.ts', import.meta.url), { type: 'module' });
      const r = await new Promise<Tabla[]>((ok, mal) => {
        w.onmessage = (e) => ok(e.data as Tabla[]);
        w.onerror = mal;
        w.postMessage({ sr, pedidos });
      });
      w.terminate();
      return r;
    } catch {
      // (fall through: build them here)
    }
  }
  return pedidos.map((p) => forjar(sr, p.nombre, p.raiz));
}

const clave = (nombre: string, f: number) => `${nombre}@${f.toFixed(2)}`;

export class Motor {
  readonly ctx: BaseAudioContext;
  /** The overall level (the on/off button acts here), and the mix before it (a piece's slow silences). */
  readonly nivel: GainNode;
  readonly pleno: GainNode;
  readonly seco: GainNode;
  readonly envio: GainNode;
  private tablas = new Map<string, AudioBuffer>();
  private raices = new Map<string, number[]>();
  private golpes = new Map<string, AudioBuffer>();
  readonly azar = azar(1);

  constructor(ctx: BaseAudioContext) {
    this.ctx = ctx;
    this.nivel = ctx.createGain();
    this.nivel.gain.value = 0;
    this.pleno = ctx.createGain();
    // A gentle glue that also keeps a pile of bells from ever clipping.
    const cola = ctx.createDynamicsCompressor();
    cola.threshold.value = -14;
    cola.knee.value = 8;
    cola.ratio.value = 3;
    cola.attack.value = 0.03;
    cola.release.value = 0.6;
    const corte = ctx.createBiquadFilter();
    corte.type = 'highpass';
    corte.frequency.value = 32;
    corte.Q.value = 0.6;
    corte.connect(cola).connect(this.pleno).connect(this.nivel).connect(ctx.destination);
    this.seco = ctx.createGain();
    this.seco.connect(corte);
    this.envio = ctx.createGain();
    const conv = ctx.createConvolver();
    const ir = sala(ctx.sampleRate);
    const b = ctx.createBuffer(2, ir.L.length, ctx.sampleRate);
    b.copyToChannel(ir.L as Float32Array<ArrayBuffer>, 0);
    b.copyToChannel(ir.R as Float32Array<ArrayBuffer>, 1);
    conv.buffer = b;
    const retorno = ctx.createGain();
    retorno.gain.value = 1;
    this.envio.connect(conv).connect(retorno).connect(corte);
  }

  get ahora() {
    return this.ctx.currentTime;
  }

  private buffer(t: Tabla) {
    const b = this.ctx.createBuffer(2, t.L.length, this.ctx.sampleRate);
    b.copyToChannel(t.L as Float32Array<ArrayBuffer>, 0);
    b.copyToChannel(t.R as Float32Array<ArrayBuffer>, 1);
    return b;
  }

  /** Builds every table the plan asks for (`hilo`: in a worker; the laboratory's variants live only here). */
  async preparar(plan: Plan, hilo = true) {
    const pedidos: { nombre: string; raiz: number }[] = [];
    for (const [nombre, rs] of Object.entries(plan.sostenidos)) for (const raiz of rs) pedidos.push({ nombre, raiz });
    for (const nombre of plan.texturas) pedidos.push({ nombre, raiz: 0 });
    for (const [nombre, fs] of Object.entries(plan.golpes ?? {})) for (const raiz of fs) pedidos.push({ nombre, raiz });
    const tablas = await forjarTodo(this.ctx.sampleRate, pedidos, hilo);
    pedidos.forEach((p, i) => {
      const buf = this.buffer(tablas[i]);
      if (p.nombre in GOLPES) this.golpes.set(clave(p.nombre, p.raiz), buf);
      else {
        this.tablas.set(clave(p.nombre, p.raiz), buf);
        this.raices.set(p.nombre, [...(this.raices.get(p.nombre) ?? []), p.raiz].sort((a, b) => a - b));
      }
    });
  }

  /** The table to play a note `f` on an instrument, and at what rate. */
  muestra(nombre: string, f = 0) {
    const rs = this.raices.get(nombre);
    if (!rs) throw new Error(`«${nombre}» was not prepared`);
    if (rs[0] === 0) return { buf: this.tablas.get(clave(nombre, 0))!, rate: 1 };
    let mejor = rs[0];
    for (const r of rs) if (Math.abs(Math.log(f / r)) < Math.abs(Math.log(f / mejor))) mejor = r;
    return { buf: this.tablas.get(clave(nombre, mejor))!, rate: f / mejor };
  }

  /** A layer on a sustained instrument (or a texture). */
  capa(nombre: string, o: CapaOpciones = {}) {
    return new Capa(this, nombre, o);
  }

  /**
   * Strikes a sound once: a struck instrument at pitch `f`, `nivel` loud, at `pan` (−1..1), with
   * `envio` of it into the hall; `cuando` in the context's seconds (now if absent).
   */
  toque(nombre: string, f: number, nivel = 1, o: { pan?: number; envio?: number; seco?: number; cuando?: number; rate?: number } = {}) {
    const k = clave(nombre, f);
    let buf = this.golpes.get(k);
    if (!buf) {
      buf = this.buffer(forjar(this.ctx.sampleRate, nombre, f));
      this.golpes.set(k, buf);
    }
    const t = o.cuando ?? this.ahora;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    if (o.rate) src.playbackRate.value = o.rate;
    const g = this.ctx.createGain();
    // (a sound arrives at once at its full level; the reverb's send carries its tail)
    g.gain.value = nivel;
    const p = this.ctx.createStereoPanner();
    p.pan.value = o.pan ?? 0;
    src.connect(g).connect(p);
    const s = this.ctx.createGain();
    s.gain.value = o.seco ?? 0.6;
    p.connect(s).connect(this.seco);
    const e = this.ctx.createGain();
    e.gain.value = o.envio ?? 0.6;
    p.connect(e).connect(this.envio);
    src.start(t);
    src.onended = () => {
      g.disconnect();
      p.disconnect();
      s.disconnect();
      e.disconnect();
    };
  }

  /** Glides the overall level to `v` with time constant `tau` (s). */
  volumen(v: number, tau = 0.5) {
    this.nivel.gain.setTargetAtTime(v, this.ahora, tau);
  }
}

export interface CapaOpciones {
  /** How much goes dry and how much into the hall (0..1). */
  seco?: number;
  envio?: number;
  /** A low-pass on the layer (Hz), to darken it. */
  filtro?: number;
  /** How much each note drifts in level (0..1), and how slowly (Hz). */
  deriva?: number;
  ritmo?: number;
}

interface Voz {
  f: number;
  src: AudioBufferSourceNode;
  peso: GainNode;
  rate: number;
  lfo: OscillatorNode;
}

export class Capa {
  readonly salida: GainNode;
  readonly filtro: BiquadFilterNode;
  private voces: Voz[] = [];
  private tono = 1;
  private m: Motor;
  private nombre: string;
  private o: CapaOpciones;

  constructor(m: Motor, nombre: string, o: CapaOpciones) {
    this.m = m;
    this.nombre = nombre;
    this.o = o;
    const { ctx } = m;
    this.filtro = ctx.createBiquadFilter();
    this.filtro.type = 'lowpass';
    this.filtro.frequency.value = o.filtro ?? 18000;
    this.filtro.Q.value = 0.5;
    this.salida = ctx.createGain();
    this.salida.gain.value = 0;
    this.filtro.connect(this.salida);
    const s = ctx.createGain();
    s.gain.value = o.seco ?? 0.5;
    this.salida.connect(s).connect(m.seco);
    const e = ctx.createGain();
    e.gain.value = o.envio ?? 0.6;
    this.salida.connect(e).connect(m.envio);
  }

  /** The notes now (Hz; a texture takes [1]); old notes fade out over `fundido` s as new ones fade in. */
  acorde(notas: number[], fundido = 4, pesos?: number[]) {
    const { ctx } = this.m;
    const t = this.m.ahora;
    const tau = fundido / 3;
    const norm = 1 / Math.sqrt(Math.max(1, notas.length));
    const quedan: Voz[] = [];
    const usadas = new Set<number>();
    for (const v of this.voces) {
      const i = notas.findIndex((f, j) => !usadas.has(j) && Math.abs(f - v.f) < 0.01);
      if (i >= 0) {
        usadas.add(i);
        v.peso.gain.setTargetAtTime((pesos?.[i] ?? 1) * norm, t, tau);
        quedan.push(v);
      } else {
        v.peso.gain.setTargetAtTime(0, t, tau);
        v.src.stop(t + fundido * 2.5);
        v.lfo.stop(t + fundido * 2.5);
      }
    }
    notas.forEach((f, i) => {
      if (usadas.has(i)) return;
      const { buf, rate } = this.m.muestra(this.nombre, f);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.playbackRate.value = rate * this.tono;
      const peso = ctx.createGain();
      peso.gain.value = 0;
      peso.gain.setTargetAtTime((pesos?.[i] ?? 1) * norm, t, tau);
      // the note drifts a little in level, each at its own slow pace: the chord breathes
      const d = this.o.deriva ?? 0.25;
      const vive = ctx.createGain();
      vive.gain.value = 1 - d / 2;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = (this.o.ritmo ?? 0.05) * (0.6 + 0.8 * this.m.azar());
      const prof = ctx.createGain();
      prof.gain.value = d / 2;
      lfo.connect(prof).connect(vive.gain);
      src.connect(peso).connect(vive).connect(this.filtro);
      src.start(t, this.m.azar() * buf.duration);
      lfo.start(t);
      src.onended = () => {
        peso.disconnect();
        vive.disconnect();
        prof.disconnect();
      };
      quedan.push({ f, src, peso, rate, lfo });
    });
    this.voces = quedan;
  }

  /** The layer's level, gliding with time constant `tau` (s). */
  nivel(v: number, tau = 1.5) {
    this.salida.gain.setTargetAtTime(v, this.m.ahora, tau);
  }

  /** Every note `ratio` higher (a Doppler shift, the redshift of an expanding universe). */
  transponer(ratio: number, tau = 0.5) {
    if (Math.abs(ratio - this.tono) < 1e-4) return;
    this.tono = ratio;
    for (const v of this.voces) v.src.playbackRate.setTargetAtTime(v.rate * ratio, this.m.ahora, tau);
  }

  /** The layer's low-pass (Hz). */
  brillo(hz: number, tau = 1) {
    this.filtro.frequency.setTargetAtTime(hz, this.m.ahora, tau);
  }
}

/** A rendered buffer as a 16-bit WAV file. */
export function wav(b: AudioBuffer): ArrayBuffer {
  const n = b.length;
  const ch = b.numberOfChannels;
  const out = new ArrayBuffer(44 + n * ch * 2);
  const v = new DataView(out);
  const s = (o: number, t: string) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  s(0, 'RIFF');
  v.setUint32(4, 36 + n * ch * 2, true);
  s(8, 'WAVE');
  s(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, ch, true);
  v.setUint32(24, b.sampleRate, true);
  v.setUint32(28, b.sampleRate * ch * 2, true);
  v.setUint16(32, ch * 2, true);
  v.setUint16(34, 16, true);
  s(36, 'data');
  v.setUint32(40, n * ch * 2, true);
  const datos = Array.from({ length: ch }, (_, c) => b.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < ch; c++) {
      v.setInt16(o, Math.max(-1, Math.min(1, datos[c][i])) * 32767, true);
      o += 2;
    }
  return out;
}
