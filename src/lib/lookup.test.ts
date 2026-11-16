import { describe, expect, it } from "vitest";
import { parseList } from "./lookup";

describe("parseList", () => {
  it("takes one word per line and skips blanks and duplicates", () => {
    expect(parseList("commute\n\n  sustainable \nCommute\n")).toEqual([
      { en: "commute", ru: "" },
      { en: "sustainable", ru: "" },
    ]);
  });

  it("reads a translation after common separators", () => {
    const text = [
      "give up - сдаваться",
      "reluctant — неохотный",
      "commute\tпоездка на работу",
      "bargain; выгодная покупка",
      "deadline = крайний срок",
      "set off : отправиться",
    ].join("\n");
    expect(parseList(text)).toEqual([
      { en: "give up", ru: "сдаваться" },
      { en: "reluctant", ru: "неохотный" },
      { en: "commute", ru: "поездка на работу" },
      { en: "bargain", ru: "выгодная покупка" },
      { en: "deadline", ru: "крайний срок" },
      { en: "set off", ru: "отправиться" },
    ]);
  });

  it("keeps hyphenated words whole and flips Russian-first lines", () => {
    expect(parseList("well-being\nскидка - discount")).toEqual([
      { en: "well-being", ru: "" },
      { en: "discount", ru: "скидка" },
    ]);
  });

  it("drops list numbering and lines that are only Russian", () => {
    expect(parseList("1. hassle\n2) handy\n- awkward\nпросто заметка")).toEqual([
      { en: "hassle", ru: "" },
      { en: "handy", ru: "" },
      { en: "awkward", ru: "" },
    ]);
  });
});
