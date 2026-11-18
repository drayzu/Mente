// Copied from horizontes-sonido (src/sonido/director.ts); edit it there and copy again.
import { Capa, Motor, type CapaOpciones, type Plan } from './motor';
import { acorde, hz } from './notas';

/**
 * The director: a piece's score (its scenes) played on the engine, frame by frame, from what the
 * piece says is happening. A scene is what sounds while a moment lasts: which chord on which layer,
 * how loud, whether you (the series' breathing point) are heard, the bell that marks its arrival,
 * and whether it is one of the silences. Moving between scenes, the old chords fade as the new ones
 * come in; the bell rings only going forward. The wind follows the hand on the scroll.
 *
 * Everything the director does depends only on the states it is given, so a journey can be heard
 * live or rendered offline from a recording of its frames (the same sound).
 */

export interface CapaDef extends CapaOpciones {
  instr: string;
  /** This layer's level at a scene's 1 (the mix). */
  base?: number;
  /** Follows the piece's transposition (a Doppler shift, a redshift); textures and you do not. */
  transpone?: boolean;
}

export interface Escena {
  /** Per layer: the notes («D3 A3 E4»; «» for a texture) and the level (0..1, × the layer's base). */
  capas?: Record<string, [notas: string, nivel: number] | [notas: string, nivel: number, brillo: number]>;
  /** The note the bell plays when the scene arrives (none: no bell). */
  campana?: string;
  /** You are heard (the point breathes). */
  tu?: boolean;
  /** One of the silences: everything goes, even the wind. */
  silencio?: boolean;
  /** How long the change takes (s). */
  fundido?: number;
  /**
   * A rain of soft struck notes while the scene lasts (thoughts as bits, machines copying
   * themselves, a nerve's signal): `ritmo` a second on average, each a note of `notas` at random, or
   * all of them as a quick run (`arpegio`).
   */
  lluvia?: Lluvia | Lluvia[];
  /** Struck once as the scene arrives, going forward (a whoosh, a thump, a flare): any struck instrument. */
  llegada?: Toque | Toque[];
  /** A struck sound repeated evenly while the scene lasts (a heartbeat): every `cada` seconds. */
  pulso?: { instr: string; nota: string; cada: number; nivel: number; envio?: number };
}

export interface Lluvia {
  instr: string;
  notas: string;
  ritmo: number;
  nivel: number;
  arpegio?: boolean;
  /** How much of each note goes into the hall (0.75 if absent). */
  envio?: number;
}

export interface Toque {
  instr: string;
  nota: string;
  nivel: number;
  envio?: number;
  seco?: number;
  pan?: number;
  /** Seconds after the arrival. */
  tras?: number;
}

export interface Config {
  plan: Plan;
  capas: Record<string, CapaDef>;
  campana: { instr: string; nivel: number; envio?: number; seco?: number };
  tu: { instr: string; notas: string; nivel: number };
  aire: { nivel: number; desde?: number; hasta?: number };
}

export interface Estado {
  /** The scene in force (a moment's name) or null. */
  escena: string | null;
  /** The journey's pace (beats/s, signed) and whether this frame jumped (a rung, a seek). */
  ritmo: number;
  salto?: boolean;
  /** Ambient seconds (the point breathes with them, as on screen). */
  tiempo: number;
  /** The pitch of everything that transposes (1: as written), and of single layers apart from it. */
  tono?: number;
  tonos?: Record<string, number>;
  /** How much of the silence there is besides the scene's own (0..1). */
  silencio?: number;
  /** How fast the journey feels for the wind (0..1), when the beats' pace is not the measure (a zoom). */
  viento?: number;
}

const BREATH = 1.5;

