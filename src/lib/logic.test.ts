import { describe, expect, it } from "vitest";
import { addDays, dayKey, weekKeys } from "./dates";
import { boxCounts, dueWords, review } from "./srs";
import { bestStreak, currentStreak, logAnswer } from "./streak";
import { pickEntries } from "./picker";
import type { DayLog, Entry, Word, WordSet } from "./types";

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

const word = (over: Partial<Word> = {}): Word => ({
  id: "w1", en: "reluctant", ipa: "rɪˈlʌktənt", pos: "adj", ru: "неохотный",
  example: "", exampleRu: "", topic: "general", level: "B2",
  box: 0, dueAt: 0, addedAt: 0, right: 0, wrong: 0, ...over,
});

describe("Leitner review", () => {
  const now = at(2026, 11, 16, 9);

  it("moves a correct word up one box and schedules it", () => {
    const w = review(word({ box: 0 }), true, now);
    expect(w.box).toBe(1);
    expect(w.dueAt).toBe(addDays(now, 1));
    expect(w.right).toBe(1);
  });

  it("uses the 1/2/4/8-day ladder", () => {
    let w = word();
    const due: number[] = [];
    for (let i = 0; i < 4; i++) {
      w = review(w, true, now);
      due.push((w.dueAt - new Date(2026, 10, 16).getTime()) / 86_400_000);
    }
    expect(due).toEqual([1, 2, 4, 8]);
    expect(w.box).toBe(4);
  });

  it("keeps a learned word in box 4 and repeats it after 16 days", () => {
    const w = review(word({ box: 4 }), true, now);
    expect(w.box).toBe(4);
    expect(w.dueAt).toBe(addDays(now, 16));
  });

  it("drops a wrong answer back to box 0, due immediately", () => {
    const w = review(word({ box: 3 }), false, now);
    expect(w.box).toBe(0);
    expect(w.dueAt).toBe(now);
    expect(w.wrong).toBe(1);
  });

  it("collects due words across sets, lowest box first", () => {
    const sets: WordSet[] = [
      { id: "a", title: "A", level: "B2", createdAt: 0, source: "bank", words: [
        word({ id: "1", box: 2, dueAt: now - 10 }),
        word({ id: "2", box: 1, dueAt: now + 10 }),
      ] },
      { id: "b", title: "B", level: "B2", createdAt: 0, source: "bank", words: [word({ id: "3", box: 0, dueAt: now - 5 })] },
    ];
    expect(dueWords(sets, now).map((r) => r.wordId)).toEqual(["3", "1"]);
    expect(boxCounts(sets[0].words)).toEqual([0, 1, 1, 0, 0]);
  });
});

describe("streak", () => {
  const done: DayLog = { answers: 20, correct: 20, newWords: 0 };
  const half: DayLog = { answers: 10, correct: 10, newWords: 0 };

  it("counts consecutive completed days ending today", () => {
    const days = { "2026-11-14": done, "2026-11-15": done, "2026-11-16": done };
    expect(currentStreak(days, 20, "2026-11-16")).toBe(3);
  });

  it("keeps yesterday's streak while today is still in progress", () => {
    const days = { "2026-11-14": done, "2026-11-15": done, "2026-11-16": half };
    expect(currentStreak(days, 20, "2026-11-16")).toBe(2);
  });

  it("breaks on a skipped day", () => {
    const days = { "2026-11-13": done, "2026-11-15": done };
    expect(currentStreak(days, 20, "2026-11-16")).toBe(1);
    expect(currentStreak({ "2026-11-13": done }, 20, "2026-11-16")).toBe(0);
  });

  it("crosses month and year boundaries", () => {
    const days = { "2025-12-31": done, "2026-01-01": done };
    expect(currentStreak(days, 20, "2026-01-01")).toBe(2);
    expect(bestStreak({ ...days, "2026-01-05": done }, 20)).toBe(2);
  });

  it("logs answers into the local calendar day, even just before midnight", () => {
    const late = at(2026, 11, 16, 23) + 59 * 60_000;
    const early = at(2026, 11, 17, 0) + 60_000;
    let days = logAnswer({}, true, late);
    days = logAnswer(days, false, early);
    expect(days[dayKey(late)]).toEqual({ answers: 1, correct: 1, newWords: 0 });
    expect(days[dayKey(early)]).toEqual({ answers: 1, correct: 0, newWords: 0 });
  });

  it("builds a Monday-first week", () => {
    const keys = weekKeys(at(2026, 11, 16));
    expect(keys[0]).toBe("2026-11-16");
    expect(keys[6]).toBe("2026-11-22");
  });
});

describe("picker", () => {
  const bank: Entry[] = Array.from({ length: 30 }, (_, i) => ({
    en: `word${i}`, ipa: "", pos: "n", ru: "", example: "", exampleRu: "",
    topic: i < 8 ? "work" : "travel", level: "B2" as const,
  }));
  let seed = 1;
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  it("never repeats excluded words and has no duplicates", () => {
    const exclude = new Set(["word0", "word9", "word10"]);
    const r = pickEntries(bank, { count: 20, topic: null, exclude, rng });
    const names = r.entries.map((e) => e.en);
    expect(names).toHaveLength(20);
    expect(new Set(names).size).toBe(20);
    expect(names.some((n) => exclude.has(n))).toBe(false);
  });

  it("tops up a short topic from the rest of the level", () => {
    const r = pickEntries(bank, { count: 20, topic: "work", exclude: new Set(), rng });
    expect(r.entries.filter((e) => e.topic === "work")).toHaveLength(8);
    expect(r.filled).toBe(12);
    expect(r.exhausted).toBe(false);
  });

  it("reports exhaustion when the level runs out", () => {
    const exclude = new Set(bank.slice(0, 25).map((e) => e.en));
    const r = pickEntries(bank, { count: 20, topic: null, exclude, rng });
    expect(r.entries).toHaveLength(5);
    expect(r.exhausted).toBe(true);
  });
});
