import { describe, it, expect } from "vitest";
import { reduce, type ReduceDeps, type ReduceResult, type DomainError } from "./reduce";
import type { Command } from "./commands";
import { makeGame, makeGroup, gid } from "./game.fixtures";

// Deps: chooseCard/sleepEarly/revelación no usan azar; un Rng trivial basta (BE-9).
const deps: ReduceDeps = { rng: { unit: () => 0 } };

function run(state: Parameters<typeof reduce>[0], cmd: Command): ReduceResult {
  return reduce(state, cmd, deps);
}
function ok(r: ReduceResult) {
  if (!r.ok) throw new Error(`esperaba ok, error ${r.error.code}`);
  return r;
}
function fail(r: ReduceResult): DomainError {
  if (r.ok) throw new Error("esperaba error, fue ok");
  return r.error;
}

describe("day.choosing — chooseCard (GR-5.2, GR-5.3, BE-5.3)", () => {
  it("GR-5.2/GR-5.3: coloca la elegida boca abajo y devuelve las 2 no elegidas al tope en el orden pedido", () => {
    const game = makeGame([
      makeGroup("g1", ["A", "B", "C", "D"]),
      makeGroup("g2", ["E", "F", "G"]),
    ]);
    // Elige B (índice 1); devuelve C (índice 2) y A (índice 0) al tope, en ese orden.
    const r = ok(run(game, { type: "chooseCard", groupId: gid("g1"), chosenIndex: 1, returnOrder: [2, 0] }));
    const g1 = r.state.groups["g1"]!;
    expect(g1.chosenCard).toBe("B");
    expect(g1.deck).toEqual(["C", "A", "D"]);
    // Aún no revela: g2 no ha elegido.
    expect(r.state.subState).toBe("choosing");
    expect(r.events.map((e) => e.type)).not.toContain("revealed");
  });

  it("GR-5.5: con menos de 3 cartas se elige entre las disponibles", () => {
    const game = makeGame([makeGroup("g1", ["A", "B"]), makeGroup("g2", ["E", "F"])]);
    const r = ok(run(game, { type: "chooseCard", groupId: gid("g1"), chosenIndex: 0, returnOrder: [1] }));
    const g1 = r.state.groups["g1"]!;
    expect(g1.chosenCard).toBe("A");
    expect(g1.deck).toEqual(["B"]);
  });

  it("NOT_YOUR_PHASE fuera de day.choosing", () => {
    const game = makeGame([makeGroup("g1", ["A", "B", "C"])], { subState: "resolving" });
    expect(fail(run(game, { type: "chooseCard", groupId: gid("g1"), chosenIndex: 0, returnOrder: [1, 2] })).code).toBe("NOT_YOUR_PHASE");
  });

  it("NOT_AWAKE si el grupo duerme (GR-5.9)", () => {
    const game = makeGame([makeGroup("g1", [], { status: "asleep" }), makeGroup("g2", ["E", "F", "G"])]);
    expect(fail(run(game, { type: "chooseCard", groupId: gid("g1"), chosenIndex: 0, returnOrder: [1, 2] })).code).toBe("NOT_AWAKE");
  });

  it("ILLEGAL_CHOICE si el índice está fuera de rango", () => {
    const game = makeGame([makeGroup("g1", ["A", "B", "C"]), makeGroup("g2", ["E"])]);
    expect(fail(run(game, { type: "chooseCard", groupId: gid("g1"), chosenIndex: 5, returnOrder: [0, 1] })).code).toBe("ILLEGAL_CHOICE");
  });

  it("ILLEGAL_CHOICE si returnOrder no es permutación de las no elegidas", () => {
    const game = makeGame([makeGroup("g1", ["A", "B", "C"]), makeGroup("g2", ["E"])]);
    // chosenIndex 0 -> no elegidas {1,2}; returnOrder incluye la elegida (0).
    expect(fail(run(game, { type: "chooseCard", groupId: gid("g1"), chosenIndex: 0, returnOrder: [0, 2] })).code).toBe("ILLEGAL_CHOICE");
  });

  it("ILLEGAL_CHOICE si el grupo ya eligió este turno", () => {
    const game = makeGame([
      makeGroup("g1", ["A", "B"], { chosenCard: "Z" as never }),
      makeGroup("g2", ["E"]),
    ]);
    expect(fail(run(game, { type: "chooseCard", groupId: gid("g1"), chosenIndex: 0, returnOrder: [1] })).code).toBe("ILLEGAL_CHOICE");
  });
});

