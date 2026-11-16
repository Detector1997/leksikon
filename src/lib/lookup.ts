import { loadBank } from "./bank";
import { norm } from "./picker";
import { LEVELS, type Entry, type Level } from "./types";

/** What we found for a word the learner typed. Every field stays editable before saving. */
export interface Found {
  en: string;
  ipa: string;
  pos: string;
  ru: string;
  example: string;
  exampleRu: string;
  /** Other Russian renderings to pick from (online lookups only). */
  variants: string[];
  source: "bank" | "claude" | "online" | "none";
}

const empty = (en: string): Found => ({ en, ipa: "", pos: "", ru: "", example: "", exampleRu: "", variants: [], source: "none" });

const CYR = /[а-яё]/i;

/** The built-in bank across every level: instant and offline. */
export async function lookupBank(word: string): Promise<Found | null> {
  const key = norm(word);
  for (const lvl of LEVELS) {
    const bank = await loadBank(lvl).catch(() => [] as Entry[]);
    const hit = bank.find((e) => norm(e.en) === key);
    if (hit) return { ...hit, variants: [], source: "bank" };
  }
  return null;
}

const POS: Record<string, string> = { noun: "n", verb: "v", adjective: "adj", adverb: "adv", preposition: "prep", conjunction: "conj", pronoun: "pron" };

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const r = await fetch(url, { signal });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

interface DictEntry {
  phonetic?: string;
  phonetics?: { text?: string }[];
  meanings?: { partOfSpeech?: string; definitions?: { example?: string }[] }[];
}

interface MyMemory {
  responseData?: { translatedText?: string };
  matches?: { translation?: string; quality?: string | number }[];
}

/** Russian renderings from MyMemory, best first, Cyrillic only, no duplicates. */
async function translate(text: string, signal?: AbortSignal): Promise<string[]> {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ru`;
  const d = await getJson<MyMemory>(url, signal);
  if (!d) return [];
  const all = [d.responseData?.translatedText ?? "", ...(d.matches ?? []).map((m) => m.translation ?? "")];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of all) {
    const t = raw.replace(/\s+/g, " ").replace(/[.:;]+$/, "").trim();
    const k = t.toLowerCase();
    if (!t || !CYR.test(t) || seen.has(k) || t.length > 60) continue;
    seen.add(k);
    out.push(text.length < 40 ? t.charAt(0).toLowerCase() + t.slice(1) : t);
  }
  return out;
}

/**
 * Free online lookup with no key: IPA, part of speech and a short example from the Free Dictionary API
 * (Wiktionary data), Russian from MyMemory. Translations are machine-picked, so the UI asks to check them.
 */
export async function lookupOnline(word: string, signal?: AbortSignal): Promise<Found> {
  const en = word.trim();
  const out = empty(en);
  const [dict, variants] = await Promise.all([
    en.includes(" ")
      ? Promise.resolve(null)
      : getJson<DictEntry[]>(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(en.toLowerCase())}`, signal),
    translate(en, signal),
  ]);

  const d = Array.isArray(dict) ? dict[0] : null;
  if (d) {
    const ipa = d.phonetic || d.phonetics?.find((p) => p.text)?.text || "";
    out.ipa = ipa.replace(/[/[\]]/g, "").trim();
    out.pos = POS[d.meanings?.[0]?.partOfSpeech ?? ""] ?? "";
    const ex = (d.meanings ?? [])
      .flatMap((m) => m.definitions ?? [])
      .map((x) => x.example?.trim() ?? "")
      .find((x) => x.length >= 12 && x.length <= 90 && x.toLowerCase().includes(en.toLowerCase().slice(0, 4)));
    if (ex) out.example = ex.charAt(0).toUpperCase() + ex.slice(1);
  }
  if (variants.length) {
    out.ru = variants[0];
    out.variants = variants.slice(0, 4);
  }
  if (out.example) out.exampleRu = (await translate(out.example, signal))[0] ?? "";
  if (out.ru || out.ipa) out.source = "online";
  return out;
}

/** Bank first, then Claude when a key is set, then the free online sources. */
export async function lookupWord(word: string, opts: { apiKey: string; level: Level; signal?: AbortSignal }): Promise<Found> {
  const en = word.trim();
  if (!en) return empty(en);
  const bank = await lookupBank(en);
  if (bank) return bank;
  if (opts.apiKey) {
    try {
      const ai = await import("../ai/generateWords");
      const [hit] = await ai.describeWords({ apiKey: opts.apiKey, level: opts.level, words: [en], signal: opts.signal });
      if (hit) return { ...hit, en, variants: [], source: "claude" };
    } catch {
      /* fall through to the free sources */
    }
  }
  return lookupOnline(en, opts.signal);
}

/**
 * Fill many words at once (list or file import). Bank hits are instant; the rest go to Claude
 * in one request when a key is set, otherwise to the free sources a few at a time.
 */
export async function lookupMany(
  words: string[],
  opts: { apiKey: string; level: Level; signal?: AbortSignal; onProgress?: (done: number) => void },
): Promise<Found[]> {
  const result: (Found | null)[] = words.map(() => null);
  let done = 0;
  const tick = () => opts.onProgress?.(++done);

  const rest: number[] = [];
  for (let i = 0; i < words.length; i++) {
    const hit = await lookupBank(words[i]);
    if (hit) {
      result[i] = hit;
      tick();
    } else rest.push(i);
  }

  if (rest.length && opts.apiKey) {
    try {
      const ai = await import("../ai/generateWords");
      for (let s = 0; s < rest.length; s += 40) {
        const chunk = rest.slice(s, s + 40);
        const got = await ai.describeWords({ apiKey: opts.apiKey, level: opts.level, words: chunk.map((i) => words[i]), signal: opts.signal });
        const byWord = new Map(got.map((g) => [norm(g.en), g]));
        for (const i of chunk) {
          const g = byWord.get(norm(words[i]));
          if (g) {
            result[i] = { ...g, en: words[i], variants: [], source: "claude" };
            tick();
          }
        }
      }
    } catch {
      /* whatever Claude did not cover falls back below */
    }
  }

  const left = rest.filter((i) => !result[i]);
  let next = 0;
  const worker = async () => {
    while (next < left.length) {
      const i = left[next++];
      if (opts.signal?.aborted) return;
      result[i] = await lookupOnline(words[i], opts.signal);
      tick();
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return result.map((r, i) => r ?? empty(words[i]));
}

/**
 * Parse a pasted list or a file: one word per line, optionally with a translation after a tab,
 * « - », «—», «;», «=» or «:» (Quizlet export is "term<TAB>definition"). A Russian-first line is flipped.
 */
export function parseList(text: string, limit = 300): { en: string; ru: string }[] {
  const out: { en: string; ru: string }[] = [];
  const seen = new Set<string>();
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.replace(/^\s*(\d+[.)]|[-*•])\s+/, "").trim();
    if (!line) continue;
    const m = line.match(/^(.*?)(?:\t+|\s+[-–—]\s+|\s*[;=]\s*|\s+:\s+)(.+)$/);
    let en = (m ? m[1] : line).trim().replace(/^"|"$/g, "");
    let ru = (m ? m[2] : "").trim().replace(/^"|"$/g, "");
    if (CYR.test(en) && !CYR.test(ru) && ru) [en, ru] = [ru, en];
    if (!en || CYR.test(en) || en.length > 60) continue;
    const k = norm(en);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ en, ru });
    if (out.length >= limit) break;
  }
  return out;
}
