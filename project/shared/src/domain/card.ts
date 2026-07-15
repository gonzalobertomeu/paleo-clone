// Tipos de carta expuestos al cliente (CD-2, CD-3, CD-4). Solo forma, sin corpus (CD-1.3).

// Dorso: terrain con vocabulario extensible por módulo (CD-3.1, GR-6.8).
// Núcleo del juego base; `red` = peligro (semántica reservada, CD-3.3).
export type Terrain = "forest" | "river" | "mountain" | "camp" | "red" | (string & {});

// El dorso es lo único que el jugador ve al elegir (GR-5.2); nunca la cara si no está revelada.
export interface CardBack {
  terrain: Terrain;
  symbols?: string[]; // pistas adicionales (CD-3.2), vocabulario abierto.
}

// Tipo de cara (CD-4). Enumeración cerrada.
export type CardKind =
  | "action"
  | "hazard"
  | "person"
  | "mission"
  | "secret"
  | "dream"
  | "idea";
