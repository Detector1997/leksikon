import { describe, expect, it } from "vitest";
import { checkTyped, distance } from "./match";

describe("typed answers", () => {
  it("accepts exact answers regardless of case, spacing and punctuation", () => {
    expect(checkTyped("  Reluctant ", "reluctant")).toBe("right");
    expect(checkTyped("set  off!", "set off")).toBe("right");
    expect(checkTyped("don’t", "don't")).toBe("right");
  });

  it("forgives one slip in longer words", () => {
    expect(checkTyped("reluctent", "reluctant")).toBe("typo");
    expect(checkTyped("bottlenek", "bottleneck")).toBe("typo");
  });

  it("does not forgive slips in short words", () => {
    expect(checkTyped("cot", "cut")).toBe("wrong");
  });

  it("rejects empty and different answers", () => {
    expect(checkTyped("", "word")).toBe("wrong");
    expect(checkTyped("eager", "reluctant")).toBe("wrong");
  });

  it("computes edit distance", () => {
    expect(distance("kitten", "sitting")).toBe(3);
    expect(distance("", "abc")).toBe(3);
  });
});