export function crearDirector(m: Motor, cfg: Config, escenas: Record<string, Escena>) {
  const capas: Record<string, Capa> = {};
  for (const [nombre, d] of Object.entries(cfg.capas)) capas[nombre] = m.capa(d.instr, d);
  const tu = m.capa(cfg.tu.instr, { seco: 0.55, envio: 0.55, deriva: 0.1 });
  tu.acorde(acorde(cfg.tu.notas), 0.01);
  const aire = m.capa('aire', { seco: 0.8, envio: 0.25, filtro: 400 });
  aire.acorde([1], 0.01);
  let actual: string | null | undefined;
  let tuNivel = 0;
  let tuMeta = 0;
  let ultimo = -1;
  let silencio = 0;
  let lluvias: { l: Lluvia; gota: number }[] = [];
  let pulso: Escena['pulso'];
  let latido = 0;
  let tonoActual = 1;
  /** The last few scenes: one that comes back so soon (a name that returns) does not ring its arrival again. */
  const recientes: string[] = [];
  const intervalo = (r: number) => -Math.log(1 - m.azar() * 0.999) / r;

  function aplicar(e: Escena | undefined, fundido: number, campana: boolean) {
    silencio = e?.silencio ? 1 : 0;
    for (const [nombre, c] of Object.entries(capas)) {
      const def = cfg.capas[nombre];
      const v = e?.silencio ? undefined : e?.capas?.[nombre];
      if (v) {
        const notas = v[0].trim() ? acorde(v[0]) : [1];
        c.acorde(notas, fundido);
        c.nivel(v[1] * (def.base ?? 1), fundido / 3);
        // (a scene that says nothing of the low-pass opens it back to the layer's own)
        c.brillo(v[2] ?? def.filtro ?? 18000, fundido / 3);
      } else c.nivel(0, (e?.silencio ? 1.6 : fundido) / 3);
    }
    tuMeta = e?.tu && !e.silencio ? 1 : 0;
    const ls = e?.silencio || !e?.lluvia ? [] : Array.isArray(e.lluvia) ? e.lluvia : [e.lluvia];
    lluvias = ls.map((l) => ({ l, gota: m.ahora + intervalo(l.ritmo) * 0.5 }));
    pulso = e?.silencio ? undefined : e?.pulso;
    latido = m.ahora + 0.4;
    if (campana && e?.llegada && !e.silencio)
      for (const q of Array.isArray(e.llegada) ? e.llegada : [e.llegada])
        m.toque(q.instr, hz(q.nota), q.nivel, { envio: q.envio ?? 0.6, seco: q.seco ?? 0.6, pan: q.pan ?? 0, cuando: m.ahora + (q.tras ?? 0), rate: q.instr === 'golpe' || q.instr === 'soplo' ? undefined : tonoActual });
    if (campana && e?.campana) m.toque(cfg.campana.instr, hz(e.campana), cfg.campana.nivel, { envio: cfg.campana.envio ?? 0.65, seco: cfg.campana.seco ?? 0.5, pan: Math.sin(hz(e.campana)) * 0.35, rate: tonoActual });
  }

  return {
    capas,
    /** Per frame. */
    update(s: Estado) {
      const t = m.ahora;
      const dt = ultimo < 0 ? 0 : Math.min(0.2, Math.max(0, t - ultimo));
      ultimo = t;
      tonoActual = s.tono ?? 1;
      // (a name the score does not know, or none, keeps the scene that was sounding)
      const escena = s.escena && escenas[s.escena] ? s.escena : (actual ?? null);
      if (escena !== actual) {
        const primera = actual === undefined;
        actual = escena;
        const e = escena ? escenas[escena] : undefined;
        const nueva = !!escena && !recientes.includes(escena);
        if (escena) {
          recientes.push(escena);
          if (recientes.length > 4) recientes.shift();
        }
        aplicar(e, primera || s.salto ? 1.5 : (e?.fundido ?? 4), !primera && !s.salto && s.ritmo > 0.02 && nueva);
      }
      const extra = Math.max(silencio, s.silencio ?? 0);
      // you: the point's breath, in step with the one on screen (0.86 + 0.14 sin 1.5t there; deeper here)
      tuNivel += (tuMeta * (1 - extra) - tuNivel) * Math.min(1, dt / 1.2);
      const respira = 0.5 + 0.5 * Math.sin(BREATH * s.tiempo);
      tu.salida.gain.setTargetAtTime(cfg.tu.nivel * tuNivel * (0.25 + 0.75 * respira), t, 0.08);
      // the wind: only while the journey moves, louder and brighter the faster
      const v = s.viento ?? Math.min(1, Math.abs(s.ritmo) / 3);
      aire.salida.gain.setTargetAtTime(cfg.aire.nivel * Math.pow(v, 1.3) * (1 - extra), t, 0.25);
      aire.filtro.frequency.setTargetAtTime((cfg.aire.desde ?? 300) + v * ((cfg.aire.hasta ?? 2200) - (cfg.aire.desde ?? 300)), t, 0.25);
      // a silence the piece brings on by degrees (the far future's), over the whole mix
      m.pleno.gain.setTargetAtTime(1 - (s.silencio ?? 0), t, 0.5);
      // the rains of notes
      for (const q of lluvias) {
        const { l } = q;
        if (t - q.gota > 1) q.gota = t;
        if (extra >= 0.5) continue;
        while (q.gota <= t) {
          const notas = acorde(l.notas);
          const pan = m.azar() * 1.4 - 0.7;
          const envio = l.envio ?? 0.75;
          if (l.arpegio) notas.forEach((f, i) => m.toque(l.instr, f, l.nivel * (1 - i * 0.15), { pan: pan + i * 0.15, envio, cuando: Math.max(t, q.gota) + i * 0.07, rate: tonoActual }));
          else m.toque(l.instr, notas[Math.floor(m.azar() * notas.length)], l.nivel * (0.5 + 0.5 * m.azar()), { pan, envio, cuando: Math.max(t, q.gota), rate: tonoActual });
          q.gota += intervalo(l.ritmo);
        }
      }
      // the pulse (a heartbeat): even, never hurried by the scroll
      if (pulso && extra < 0.5) {
        if (t - latido > pulso.cada * 2) latido = t;
        while (latido <= t) {
          m.toque(pulso.instr, hz(pulso.nota), pulso.nivel, { envio: pulso.envio ?? 0.3, seco: 0.8, cuando: Math.max(t, latido) });
          latido += pulso.cada;
        }
      }
      const tono = s.tono ?? 1;
      for (const [nombre, c] of Object.entries(capas)) if (cfg.capas[nombre].transpone !== false) c.transponer(s.tonos?.[nombre] ?? tono, 0.4);
    },
    /** Strikes the score's bell (or another instrument) now, outside the scenes (a flash, a launch). */
    toque(instr: string, nota: string | number, nivel: number, o: { pan?: number; envio?: number; seco?: number } = {}) {
      m.toque(instr, typeof nota === 'number' ? nota : hz(nota), nivel, { ...o, rate: tonoActual });
    },
  };
}
export type Director = ReturnType<typeof crearDirector>;
