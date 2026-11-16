import { Volume2 } from "lucide-react";
import type { ReactNode } from "react";
import { speak } from "../lib/speech";
import type { Entry } from "../lib/types";
import { Tick } from "./Ornament";

/** Lexicon convention: the headword inside its own example is printed as a swung dash. */
export function swungDash(example: string, headword: string): ReactNode {
  const i = example.toLowerCase().indexOf(headword.toLowerCase());
  if (i < 0 || headword.length < 3) return example;
  return (
    <>
      {example.slice(0, i)}
      <span>~</span>
      {example.slice(i + headword.length)}
    </>
  );
}

interface Props {
  entry: Entry;
  index: number;
  pick?: { checked: boolean; onToggle: () => void };
  /** Set on the translation line, flush right: «знаю» on the picker, the box mark in a set. */
  side?: ReactNode;
}

export function EntryRow({ entry, index, pick, side }: Props) {
  const body = (
    <div className="entry__body">
      <div className="entry__line">
        <span className="entry__hw" lang="en">
          {entry.en}
        </span>{" "}
        <span className="entry__pos">{entry.pos}</span>{" "}
        <span className="entry__ipa" lang="en-fonipa">
          [{entry.ipa}]
        </span>
        <button
          className="entry__speak"
          type="button"
          aria-label={`Произнести ${entry.en}`}
          onClick={(e) => {
            e.stopPropagation();
            speak(entry.en);
          }}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Volume2 size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <div className="entry__row">
        <p className="entry__ru">{entry.ru}</p>
        {side}
      </div>
      <p className="entry__ex" lang="en">
        {swungDash(entry.example, entry.en)}
      </p>
    </div>
  );

  if (pick) {
    return (
      <li
        className="entry entry--pick"
        data-guide={entry.en}
        data-index={index}
        role="checkbox"
        aria-checked={pick.checked}
        tabIndex={0}
        onClick={pick.onToggle}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            pick.onToggle();
          }
        }}
      >
        <div className="entry__margin">
          <Tick on={pick.checked} />
        </div>
        {body}
      </li>
    );
  }

  return (
    <li className="entry entry--plain" data-guide={entry.en} data-index={index}>
      {body}
    </li>
  );
}
