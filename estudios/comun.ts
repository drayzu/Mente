import * as THREE from 'three';

/** What the studies share: the series' colours and small helpers. */

export const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
/** «Tú»: the teal of the civilization in Destino, our colour in the series. */
export const TU = new THREE.Color(0.45, 1.0, 0.85);
/** The brain: Destino's warm coral. */
export const CORAL = new THREE.Color(1.0, 0.5, 0.38);
/** The machine: Destino's blue-white. */
export const MAQUINA = new THREE.Color(0.78, 0.88, 1.0);
/** The work's colour (proposed): a soft gold. */
export const ORO3 = new THREE.Color(1.0, 0.82, 0.5);

export const ease = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Looks the camera from `pos` at `at`, with `up`. */
export function mirar(camera: THREE.PerspectiveCamera, pos: THREE.Vector3, at: THREE.Vector3, up = V(0, 1, 0)) {
  camera.position.copy(pos);
  camera.up.copy(up);
  camera.lookAt(at);
}

/** Interpolates between two distances in log space (camera pull-backs feel even). */
export const logLerp = (a: number, b: number, t: number) => Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t);

/**
 * GLSL that cannot make a NaN (one bad pixel blackens the frame through the bloom): use these
 * instead of bare pow and sqrt.
 */
export const SEGURO = /* glsl */ `
  float pw(float x, float n) { return pow(max(x, 0.0), n); }
  float rz(float x) { return sqrt(max(x, 0.0)); }
`;
