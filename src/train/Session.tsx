import { X } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { plural } from "../screens/Today";
import { loadBank } from "../lib/bank";
import { dayKey } from "../lib/dates";
import { shuffle } from "../lib/picker";
import { dueWords } from "../lib/srs";
import { getState, recordAnswer, useAppState } from "../lib/storage";
import type { Entry, TrainMode, Word } from "../lib/types";
import { goBack, navigate } from "../router";
import { Flashcard } from "./Flashcard";
import { Quiz } from "./Quiz";
import { Typing } from "./Typing";

type Step = "cards" | "quiz" | "typing";

interface Item {
  setId: string;
  word: Word;
  step: Step;
  direction: "en-ru" | "ru-en";
}

interface Result {
  en: string;
  ru: string;
  correct: boolean;
}

const MAX = 20;
let retry: { setId: string; wordId: string }[] | null = null;

function stepFor(mode: TrainMode, w: Word, poolSize: number): Step {
  if (mode !== "mixed") return mode === "quiz" && poolSize < 4 ? "cards" : mode;
  if (w.box === 0) return "cards";
  if (w.box <= 2) return poolSize >= 4 ? "quiz" : "cards";
  return "typing";
}

function buildQueue(scope: string, mode: TrainMode): Item[] {
  const s = getState();
  const find = (setId: string, wordId: string) => s.sets.find((x) => x.id === setId)?.words.find((w) => w.id === wordId);
  let refs: { setId: string; wordId: string }[];

  if (retry) {
    refs = retry;
    retry = null;
  } else if (scope === "due") {
    refs = dueWords(s.sets).slice(0, MAX);
  } else {
    const set = s.sets.find((x) => x.id === scope);
    if (!set) return [];
    const now = Date.now();
    const due = shuffle(set.words.filter((w) => w.dueAt <= now));
    const rest = shuffle(set.words.filter((w) => w.dueAt > now));
    // A mixed run on a set repeats what's due; a chosen mode drills the whole set.
    const words = mode === "mixed" && due.length > 0 ? due : [...due, ...rest];
    refs = words.slice(0, Math.max(MAX, 30)).map((w) => ({ setId: set.id, wordId: w.id }));
  }

  const poolSize = s.sets.reduce((n, x) => n + x.words.length, 0);
  return refs
    .map((r) => ({ r, w: find(r.setId, r.wordId) }))
    .filter((x): x is { r: { setId: string; wordId: string }; w: Word } => !!x.w)
    .map(({ r, w }) => ({
      setId: r.setId,
      word: w,
      step: stepFor(mode, w, poolSize + 40),
      direction: Math.random() < 0.5 ? "en-ru" : "ru-en",
    }));
}

export function Session({ scope, mode }: { scope: string; mode: TrainMode }) {
  const [run, setRun] = useState({ n: 0, mode });
  return (
    <SessionRun
      key={run.n}
      scope={scope}
      mode={run.mode}
      onRetry={(refs) => {
        retry = refs;
        setRun((r) => ({ n: r.n + 1, mode: "cards" }));
      }}
    />
  );
}

type Retry = (refs: { setId: string; wordId: string }[]) => void;

