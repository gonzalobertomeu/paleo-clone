import { describe, it, expect } from "vitest";
import { augmentRequirements, rollDie, DIE_FACES } from "./dice";
import { SeededRng } from "../infrastructure/seeded-rng.adapter";

// Cada test referencia la regla del dominio que ejerce por su ID (ARCH-8.1).
describe("dice — dado de símbolos (GR-11)", () => {
  it("GR-11.6: una cara aumenta solo el requisito de su habilidad", () => {
    const r = augmentRequirements({ awareness: 3 }, [
      { ability: "awareness", amount: 2 },
    ]);
    expect(r).toEqual({ awareness: 5 });
  });

  it("GR-11.6 / CD-5.12: puede introducir un requisito que la carta no pedía", () => {
    const r = augmentRequirements({ strength: 2 }, [
      { ability: "craftsmanship", amount: 1 },
    ]);
    expect(r).toEqual({ strength: 2, craftsmanship: 1 });
  });

  it("GR-11.8: con 2 dados, aumentos de la misma habilidad se suman", () => {
    const r = augmentRequirements({}, [
      { ability: "strength", amount: 2 },
      { ability: "strength", amount: 1 },
    ]);
    expect(r).toEqual({ strength: 3 });
  });

  it("GR-11.8: caras distintas suben dos requisitos a la vez", () => {
    const r = augmentRequirements({}, [
      { ability: "strength", amount: 2 },
      { ability: "craftsmanship", amount: 1 },
    ]);
    expect(r).toEqual({ strength: 2, craftsmanship: 1 });
  });

  it("BE-9.3 / GR-11.5: la tirada es determinista para (seed, index)", () => {
    const rng = new SeededRng();
    const a = rollDie(rng, 42, 7);
    const b = rollDie(rng, 42, 7);
    expect(a).toEqual(b);
    expect(DIE_FACES).toContainEqual(a);
  });
});
