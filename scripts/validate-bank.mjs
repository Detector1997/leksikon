// Checks the bundled word bank: shape, empty fields, known topics, duplicates within and across levels.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LEVELS = ["a2", "b1", "b2", "c1"];
const TOPICS = new Set(["travel", "work", "food", "emotions", "tech", "health", "home", "nature", "money", "social", "general"]);
const POS = new Set(["n", "v", "adj", "adv", "phr", "prep", "conj", "pron", "idiom", "phr v"]);

const errors = [];
const seen = new Map();
const counts = {};

for (const lvl of LEVELS) {
  const file = join(root, "public", "data", `words-${lvl}.json`);
  let rows;
  try {
    rows = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    errors.push(`${lvl}: cannot read or parse (${e.message})`);
    continue;
  }
  counts[lvl] = { total: rows.length };
  rows.forEach((row, i) => {
    const at = `${lvl}[${i}] ${Array.isArray(row) ? row[0] : "?"}`;
    if (!Array.isArray(row) || row.length !== 7) return errors.push(`${at}: expected 7 fields`);
    const [en, ipa, pos, ru, ex, exRu, topic] = row;
    for (const [name, v] of Object.entries({ en, ipa, pos, ru, ex, exRu, topic })) {
      if (typeof v !== "string" || !v.trim()) errors.push(`${at}: empty ${name}`);
    }
    if (!TOPICS.has(topic)) errors.push(`${at}: unknown topic "${topic}"`);
    if (!POS.has(pos)) errors.push(`${at}: unknown part of speech "${pos}"`);
    if (/[\/\[\]]/.test(ipa)) errors.push(`${at}: IPA must be bare, without slashes or brackets`);
    if (/[а-яё]/i.test(en + ex)) errors.push(`${at}: Cyrillic in the English fields`);
    if (!/[а-яё]/i.test(ru + exRu)) errors.push(`${at}: translation has no Cyrillic`);
    const key = en.trim().toLowerCase();
    if (seen.has(key)) errors.push(`${at}: duplicate of ${seen.get(key)}`);
    else seen.set(key, at);
    counts[lvl][topic] = (counts[lvl][topic] ?? 0) + 1;
  });
}

for (const [lvl, c] of Object.entries(counts)) {
  const { total, ...byTopic } = c;
  console.log(`${lvl.toUpperCase()}: ${total} words  ${Object.entries(byTopic).map(([t, n]) => `${t} ${n}`).join(", ")}`);
}
if (errors.length) {
  console.error(`\n${errors.length} problem(s):\n` + errors.slice(0, 60).join("\n"));
  process.exit(1);
}
console.log(`Word bank OK: ${seen.size} unique words.`);
