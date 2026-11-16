import type { BankRow, Entry, Level } from "./types";

const cache = new Map<Level, Promise<Entry[]>>();

export function rowToEntry(row: BankRow, level: Level): Entry {
  const [en, ipa, pos, ru, example, exampleRu, topic] = row;
  return { en, ipa, pos, ru, example, exampleRu, topic, level };
}

export function loadBank(level: Level): Promise<Entry[]> {
  let p = cache.get(level);
  if (!p) {
    p = fetch(`./data/words-${level.toLowerCase()}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<BankRow[]>;
      })
      .then((rows) => rows.map((r) => rowToEntry(r, level)));
    p.catch(() => cache.delete(level));
    cache.set(level, p);
  }
  return p;
}
