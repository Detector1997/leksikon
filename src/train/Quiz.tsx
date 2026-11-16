import { useEffect, useMemo, useRef, useState } from "react";
import { speak } from "../lib/speech";
import { shuffle } from "../lib/picker";
import type { Entry } from "../lib/types";

interface Props {
  entry: Entry;
  pool: Entry[];
  direction: "en-ru" | "ru-en";
  autoSpeak: boolean;
  onResult: (correct: boolean) => void;
  onNext: () => void;
}

const KEYS = ["а", "б", "в", "г"];

/** Stems of the meaningful words, so «бродить» never sits beside «бродить, странствовать». */
function stems(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .split(/[^a-zа-яё]+/i)
      .filter((w) => w.length >= 4)
      .map((w) => w.slice(0, 5)),
  );
}

function overlaps(a: string, b: string): boolean {
  const sa = stems(a);
  for (const x of stems(b)) if (sa.has(x)) return true;
  return false;
}

export function Quiz({ entry, pool, direction, autoSpeak, onResult, onNext }: Props) {
  const [picked, setPicked] = useState<number | null>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const answerOf = (e: Entry) => (direction === "en-ru" ? e.ru : e.en);

  const options = useMemo(() => {
    const right = answerOf(entry);
    const seen = new Set([right.toLowerCase()]);
    const others: string[] = [];
    // Prefer distractors of the same part of speech, then anything.
    const byPos = shuffle(pool.filter((p) => p.pos === entry.pos && p.en !== entry.en));
    const rest = shuffle(pool.filter((p) => p.pos !== entry.pos && p.en !== entry.en));
    for (const p of [...byPos, ...rest]) {
      const a = answerOf(p);
      if (seen.has(a.toLowerCase()) || overlaps(a, right) || overlaps(p.en, entry.en)) continue;
      seen.add(a.toLowerCase());
      others.push(a);
      if (others.length === 3) break;
    }
    return shuffle([right, ...others]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.en, direction]);

  const rightIndex = options.indexOf(answerOf(entry));

  useEffect(() => {
    if (autoSpeak && direction === "en-ru") speak(entry.en, { fromTap: false });
  }, [entry.en, direction, autoSpeak]);

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === rightIndex;
    onResult(ok);
    if (direction === "ru-en") speak(entry.en);
    if (ok) setTimeout(onNext, 750);
    else setTimeout(() => nextBtn.current?.focus(), 50);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= options.length) choose(n - 1);
      else if (e.key === "Enter" && picked !== null && picked !== rightIndex) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <div className="prompt">
        <p className="prompt__label">{direction === "en-ru" ? "Как это по-русски?" : "Как это по-английски?"}</p>
        <div className="prompt__word" lang={direction === "en-ru" ? "en" : "ru"}>
          {direction === "en-ru" ? entry.en : entry.ru}
        </div>
        {direction === "en-ru" && <p className="prompt__sub" lang="en-fonipa">[{entry.ipa}]</p>}
      </div>
      <ul className="options">
        {options.map((o, i) => {
          const state = picked === null ? undefined : i === rightIndex ? "right" : i === picked ? "wrong" : undefined;
          return (
            <li key={o}>
              <button
                className="option"
                data-state={state}
                disabled={picked !== null}
                onClick={() => choose(i)}
                lang={direction === "en-ru" ? "ru" : "en"}
              >
                <span className="option__key" aria-hidden="true">
                  {KEYS[i]})
                </span>
                {o}
              </button>
            </li>
          );
        })}
      </ul>
      {picked !== null && picked !== rightIndex && (
        <div className="verdict verdict--wrong" role="status">
          <p>
            <b lang="en">{entry.en}</b> — {entry.ru}
          </p>
          <p className="card__ex" lang="en">{entry.example}</p>
          <p className="card__exru">{entry.exampleRu}</p>
          <button ref={nextBtn} className="btn btn--block" style={{ marginTop: 14 }} onClick={onNext}>
            Дальше
          </button>
        </div>
      )}
    </>
  );
}
