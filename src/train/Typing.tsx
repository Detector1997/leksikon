import { useEffect, useRef, useState } from "react";
import { checkTyped, type Verdict } from "../lib/match";
import { speak } from "../lib/speech";
import type { Entry } from "../lib/types";

interface Props {
  entry: Entry;
  onResult: (correct: boolean) => void;
  onNext: () => void;
}

function blankOut(example: string, headword: string) {
  const i = example.toLowerCase().indexOf(headword.toLowerCase());
  if (i < 0) return null;
  return `${example.slice(0, i)}${"_".repeat(Math.max(4, Math.min(headword.length, 12)))}${example.slice(i + headword.length)}`;
}

export function Typing({ entry, onResult, onNext }: Props) {
  const [value, setValue] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [hints, setHints] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const clue = blankOut(entry.example, entry.en);

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, []);

  const submit = () => {
    if (verdict) return onNext();
    if (!value.trim()) return;
    const v = checkTyped(value, entry.en);
    setVerdict(v);
    onResult(v !== "wrong");
    speak(entry.en);
    setTimeout(() => next.current?.focus(), 30);
  };

  const hint = () => {
    const n = Math.min(hints + 1, entry.en.length - 1);
    setHints(n);
    setValue(entry.en.slice(0, n));
    input.current?.focus();
  };

  return (
    <>
      <div className="prompt">
        <p className="prompt__label">Напиши по-английски</p>
        <div className="prompt__word">{entry.ru}</div>
        {clue && (
          <p className="prompt__sub" lang="en">
            {clue}
          </p>
        )}
      </div>
      <form
        className="typing"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="typed" className="visually-hidden">
          Ответ по-английски
        </label>
        <input
          ref={input}
          id="typed"
          className="typing__input"
          data-state={verdict === "typo" ? "right" : verdict ?? undefined}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          readOnly={verdict !== null}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint={verdict ? "next" : "done"}
          lang="en"
          placeholder={`${entry.en.length} ${entry.en.includes(" ") ? "символов" : "букв"}`}
        />
        {verdict === null ? (
          <div className="train__actions">
            <button type="button" className="btn" onClick={hint} disabled={hints >= entry.en.length - 1}>
              Подсказка
            </button>
            <button type="submit" className="btn btn--primary" disabled={!value.trim()}>
              Проверить
            </button>
          </div>
        ) : (
          <>
            <div className={`verdict ${verdict === "wrong" ? "verdict--wrong" : "verdict--right"}`} role="status">
              {verdict === "right" && "Верно."}
              {verdict === "typo" && "Засчитано, но с опечаткой."}
              {verdict === "wrong" && "Не совсем."}
              <p className="typing__answer">
                <b lang="en">{entry.en}</b> {entry.ipa && <span lang="en-fonipa">[{entry.ipa}]</span>}
              </p>
              {entry.example && <p className="card__ex" lang="en">{entry.example}</p>}
              {entry.exampleRu && <p className="card__exru">{entry.exampleRu}</p>}
            </div>
            <button ref={next} type="submit" className="btn btn--block" style={{ marginTop: 14 }}>
              Дальше
            </button>
          </>
        )}
      </form>
    </>
  );
}
