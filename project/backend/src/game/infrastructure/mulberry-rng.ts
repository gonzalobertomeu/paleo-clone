import type { Rng } from "../domain/ports/rng";

// Adaptador de azar determinista (BE-9, ARCH-4.6). Implementa el puerto `Rng` con un
// hash tipo mulberry32 sobre (seed, index): mismo par -> mismo valor, siempre.
// La DI de Nest que lo enlaza vive solo en infrastructure (ARCH-4.4, BE-2.5).
export class MulberryRng implements Rng {
  unit(seed: number, index: number): number {
    let a = (seed ^ Math.imul(index + 1, 0x9e3779b9)) >>> 0;
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
