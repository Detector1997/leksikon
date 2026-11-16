import { get, set } from "idb-keyval";
import { useSyncExternalStore } from "react";
import { review } from "./srs";
import { logAnswer, logNewWords } from "./streak";
import { norm } from "./picker";
import type { AppState, Entry, Level, Settings, WordSet } from "./types";
import { LEVELS } from "./types";

const KEY = "leksikon-state-v1";

export const DEFAULT_SETTINGS: Settings = {
  level: "B2",
  dailyGoal: 20,
  apiKey: "",
  theme: "auto",
  autoSpeak: false,
};

export function emptyState(): AppState {
  return { version: 1, sets: [], known: [], days: {}, settings: { ...DEFAULT_SETTINGS } };
}

let state: AppState = emptyState();
let loaded = false;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

function emit() {
  for (const l of listeners) l();
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    set(KEY, state).catch((err) => console.error("Не удалось сохранить данные", err));
  }, 150);
}

function commit(next: AppState) {
  state = next;
  emit();
  persist();
}

export async function loadState(): Promise<void> {
  try {
    const saved = await get<AppState>(KEY);
    if (saved && saved.version === 1) {
      state = { ...emptyState(), ...saved, settings: { ...DEFAULT_SETTINGS, ...saved.settings } };
    }
  } catch (err) {
    console.error("Не удалось прочитать данные", err);
  }
  loaded = true;
  emit();
  // Ask Safari not to evict the learner's data under storage pressure.
  navigator.storage?.persist?.().catch(() => undefined);
}

/** Flush a pending save immediately (used when the app goes to background). */
export function flush(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = undefined;
    set(KEY, state).catch(() => undefined);
  }
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, () => state);
}

export function useLoaded(): boolean {
  return useSyncExternalStore(subscribe, () => loaded);
}

export function getState(): AppState {
  return state;
}

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export function createSet(input: {
  title: string;
  level: Level;
  source: WordSet["source"];
  entries: Entry[];
}): WordSet {
  const now = Date.now();
  const ws: WordSet = {
    id: uid(),
    title: input.title,
    level: input.level,
    createdAt: now,
    source: input.source,
    words: input.entries.map((e) => ({ ...e, id: uid(), box: 0, dueAt: now, addedAt: now, right: 0, wrong: 0 })),
  };
  commit({ ...state, sets: [ws, ...state.sets], days: logNewWords(state.days, ws.words.length, now) });
  return ws;
}

/**
 * Records an answer. Practising a word that is not due yet counts toward the day,
 * but a correct answer does not promote it early; a wrong one still sends it back to box 0.
 */
export const OWN_SET_TITLE = "Мои слова";

/**
 * Add the learner's own words to a set (an existing one, or a new «Мои слова» set).
 * Words already in that set are skipped. Returns the set id and how many were added.
 */
export function addOwnWords(target: string | null, level: Level, entries: Entry[]): { setId: string; added: number } {
  const now = Date.now();
  let set = target ? state.sets.find((s) => s.id === target) : undefined;
  const isNew = !set;
  if (!set) set = { id: uid(), title: OWN_SET_TITLE, level, createdAt: now, source: "own", words: [] };
  const have = new Set(set.words.map((w) => norm(w.en)));
  const fresh = entries
    .filter((e) => {
      const k = norm(e.en);
      if (!k || have.has(k)) return false;
      have.add(k);
      return true;
    })
    .map((e) => ({ ...e, id: uid(), box: 0 as const, dueAt: now, addedAt: now, right: 0, wrong: 0 }));
  const updated = { ...set, words: [...set.words, ...fresh] };
  const sets = isNew ? [updated, ...state.sets] : state.sets.map((s) => (s.id === updated.id ? updated : s));
  commit({ ...state, sets, days: fresh.length ? logNewWords(state.days, fresh.length, now) : state.days });
  return { setId: updated.id, added: fresh.length };
}

export function recordAnswer(setId: string, wordId: string, correct: boolean): void {
  const now = Date.now();
  const sets = state.sets.map((s) =>
    s.id !== setId
      ? s
      : {
          ...s,
          words: s.words.map((w) => {
            if (w.id !== wordId) return w;
            if (correct && w.dueAt > now) return { ...w, right: w.right + 1 };
            return review(w, correct, now);
          }),
        },
  );
  commit({ ...state, sets, days: logAnswer(state.days, correct, now) });
}

export function deleteSet(id: string): void {
  commit({ ...state, sets: state.sets.filter((s) => s.id !== id) });
}

export function renameSet(id: string, title: string): void {
  commit({ ...state, sets: state.sets.map((s) => (s.id === id ? { ...s, title } : s)) });
}

export function removeWord(setId: string, wordId: string): void {
  commit({
    ...state,
    sets: state.sets.map((s) => (s.id === setId ? { ...s, words: s.words.filter((w) => w.id !== wordId) } : s)),
  });
}

export function markKnown(words: string[]): void {
  const known = new Set(state.known);
  for (const w of words) known.add(norm(w));
  commit({ ...state, known: [...known] });
}

export function clearKnown(): void {
  commit({ ...state, known: [] });
}

export function updateSettings(patch: Partial<Settings>): void {
  commit({ ...state, settings: { ...state.settings, ...patch } });
}

/** Every English word already in a set or marked known, for de-duplication. */
export function usedWords(s: AppState = state): Set<string> {
  const used = new Set(s.known);
  for (const ws of s.sets) for (const w of ws.words) used.add(norm(w.en));
  return used;
}

export function exportJson(): string {
  // The API key stays on this device; it is never written into a backup file.
  const { apiKey: _omit, ...settings } = state.settings;
  void _omit;
  return JSON.stringify({ ...state, settings }, null, 2);
}

export class ImportError extends Error {}

export function importJson(text: string): void {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ImportError("Файл не похож на резервную копию: это не JSON.");
  }
  const d = data as Partial<AppState>;
  if (!d || d.version !== 1 || !Array.isArray(d.sets) || typeof d.days !== "object") {
    throw new ImportError("В файле нет наборов Лексикона или он от другой версии.");
  }
  for (const s of d.sets) {
    if (!s || typeof s.id !== "string" || !Array.isArray(s.words) || !LEVELS.includes(s.level)) {
      throw new ImportError("Один из наборов в файле повреждён.");
    }
  }
  commit({
    version: 1,
    sets: d.sets,
    known: Array.isArray(d.known) ? d.known : [],
    days: d.days ?? {},
    settings: { ...DEFAULT_SETTINGS, ...d.settings, apiKey: state.settings.apiKey },
  });
}

export function resetAll(): void {
  commit(emptyState());
}
