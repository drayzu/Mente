// Copied from horizontes-sonido (src/sonido/forja.worker.ts); edit it there and copy again.
import { forjar, type Tabla } from './instrumentos';

/** Builds the engine's tables off the main thread (see `motor.ts`). */
self.onmessage = (e: MessageEvent<{ sr: number; pedidos: { nombre: string; raiz: number }[] }>) => {
  const { sr, pedidos } = e.data;
  const tablas: Tabla[] = pedidos.map((p) => forjar(sr, p.nombre, p.raiz));
  (self as unknown as Worker).postMessage(
    tablas,
    tablas.flatMap((t) => [t.L.buffer, t.R.buffer]),
  );
};
