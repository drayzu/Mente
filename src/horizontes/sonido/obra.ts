// Copied from horizontes-sonido (src/sonido/obra.ts); edit it there and copy again.
import { Motor, wav } from './motor';
import { crearDirector, type Config, type Director, type Escena, type Estado } from './director';

/**
 * A piece's sound, ready to plug into its page: off until asked for, built the first time it is
 * turned on (its instruments off the main thread), paused with the tab. The piece gives its mix
 * (`Config`), its score (one scene per moment) and, if it has signs of its own (a pitch that follows
 * the scale, a plasma that rings), a `gancho` that turns what the page says each frame into what the
 * director hears.
 *
 * The same frames can be rendered offline (`renderizar`), exactly as they would sound live: that is
 * how a whole journey is measured without anyone listening.
 */

/** What every page tells its sound each frame. */
export interface Sonando {
  /** The scene in force (a moment's name, as the score names it), or null. */
  escena: string | null;
  /** Beats per second (signed), and whether this frame jumped (a seek). */
  ritmo: number;
  salto?: boolean;
  /** Ambient seconds. */
  tiempo: number;
}

export interface Opciones<S extends Sonando> {
  /** The level with the sound on (0.8 if absent). */
  nivel?: number;
  /**
   * The piece's own signs. Called once the engine is built; what it returns is called every frame
   * and may give the director more (a `tono`, a `silencio`, a `viento`).
   */
  gancho?: (m: Motor, d: Director) => (s: S) => Partial<Estado> | void;
}

export function crearSonido<S extends Sonando = Sonando>(cfg: Config, escenas: Record<string, Escena>, o: Opciones<S> = {}) {
  let ctx: AudioContext | null = null;
  let motor: Motor | null = null;
  let tocar: ((s: S) => void) | null = null;
  let on = false;
  let armando: Promise<void> | null = null;
  const NIVEL = o.nivel ?? 0.8;

  const montar = (m: Motor) => {
    const d = crearDirector(m, cfg, escenas);
    const g = o.gancho?.(m, d);
    return (s: S) => d.update({ escena: s.escena, ritmo: s.ritmo, salto: s.salto, tiempo: s.tiempo, ...(g?.(s) ?? {}) });
  };
  const armar = async () => {
    ctx = new AudioContext();
    motor = new Motor(ctx);
    await motor.preparar(cfg.plan);
    tocar = montar(motor);
  };
  if (typeof document !== 'undefined')
    document.addEventListener('visibilitychange', () => {
      if (!ctx || !on) return;
      if (document.hidden) void ctx.suspend();
      else void ctx.resume();
    });

  return {
    get on() {
      return on;
    },
    /** Whether a moment has its scene (the pieces' tests list the ones that do not). */
    tiene: (escena: string) => escena in escenas,
    /** Turns the sound on or off; resolves to whether it is on. */
    async toggle() {
      on = !on;
      if (on) {
        armando ??= armar();
        await armando;
        void ctx!.resume();
      }
      motor?.volumen(on ? NIVEL : 0, on ? 0.8 : 0.3);
      return on;
    },
    /** Per frame, from the journey. */
    update(s: S) {
      if (on && tocar) tocar(s);
    },
    /** Frames at `fps` rendered offline, as they would sound live: a WAV file's bytes. */
    async renderizar(cuadros: S[], fps: number) {
      const sr = 48000;
      const off = new OfflineAudioContext(2, Math.ceil((cuadros.length / fps + 5) * sr), sr);
      const m = new Motor(off);
      await m.preparar(cfg.plan, false);
      const t = montar(m);
      m.nivel.gain.value = NIVEL;
      // (the director is told every few frames, as a page at 60 fps tells it more often than it matters)
      const paso = Math.max(1, Math.round(fps / 15));
      for (let k = 0; k < cuadros.length; k += paso) {
        const cuando = Math.max(k / fps, 128 / sr);
        void off.suspend(cuando).then(() => {
          t(cuadros[k]);
          void off.resume();
        });
      }
      return wav(await off.startRendering());
    },
  };
}
export type Sonido<S extends Sonando = Sonando> = ReturnType<typeof crearSonido<S>>;
