import { BookPlus, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EntryRow } from "../components/EntryRow";
import { Head } from "../components/Head";
import { useGuideWords } from "../components/useGuideWords";
import { loadBank } from "../lib/bank";
import { MONTHS_GEN } from "../lib/dates";
import { norm, pickEntries } from "../lib/picker";
import { createSet, getState, markKnown, updateSettings, useAppState, usedWords } from "../lib/storage";
import { LEVELS, TOPICS, TOPIC_KEYS, type Entry, type Level, type Topic } from "../lib/types";
import { navigate } from "../router";
import { plural } from "./Today";

const COUNT = 20;

type TopicChoice = Topic | null | "custom";

interface Batch {
  entries: Entry[];
  source: "bank" | "claude";
  note: string | null;
}

export function NewSet() {
  const s = useAppState();
  const [level, setLevel] = useState<Level>(s.settings.level);
  const [topic, setTopic] = useState<TopicChoice>(null);
  const [custom, setCustom] = useState("");
  const [batch, setBatch] = useState<Batch | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shown = useRef(new Set<string>());
  const abort = useRef<AbortController | null>(null);
  const hasKey = s.settings.apiKey.trim().length > 0;

  const exclusions = useCallback(() => {
    const ex = usedWords(getState());
    for (const w of shown.current) ex.add(w);
    return ex;
  }, []);

  /** Fill `n` slots from the bank, never repeating anything used or shown. */
  const fromBank = useCallback(
    async (lvl: Level, t: Topic | null, n: number, keep: Set<string>) => {
      const bank = await loadBank(lvl);
      const ex = exclusions();
      for (const k of keep) ex.add(k);
      return pickEntries(bank, { count: n, topic: t, exclude: ex });
    },
    [exclusions],
  );

  const fill = useCallback(
    async (opts: { keep: Entry[] }) => {
      abort.current?.abort();
      const ctrl = new AbortController();
      abort.current = ctrl;
      setLoading(true);
      setError(null);
      const keep = opts.keep;
      const need = COUNT - keep.length;
      const keepKeys = new Set(keep.map((e) => norm(e.en)));
      try {
        let fresh: Entry[] = [];
        let source: Batch["source"] = "bank";
        let note: string | null = null;

        if (topic === "custom") {
          const theme = custom.trim();
          if (!theme) {
            setLoading(false);
            return;
          }
          // The Claude SDK is only downloaded when the learner actually asks Claude for words.
          const ai = await import("../ai/generateWords").catch(() => null);
          try {
            if (!ai) throw new Error("offline");
            fresh = await ai.generateWords({
              apiKey: getState().settings.apiKey,
              level,
              topic: theme,
              exclude: [...exclusions(), ...keepKeys],
              count: need,
              signal: ctrl.signal,
            });
            source = "claude";
          } catch (err) {
            if (ctrl.signal.aborted) return;
            const msg =
              ai && err instanceof ai.GenerateError
                ? err.message
                : "Не удалось связаться с Claude: похоже, нет интернета.";
            const r = await fromBank(level, null, need, keepKeys);
            fresh = r.entries;
            note = `${msg} Пока — слова из встроенного словаря.`;
          }
        } else {
          const r = await fromBank(level, topic, need, keepKeys);
          fresh = r.entries;
          if (r.exhausted) {
            note = `Во встроенном словаре ${level} закончились новые слова${
              topic ? " по этой теме" : ""
            }. Выбери другой уровень${hasKey ? " или свою тему" : " или добавь ключ Claude в настройках"}.`;
          } else if (r.filled > 0 && topic) {
            note = `По теме «${TOPICS[topic]}» осталось ${need - r.filled} ${plural(
              need - r.filled,
              "новое слово",
              "новых слова",
              "новых слов",
            )}, остальные — из других тем.`;
          }
        }
        if (ctrl.signal.aborted) return;
        for (const e of fresh) shown.current.add(norm(e.en));
        setBatch({ entries: [...keep, ...fresh], source, note });
      } catch {
        if (!ctrl.signal.aborted) setError("Не удалось загрузить словарь. Проверь подключение и попробуй ещё раз.");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    },
    [topic, custom, level, exclusions, fromBank, hasKey],
  );

  // A new level or topic deals a fresh page of 20.
  useEffect(() => {
    if (topic === "custom") return;
    setSelected(new Set());
    void fill({ keep: [] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, topic]);

  useEffect(() => () => abort.current?.abort(), []);

  const entries = batch?.entries ?? [];
  const [first, last] = useGuideWords([entries]);
  const chosen = useMemo(() => entries.filter((e) => selected.has(norm(e.en))), [entries, selected]);

  const toggle = (e: Entry) =>
    setSelected((prev) => {
      const next = new Set(prev);
      const k = norm(e.en);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const replaceRest = () => void fill({ keep: chosen });

  const known = async (e: Entry) => {
    markKnown([e.en]);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(norm(e.en));
      return next;
    });
    if (!batch) return;
    const rest = batch.entries.filter((x) => x !== e);
    const t = topic === "custom" ? null : topic;
    const r = await fromBank(level, t, 1, new Set(rest.map((x) => norm(x.en))));
    for (const x of r.entries) shown.current.add(norm(x.en));
    setBatch({ ...batch, entries: batch.source === "claude" ? rest : [...rest, ...r.entries] });
  };

  const save = () => {
    if (chosen.length === 0) return;
    const d = new Date();
    const label =
      topic === "custom" ? custom.trim() : topic ? TOPICS[topic] : `Слова ${level}`;
    const set = createSet({
      title: `${label[0].toUpperCase()}${label.slice(1)} · ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`,
      level,
      source: batch?.source ?? "bank",
      entries: chosen,
    });
    navigate(`/set/${set.id}`, { replace: true });
  };

  const chooseLevel = (l: Level) => {
    setLevel(l);
    if (l !== getState().settings.level) updateSettings({ level: l });
  };

  return (
    <div className="page">
      <Head left={first || "Подбор"} right={last || level} />
      <h1 className="title">Выбери слова</h1>
          <p className="lede">Отметь те, что хочешь выучить. Остальные можно заменить.</p>
      <a className="link-btn" href="#/add">
        <BookPlus size={16} strokeWidth={1.5} aria-hidden="true" />
        Добавить свои слова
      </a>

          <div className="chips" role="group" aria-label="Тема">
            <button className="chip" aria-pressed={topic === null} onClick={() => setTopic(null)}>
              Любая тема
            </button>
            {hasKey && (
              <button className="chip" aria-pressed={topic === "custom"} onClick={() => setTopic("custom")}>
                <Sparkles size={15} strokeWidth={1.5} aria-hidden="true" style={{ verticalAlign: "-2px" }} /> Своя
              </button>
            )}
            {TOPIC_KEYS.filter((t) => t !== "general").map((t) => (
              <button key={t} className="chip" aria-pressed={topic === t} onClick={() => setTopic(t)}>
                {TOPICS[t]}
              </button>
            ))}
          </div>

          {topic === "custom" && (
            <form
              className="ask"
              onSubmit={(e) => {
                e.preventDefault();
                setSelected(new Set());
                void fill({ keep: [] });
              }}
            >
              <label className="visually-hidden" htmlFor="custom-topic">
                Своя тема
              </label>
              <input
                id="custom-topic"
                className="field"
                placeholder="Например: собеседование в IT"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                enterKeyHint="go"
              />
              <button className="btn btn--small" type="submit" disabled={!custom.trim() || loading}>
                Подобрать
              </button>
            </form>
          )}

          {batch?.note && (
            <div className="notice" role="status">
              <p>{batch.note}</p>
            </div>
          )}

      <div className="shouldered">
        <div>
          {error ? (
            <div className="state">
              <h2>Словарь не открылся</h2>
              <p>{error}</p>
              <button className="btn" onClick={() => void fill({ keep: [] })}>
                Попробовать снова
              </button>
            </div>
          ) : loading && entries.length === 0 ? (
            <div aria-busy="true" aria-label="Подбираю слова">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="skeleton-entry" />
              ))}
              {topic === "custom" && <p className="status-line">Claude подбирает слова — обычно это 10–20 секунд.</p>}
            </div>
          ) : topic === "custom" && entries.length === 0 ? (
            <div className="state state--left">
              <p>Напиши тему своими словами — Claude подберёт 20 слов уровня {level}.</p>
            </div>
          ) : (
            <ul className="entries" aria-busy={loading}>
              {entries.map((e, i) => (
                <EntryRow
                  key={e.en}
                  entry={e}
                  index={i}
                  pick={{ checked: selected.has(norm(e.en)), onToggle: () => toggle(e) }}
                  side={
                    <button
                      className="entry__known"
                      type="button"
                      aria-label={`Уже знаю ${e.en}, больше не предлагать`}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        void known(e);
                      }}
                      onKeyDown={(ev) => ev.stopPropagation()}
                    >
                      знаю
                    </button>
                  }
                />
              ))}
            </ul>
          )}
        </div>

        <nav className="shoulder" aria-label="Уровень">
          {LEVELS.map((l) => (
            <button key={l} className="thumb" aria-pressed={level === l} onClick={() => chooseLevel(l)}>
              {l}
            </button>
          ))}
        </nav>
      </div>

      {entries.length > 0 && (
        <div className="pickbar">
          <div className="pickbar__row num">
            <span>
              Отмечено <b>{chosen.length}</b> из {entries.length}
            </span>
            {loading && <span className="status-line">подбираю…</span>}
          </div>
          <div className="pickbar__actions">
            <button
              className="btn btn--small"
              onClick={replaceRest}
              disabled={loading || chosen.length === entries.length}
              aria-label="Заменить неотмеченные слова"
            >
              <RefreshCw size={18} strokeWidth={1.5} aria-hidden="true" />
              Заменить
            </button>
            <button className="btn btn--primary btn--small" onClick={save} disabled={chosen.length === 0}>
              Сохранить набор
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
