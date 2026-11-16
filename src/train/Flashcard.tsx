import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Volume2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { swungDash } from "../components/EntryRow";
import { speak } from "../lib/speech";
import type { Entry } from "../lib/types";

interface Props {
  entry: Entry;
  autoSpeak: boolean;
  onDecide: (known: boolean) => void;
}

const FLING = 110;

export function Flashcard({ entry, autoSpeak, onDecide }: Props) {
  const [flipped, setFlipped] = useState(false);
  const busy = useRef(false);
  const reduce = useReducedMotion();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 240], [-7, 7]);
  const yes = useTransform(x, [24, FLING], [0, 1]);
  const no = useTransform(x, [-FLING, -24], [1, 0]);

  useEffect(() => {
    if (autoSpeak) speak(entry.en, { fromTap: false });
  }, [entry.en, autoSpeak]);

  const decide = useCallback(
    async (known: boolean) => {
      if (busy.current) return;
      busy.current = true;
      if (!reduce) {
        await animate(x, known ? 520 : -520, { duration: 0.26, ease: [0.4, 0, 1, 1] });
      }
      onDecide(known);
    },
    [onDecide, reduce, x],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") void decide(true);
      else if (e.key === "ArrowLeft") void decide(false);
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide]);

  return (
    <>
      <div className="card-wrap">
        <motion.div
          className="card"
          style={{ x, rotate }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.85}
          onDragEnd={(_, info) => {
            if (info.offset.x > FLING || info.velocity.x > 700) void decide(true);
            else if (info.offset.x < -FLING || info.velocity.x < -700) void decide(false);
          }}
          onTap={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          aria-label={flipped ? `Перевод: ${entry.ru}. Нажми, чтобы вернуться к слову` : `${entry.en}. Нажми, чтобы увидеть перевод`}
        >
          <div className="card__inner" data-flipped={flipped}>
            <div className="card__face" aria-hidden={flipped}>
              <div className="card__head">
                <span className="sc">{entry.pos ? `${entry.level} · ${entry.pos}` : entry.level}</span>
                <button
                  className="icon-btn"
                  type="button"
                  aria-label="Произнести"
                  onPointerDownCapture={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(entry.en);
                  }}
                >
                  <Volume2 size={20} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
              <div className="card__center">
                <div className="card__hw" lang="en">{entry.en}</div>
                {entry.ipa && <div className="card__ipa" lang="en-fonipa">[{entry.ipa}]</div>}
              </div>
              <p className="card__hint">Нажми, чтобы перевернуть</p>
            </div>
            <div className="card__face card__face--back" aria-hidden={!flipped}>
              <div className="card__head">
                <span lang="en">{entry.en}</span>
                {entry.ipa && <span lang="en-fonipa">[{entry.ipa}]</span>}
              </div>
              <div className="card__center">
                <div className="card__ru">{entry.ru}</div>
                {entry.example && <p className="card__ex" lang="en">{swungDash(entry.example, entry.en)}</p>}
                {entry.exampleRu && <p className="card__exru">{entry.exampleRu}</p>}
              </div>
              <p className="card__hint">Свайп вправо — помню, влево — нет</p>
            </div>
          </div>
          <motion.span className="card__stamp card__stamp--yes sc" style={{ opacity: yes }} aria-hidden="true">
            помню
          </motion.span>
          <motion.span className="card__stamp card__stamp--no sc" style={{ opacity: no }} aria-hidden="true">
            не помню
          </motion.span>
        </motion.div>
      </div>
      <div className="train__actions">
        <button className="btn" onClick={() => void decide(false)}>
          Не помню
        </button>
        <button className="btn btn--primary" onClick={() => void decide(true)}>
          Помню
        </button>
      </div>
    </>
  );
}
