import type { Ability, AbilityVector } from "@paleo/shared";
import type { Rng } from "./ports/rng";

// Dado de símbolos, NO numérico (GR-11.5, CD-5.12). 6 caras, cada una un par
// {ability, amount} con amount ∈ {1, 2}. Cada cara aumenta el requisito de ESA
// habilidad concreta (GR-11.6), no un umbral genérico.
export interface DieFace {
  ability: Ability;
  amount: 1 | 2;
}

export const DIE_FACES: readonly DieFace[] = [
  { ability: "strength", amount: 1 },
  { ability: "strength", amount: 2 },
  { ability: "awareness", amount: 1 },
  { ability: "awareness", amount: 2 },
  { ability: "craftsmanship", amount: 1 },
  { ability: "craftsmanship", amount: 2 },
];

// Tira 1 dado usando la extracción `index` del stream sembrado (BE-9.2). Pura.
export function rollDie(rng: Rng, seed: number, index: number): DieFace {
  const u = rng.unit(seed, index);
  const i = Math.min(DIE_FACES.length - 1, Math.floor(u * DIE_FACES.length));
  return DIE_FACES[i]!;
}

// Transforma el vector de requisitos de una opción según las caras tiradas
// (GR-11.6, GR-11.8, CD-5.12). Con varias caras (p.ej. 2 dados) los aumentos se
// ACUMULAN: se suman si coinciden en habilidad, y suben dos requisitos a la vez si no.
// Puede INTRODUCIR un requisito que la carta no pedía. La legalidad (CD-6.3) se evalúa
// siempre contra el requisito ya aumentado, nunca contra el impreso.
export function augmentRequirements(
  base: AbilityVector,
  faces: readonly DieFace[],
): AbilityVector {
  const out: AbilityVector = { ...base };
  for (const face of faces) {
    out[face.ability] = (out[face.ability] ?? 0) + face.amount;
  }
  return out;
}
