import { addDays } from "./dates";
import type { Box, Word, WordSet } from "./types";

/** Days until the next review after landing in a box; box 4 repeats every 16 days. */
export const INTERVAL_DAYS: Record<Box, number> = { 0: 0, 1: 1, 2: 2, 3: 4, 4: 8 };
const LEARNED_REPEAT_DAYS = 16;

export function review(word: Word, correct: boolean, now: number = Date.now()): Word {
  if (!correct) {
    return { ...word, box: 0, dueAt: now, wrong: word.wrong + 1 };
  }
  const wasLearned = word.box === 4;
  const box = Math.min(word.box + 1, 4) as Box;
  const days = wasLearned ? LEARNED_REPEAT_DAYS : INTERVAL_DAYS[box];
  return { ...word, box, dueAt: addDays(now, days), right: word.right + 1 };
}

export function isDue(word: Word, now: number = Date.now()): boolean {
  return word.dueAt <= now;
}

export interface DueRef {
  setId: string;
  wordId: string;
}

/** Due words across all sets, lowest box first, oldest due first. */
export function dueWords(sets: WordSet[], now: number = Date.now()): DueRef[] {
  const all: { ref: DueRef; box: Box; dueAt: number }[] = [];
  for (const s of sets) {
    for (const w of s.words) {
      if (isDue(w, now)) all.push({ ref: { setId: s.id, wordId: w.id }, box: w.box, dueAt: w.dueAt });
    }
  }
  all.sort((a, b) => a.box - b.box || a.dueAt - b.dueAt);
  return all.map((x) => x.ref);
}

export function boxCounts(words: Word[]): [number, number, number, number, number] {
  const c: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (const w of words) c[w.box]++;
  return c;
}
