import { describe, expect, it } from "vitest";
import { lanternReachSeed, worldDocumentSchema } from "./index.js";

const harbor = { id: "location.harbor", name: "Harbor", description: "A foggy harbor." };
const route = {
  fromLocationId: "location.tidal-observatory",
  toLocationId: "location.harbor",
  label: "the harbor steps",
};
const base = { ...lanternReachSeed, locations: [...lanternReachSeed.locations, harbor] };
const mover = lanternReachSeed.characters[0]!.id;

describe("SA-2 creator movement grant", () => {
  it("accepts a grant, and old documents without one", () => {
    expect(worldDocumentSchema.safeParse(lanternReachSeed).success).toBe(true);
    expect(
      worldDocumentSchema.safeParse({
        ...base,
        routineRoutes: [{ ...route, permitsRoutineMovement: true }],
        routineMovers: [mover],
      }).success,
    ).toBe(true);
  });

  it.each([
    ["an unknown mover", [{ ...route, permitsRoutineMovement: true }], ["character.nobody"]],
    ["a duplicate mover", [{ ...route, permitsRoutineMovement: true }], [mover, mover]],
    ["movers without an open route", [route], [mover]],
    ["an open route without movers", [{ ...route, permitsRoutineMovement: true }], []],
  ])("rejects %s", (_, routineRoutes, routineMovers) => {
    expect(worldDocumentSchema.safeParse({ ...base, routineRoutes, routineMovers }).success).toBe(
      false,
    );
  });
});
