import { describe, expect, it } from "vitest";
import { randomId } from "./random-id";

describe("randomId", () => {
  it("matches the /api/img id pattern so uploads are servable", () => {
    for (let i = 0; i < 200; i++) expect(randomId()).toMatch(/^[A-Za-z0-9]{20}$/);
  });
});
