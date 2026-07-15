// Ability (ARCH-3.3): habilidad de una persona/grupo.
// Glosario normativo: fuerza -> strength, percepción -> awareness, destreza -> craftsmanship.
// No se pagan ni se gastan: basta con tenerlas (GR-7.1).
export const ABILITIES = ["strength", "awareness", "craftsmanship"] as const;
export type Ability = (typeof ABILITIES)[number];

// Vector de requisitos/aportes por habilidad (CD-6.1). Las ausentes valen 0.
export type AbilityVector = Partial<Record<Ability, number>>;
