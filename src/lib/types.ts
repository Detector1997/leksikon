export const LEVELS = ["A2", "B1", "B2", "C1"] as const;
export type Level = (typeof LEVELS)[number];

export const TOPICS = {
  travel: "Путешествия",
  work: "Работа",
  food: "Еда",
  emotions: "Эмоции",
  tech: "Технологии",
  health: "Здоровье",
  home: "Дом",
  nature: "Природа",
  money: "Деньги",
  social: "Общение",
  general: "Общее",
} as const;
export type Topic = keyof typeof TOPICS;
export const TOPIC_KEYS = Object.keys(TOPICS) as Topic[];

/** One row of the bundled word bank: [en, ipa, pos, ru, example, exampleRu, topic]. */
export type BankRow = [string, string, string, string, string, string, Topic];

export interface Entry {
  en: string;
  ipa: string;
  pos: string;
  ru: string;
  example: string;
  exampleRu: string;
  topic: Topic | string;
  level: Level;
}

/** Leitner box: 0 = new … 4 = learned. */
export type Box = 0 | 1 | 2 | 3 | 4;

export interface Word extends Entry {
  id: string;
  box: Box;
  dueAt: number;
  addedAt: number;
  right: number;
  wrong: number;
}

export interface WordSet {
  id: string;
  title: string;
  level: Level;
  createdAt: number;
  source: "bank" | "claude" | "own";
  words: Word[];
}

export interface DayLog {
  answers: number;
  correct: number;
  newWords: number;
}

export type ThemePref = "auto" | "light" | "dark";

export interface Settings {
  level: Level;
  dailyGoal: number;
  apiKey: string;
  theme: ThemePref;
  autoSpeak: boolean;
}

export interface AppState {
  version: 1;
  sets: WordSet[];
  /** Lower-cased English words the learner marked «уже знаю»; never suggested again. */
  known: string[];
  days: Record<string, DayLog>;
  settings: Settings;
}

export type TrainMode = "cards" | "quiz" | "typing" | "mixed";

export const BOX_LABELS: Record<Box, string> = {
  0: "новые",
  1: "I",
  2: "II",
  3: "III",
  4: "выучено",
};
