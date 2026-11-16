import { dayKey, previousKey } from "./dates";
import type { DayLog } from "./types";

export function isComplete(log: DayLog | undefined, goal: number): boolean {
  return !!log && log.correct >= goal;
}

/**
 * Consecutive completed days ending today; if today is not complete yet,
 * the streak still stands as long as yesterday was.
 */
export function currentStreak(days: Record<string, DayLog>, goal: number, today: string = dayKey()): number {
  let key = isComplete(days[today], goal) ? today : previousKey(today);
  let n = 0;
  while (isComplete(days[key], goal)) {
    n++;
    key = previousKey(key);
  }
  return n;
}

export function bestStreak(days: Record<string, DayLog>, goal: number): number {
  const keys = Object.keys(days).filter((k) => isComplete(days[k], goal)).sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of keys) {
    run = prev !== null && previousKey(k) === prev ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}

export function logAnswer(
  days: Record<string, DayLog>,
  correct: boolean,
  now: number = Date.now(),
): Record<string, DayLog> {
  const k = dayKey(now);
  const d = days[k] ?? { answers: 0, correct: 0, newWords: 0 };
  return { ...days, [k]: { ...d, answers: d.answers + 1, correct: d.correct + (correct ? 1 : 0) } };
}

export function logNewWords(days: Record<string, DayLog>, n: number, now: number = Date.now()): Record<string, DayLog> {
  const k = dayKey(now);
  const d = days[k] ?? { answers: 0, correct: 0, newWords: 0 };
  return { ...days, [k]: { ...d, newWords: d.newWords + n } };
}
