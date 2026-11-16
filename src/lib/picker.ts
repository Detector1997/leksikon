import type { Entry, Topic } from "./types";

export type Rng = () => number;

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const norm = (en: string) => en.trim().toLowerCase();

export interface PickResult {
  entries: Entry[];
  /** How many came from outside the requested topic because the topic ran short. */
  filled: number;
  /** True when the level has fewer unused words than requested. */
  exhausted: boolean;
}

/**
 * Random `count` entries from the bank, never repeating anything in `exclude`
 * (words already in sets, words marked «уже знаю», words already shown).
 * With a topic, tops up from the rest of the level when the topic runs short.
 */
export function pickEntries(
  bank: Entry[],
  opts: { count: number; topic: Topic | null; exclude: Set<string>; rng?: Rng },
): PickResult {
  const { count, topic, exclude, rng = Math.random } = opts;
  const fresh = bank.filter((e) => !exclude.has(norm(e.en)));
  const primary = topic ? fresh.filter((e) => e.topic === topic) : fresh;
  let entries = shuffle(primary, rng).slice(0, count);
  let filled = 0;
  if (topic && entries.length < count) {
    const rest = shuffle(fresh.filter((e) => e.topic !== topic), rng).slice(0, count - entries.length);
    filled = rest.length;
    entries = entries.concat(rest);
  }
  return { entries, filled, exhausted: entries.length < count };
}
