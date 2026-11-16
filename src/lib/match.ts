export const normalizeAnswer = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9' -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function distance(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

export type Verdict = "right" | "typo" | "wrong";

/** Exact match is right; one slip in a word of six or more letters is a typo that still counts. */
export function checkTyped(input: string, answer: string): Verdict {
  const a = normalizeAnswer(input);
  const b = normalizeAnswer(answer);
  if (!a) return "wrong";
  if (a === b) return "right";
  if (b.length >= 6 && distance(a, b) <= 1) return "typo";
  return "wrong";
}