describe("day — revelación atómica (GR-5.6, BE-5.4, API-7)", () => {
  it("revela cuando todos los despiertos han elegido y pasa a resolving", () => {
    const game = makeGame([makeGroup("g1", ["A", "B", "C"]), makeGroup("g2", ["E", "F", "G"])]);
    const afterG1 = ok(run(game, { type: "chooseCard", groupId: gid("g1"), chosenIndex: 0, returnOrder: [1, 2] }));
    expect(afterG1.state.subState).toBe("choosing"); // falta g2
    const afterG2 = ok(run(afterG1.state, { type: "chooseCard", groupId: gid("g2"), chosenIndex: 0, returnOrder: [1, 2] }));
    expect(afterG2.state.subState).toBe("resolving");
    expect(afterG2.events.map((e) => e.type)).toContain("revealed");
    const g1 = afterG2.state.groups["g1"]!;
    const g2 = afterG2.state.groups["g2"]!;
    expect(g1.revealedCard).toBe("A");
    expect(g1.chosenCard).toBeNull();
    expect(g1.cardSpent).toBe(false);
    expect(g2.revealedCard).toBe("E");
  });

  it("API-7.4: con un solo despierto, revela igual", () => {
    const game = makeGame([makeGroup("g1", ["A", "B", "C"]), makeGroup("g2", [], { status: "asleep" })]);
    const r = ok(run(game, { type: "chooseCard", groupId: gid("g1"), chosenIndex: 0, returnOrder: [1, 2] }));
    expect(r.state.subState).toBe("resolving");
    expect(r.state.groups["g1"]!.revealedCard).toBe("A");
  });

  it("GR-5.9: un grupo despierto con mazo vacío se duerme y no bloquea la revelación", () => {
    // g2 despierto pero con mazo vacío: al procesar, se autoduerme (GR-5.9).
    const game = makeGame([makeGroup("g1", ["A"]), makeGroup("g2", [])]);
    const r = ok(run(game, { type: "chooseCard", groupId: gid("g1"), chosenIndex: 0, returnOrder: [] }));
    expect(r.state.groups["g2"]!.status).toBe("asleep");
    expect(r.state.subState).toBe("resolving");
    expect(r.state.groups["g1"]!.revealedCard).toBe("A");
  });
});

describe("day.choosing — sleepEarly (GR-5.10, BE-5.3)", () => {
  it("descarta el mazo boca abajo sin heridas y duerme", () => {
    const game = makeGame([makeGroup("g1", ["A", "B", "C"]), makeGroup("g2", ["E", "F"])]);
    const r = ok(run(game, { type: "sleepEarly", groupId: gid("g1") }));
    const g1 = r.state.groups["g1"]!;
    expect(g1.status).toBe("asleep");
    expect(g1.deck).toEqual([]);
    expect(r.state.discardFaceDown).toEqual(["A", "B", "C"]); // boca abajo, sin efecto
    expect(r.state.skulls).toBe(0); // GR-5.10: sin heridas ni calaveras
    expect(r.state.subState).toBe("choosing"); // g2 sigue despierto sin elegir
  });

  it("sleepEarly del último despierto dispara la revelación de los que ya eligieron", () => {
    const game = makeGame([
      makeGroup("g1", ["A", "B"], { chosenCard: "A" as never }),
      makeGroup("g2", ["E", "F"]),
    ]);
    const r = ok(run(game, { type: "sleepEarly", groupId: gid("g2") }));
    expect(r.state.groups["g2"]!.status).toBe("asleep");
    expect(r.state.subState).toBe("resolving");
    expect(r.state.groups["g1"]!.revealedCard).toBe("A");
    expect(r.events.map((e) => e.type)).toContain("revealed");
  });
});
