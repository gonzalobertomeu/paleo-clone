// Puerto de azar (BE-4.2, ARCH-4.6). Fuente SEMBRADA y DETERMINISTA: una función pura
// de (seed, index). El estado del stream (seed + nº de extracciones) vive en el GameState
// (BE-9.2), no en el puerto. Así se concilia dominio puro (ARCH-4.5) con azar inyectado
// y reproducible (ARCH-4.6, ARCH-8.3): se inyecta el algoritmo, evaluarlo es puro.
export interface Rng {
  // Flotante determinista en [0, 1) para el par (seed, index).
  unit(seed: number, index: number): number;
}
