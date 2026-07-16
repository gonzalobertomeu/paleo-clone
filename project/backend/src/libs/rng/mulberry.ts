// PRNG puro (libs/rng): mulberry32 sembrado por (seed, index). Bloque técnico
// AGNÓSTICO de negocio (ARCH-5.10): no conoce el puerto `Rng` ni el dominio. Un
// adaptador del módulo `game` lo enchufa al puerto (ARCH-5.11, BE-9). Determinista:
// mismo (seed, index) -> mismo valor, siempre.
export function mulberry32(seed: number, index: number): number {
  let a = (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
  a = (a + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
