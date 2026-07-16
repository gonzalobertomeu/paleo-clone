import type { Rng } from "../domain/ports/rng";
import { mulberry32 } from "../../../libs/rng/mulberry";

// Adaptador que enchufa el PRNG puro de `libs/rng` al puerto `Rng` del dominio
// (ARCH-5.11, BE-9). Vive en la infrastructure del módulo `game`; la DI de Nest que
// lo enlaza vive aquí (ARCH-4.4, BE-2.5). Determinista para (seed, index).
export class SeededRng implements Rng {
  unit(seed: number, index: number): number {
    return mulberry32(seed, index);
  }
}
