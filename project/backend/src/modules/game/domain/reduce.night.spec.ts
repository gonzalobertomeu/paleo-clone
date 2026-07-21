import { describe, it, expect } from "vitest";
import { reduce, type ReduceDeps, type ReduceResult } from "./reduce";
import type { Command } from "./commands";
import { makeGame, makeGroup, makePerson, gid } from "./game.fixtures";

// La transición a noche y el alimentado (GR-12.2) son deterministas: Rng trivial (BE-9).
const deps: ReduceDeps = { rng: { unit: () => 0 } };

function run(state: Parameters<typeof reduce>[0], cmd: Command): ReduceResult {
  return reduce(state, cmd, deps);
}
function ok(r: ReduceResult) {
  if (!r.ok) throw new Error(`esperaba ok, error ${r.error.code}`);
  return r;
}

describe("día -> noche — transición GR-5.11 (BE-5.7)", () => {
  it("cuando todos duermen (sleepEarly del último despierto) pasa a night.feeding", () => {
    // g1 ya dormido; g2 es el único despierto y duerme temprano -> nadie despierto.
    const game = makeGame([
      makeGroup("g1", [], { status: "asleep" }),
      makeGroup("g2", ["E", "F"]),
    ]);
    const r = ok(run(game, { type: "sleepEarly", groupId: gid("g2") }));
    expect(r.state.phase).toBe("night");
    expect(r.state.subState).toBe("missions"); // sin comida que pagar (0 personas) -> avanza
    expect(r.events.map((e) => e.type)).toContain("nightStarted");
    // No revela: no quedaba nadie despierto que hubiera elegido.
    expect(r.events.map((e) => e.type)).not.toContain("revealed");
  });

  it("un grupo despierto que vacía su mazo sin elegir cierra el día si es el último (GR-5.9 -> GR-5.11)", () => {
    // g1 elige su única carta; g2 despierto pero con mazo vacío se autoduerme.
    // Tras la elección g1 sigue despierto -> revela, NO va a noche todavía.
    const game = makeGame([makeGroup("g1", ["A"]), makeGroup("g2", [])]);
    const r = ok(run(game, { type: "chooseCard", groupId: gid("g1"), chosenIndex: 0, returnOrder: [] }));
    expect(r.state.groups["g2"]!.status).toBe("asleep");
    expect(r.state.phase).toBe("day");
    expect(r.state.subState).toBe("resolving");
  });
});

describe("night.feeding — alimentar (GR-12.2, API-10.2, BE-5.7)", () => {
  it("con comida suficiente autoaplica 1 por persona y avanza a missions", () => {
    const game = makeGame(
      [
        makeGroup("g1", [], { status: "asleep", persons: [makePerson(), makePerson()] }),
        makeGroup("g2", ["E"], { persons: [makePerson()] }),
      ],
      { storage: { food: 5, wood: 0, stone: 0 } },
    );
    // g2 (único despierto) duerme temprano -> noche. 3 bocas, 5 comida -> paga 3.
    const r = ok(run(game, { type: "sleepEarly", groupId: gid("g2") }));
    expect(r.state.phase).toBe("night");
    expect(r.state.subState).toBe("missions");
    expect(r.state.storage.food).toBe(2);
    expect(r.state.skulls).toBe(0); // todos alimentados: sin calaveras
  });

  it("comida insuficiente: NO autoaplica; queda en feeding a la espera de designación (API-10.2, BE-8)", () => {
    const game = makeGame(
      [
        makeGroup("g1", [], { status: "asleep", persons: [makePerson(), makePerson()] }),
        makeGroup("g2", ["E"], { persons: [makePerson()] }),
      ],
      { storage: { food: 1, wood: 0, stone: 0 } },
    );
    const r = ok(run(game, { type: "sleepEarly", groupId: gid("g2") }));
    expect(r.state.phase).toBe("night");
    expect(r.state.subState).toBe("feeding"); // pendiente: quién queda sin alimentar
    expect(r.state.storage.food).toBe(1); // sin mutar hasta resolver la designación
    expect(r.state.skulls).toBe(0);
    expect(r.events.map((e) => e.type)).toContain("nightStarted");
  });
});