function SessionRun({ scope, mode, onRetry }: { scope: string; mode: TrainMode; onRetry: Retry }) {
  const s = useAppState();
  const reduce = useReducedMotion();
  const [items] = useState(() => buildQueue(scope, mode));
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [pool, setPool] = useState<Entry[] | null>(null);

  // Distractors for the quiz: everything in the learner's sets plus the bank of each level in play.
  useEffect(() => {
    const own = getState().sets.flatMap((x) => x.words);
    const levels = [...new Set(items.map((i) => i.word.level))];
    Promise.all(levels.map((l) => loadBank(l).catch(() => [] as Entry[]))).then((banks) =>
      setPool([...own, ...banks.flat()]),
    );
  }, [items]);

  const item = items[index];
  const done = index >= items.length;

  const onResult = useCallback(
    (correct: boolean) => {
      if (!item) return;
      recordAnswer(item.setId, item.word.id, correct);
      setResults((r) => [...r, { en: item.word.en, ru: item.word.ru, correct }]);
    },
    [item],
  );
  const onNext = useCallback(() => setIndex((i) => i + 1), []);

  const close = () => goBack(scope === "due" ? "/" : `/set/${scope}`);

  if (items.length === 0) {
    return (
      <div className="train">
        <div className="train__top">
          <button className="icon-btn" onClick={close} aria-label="Закрыть">
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>
        <div className="state">
          <h2>Нечего повторять</h2>
          <p>Все слова повторены вовремя. Можно подобрать новые.</p>
          <button className="btn btn--primary" onClick={() => navigate("/new", { replace: true })}>
            Подобрать слова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="train">
      <div className="train__top">
        <button className="icon-btn" onClick={close} aria-label="Закончить тренировку">
          <X size={24} strokeWidth={1.5} />
        </button>
        <div
          className="train__progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={items.length}
          aria-valuenow={Math.min(index, items.length)}
          aria-label="Пройдено"
        >
          <i style={{ transform: `scaleX(${Math.min(index, items.length) / items.length})` }} />
        </div>
        <span className="train__count num">
          {Math.min(index + 1, items.length)} / {items.length}
        </span>
      </div>

      <div className="train__stage">
        {done ? (
          <Done results={results} scope={scope} items={items} onRetry={onRetry} />
        ) : (
          <motion.div
            key={`${item.word.id}-${index}`}
            initial={reduce ? false : { x: 36 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            {item.step === "cards" && (
              <Flashcard
                entry={item.word}
                autoSpeak={s.settings.autoSpeak}
                onDecide={(known) => {
                  onResult(known);
                  onNext();
                }}
              />
            )}
            {item.step === "quiz" && !pool && <div className="skeleton-entry" aria-busy="true" />}
            {item.step === "quiz" && pool && (
              <Quiz
                entry={item.word}
                pool={pool}
                direction={item.direction}
                autoSpeak={s.settings.autoSpeak}
                onResult={onResult}
                onNext={onNext}
              />
            )}
            {item.step === "typing" && <Typing entry={item.word} onResult={onResult} onNext={onNext} />}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function Done({ results, scope, items, onRetry }: { results: Result[]; scope: string; items: Item[]; onRetry: Retry }) {
  const s = useAppState();
  const right = results.filter((r) => r.correct).length;
  const wrong = results.filter((r) => !r.correct);
  const goal = s.settings.dailyGoal;
  const todayCorrect = s.days[dayKey()]?.correct ?? 0;
  const goalMet = todayCorrect >= goal;

  const wrongRefs = useMemo(() => {
    const names = new Set(wrong.map((w) => w.en));
    return items.filter((i) => names.has(i.word.en)).map((i) => ({ setId: i.setId, wordId: i.word.id }));
  }, [items, wrong]);

  return (
    <div className="done">
      <div className="done__num num">
        {right}
        <span className="done__of"> / {results.length}</span>
      </div>
      <p className="lede">
        {plural(right, "верный ответ", "верных ответа", "верных ответов")}. Подход окончен.{" "}
        {goalMet
          ? `Цель дня выполнена: ${todayCorrect} ${plural(todayCorrect, "верный ответ", "верных ответа", "верных ответов")}.`
          : `До цели дня осталось ${goal - todayCorrect} ${plural(goal - todayCorrect, "верный ответ", "верных ответа", "верных ответов")}.`}
      </p>

      {wrong.length > 0 && (
        <ul className="done__list" aria-label="Ошибки">
          {wrong.map((w, i) => (
            <li key={`${w.en}-${i}`}>
              <b lang="en" style={{ fontFamily: "var(--display)" }}>{w.en}</b>
              <span style={{ color: "var(--ink-2)", textAlign: "right" }}>{w.ru}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="done__actions">
        {wrongRefs.length > 0 && (
          <button
            className="btn btn--primary btn--block"
            onClick={() => onRetry(wrongRefs)}
          >
            Повторить ошибки
            <span className="btn__count num">{wrongRefs.length}</span>
          </button>
        )}
        <button className="btn btn--block" onClick={() => goBack(scope === "due" ? "/" : `/set/${scope}`)}>
          Готово
        </button>
      </div>
    </div>
  );
}
