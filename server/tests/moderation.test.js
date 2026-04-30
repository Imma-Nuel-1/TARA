import { describe, expect, it } from "vitest";
import { canTransitionStatus } from "../src/services/moderation.js";

describe("moderation transitions", () => {
  it("allows pending to published", () => {
    expect(canTransitionStatus("pending", "published")).toBe(true);
  });

  it("blocks published to pending", () => {
    expect(canTransitionStatus("published", "pending")).toBe(false);
  });
});
