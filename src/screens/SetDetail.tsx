import { Keyboard, Layers, ListChecks, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { BoxBar } from "../components/BoxBar";
import { EntryRow } from "../components/EntryRow";
import { Head } from "../components/Head";
import { useGuideWords } from "../components/useGuideWords";
import { boxCounts } from "../lib/srs";
import { deleteSet, removeWord, renameSet, useAppState } from "../lib/storage";
import { BOX_LABELS } from "../lib/types";
import { goBack, navigate } from "../router";
import { plural } from "./Today";

export function SetDetail({ id }: { id: string }) {
  const s = useAppState();
  const set = s.sets.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(set?.title ?? "");
  const [first, last] = useGuideWords([set?.words.length]);

  if (!set) {
    return (
      <div className="page">
        <Head onBack={() => navigate("/", { replace: true })} backLabel="Сегодня" />
        <div className="state">
          <h2>Набор не найден</h2>
          <p>Возможно, его удалили.</p>
        </div>
      </div>
    );
  }

  const counts = boxCounts(set.words);
  const now = Date.now();
  const due = set.words.filter((w) => w.dueAt <= now).length;
  const sorted = [...set.words].sort((a, b) => a.en.localeCompare(b.en, "en"));

  const commitTitle = () => {
    const t = title.trim();
    if (t && t !== set.title) renameSet(set.id, t);
    setEditing(false);
  };

  return (
    <div className="page">
      <Head onBack={() => goBack("/")} backLabel="Сегодня" right={first && last ? `${first} — ${last}` : set.level} />

      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            commitTitle();
          }}
          className="ask"
          style={{ marginTop: 24 }}
        >
          <label htmlFor="set-title" className="visually-hidden">
            Название набора
          </label>
          <input
            id="set-title"
            className="field"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            enterKeyHint="done"
          />
        </form>
      ) : (
        <h1 className="title">{set.title}</h1>
      )}
      <p className="lede num">
        {set.level} · {set.words.length} {plural(set.words.length, "слово", "слова", "слов")}
        {set.source === "claude" ? " · подобрано Claude" : ""}
      </p>

      <section className="plate" aria-label="Прогресс набора">
        <div className="plate__cap">
          <span className="sc">Ступени повторения</span>
          <span className="num">
            выучено <b>{counts[4]}</b>
          </span>
        </div>
        <BoxBar counts={counts} legend />
      </section>

      <button
        className="btn btn--primary btn--block"
        onClick={() => navigate(`/train/${set.id}/mixed`)}
        disabled={set.words.length === 0}
      >
        {due > 0 ? "Повторить" : "Пройти весь набор"}
        <span className="btn__count num">{due > 0 ? due : set.words.length}</span>
      </button>

      <div className="modes" role="group" aria-label="Режимы тренировки">
        <button className="mode" onClick={() => navigate(`/train/${set.id}/cards`)} disabled={!set.words.length}>
          <Layers size={22} strokeWidth={1.5} aria-hidden="true" />
          Карточки
        </button>
        <button className="mode" onClick={() => navigate(`/train/${set.id}/quiz`)} disabled={set.words.length < 2}>
          <ListChecks size={22} strokeWidth={1.5} aria-hidden="true" />
          Тест
        </button>
        <button className="mode" onClick={() => navigate(`/train/${set.id}/typing`)} disabled={!set.words.length}>
          <Keyboard size={22} strokeWidth={1.5} aria-hidden="true" />
          Письмо
        </button>
      </div>

      <h2 className="section-title">
        Статьи
        <small className="num">{set.words.length}</small>
      </h2>
      {sorted.length === 0 ? (
        <p className="lede">В наборе не осталось слов.</p>
      ) : (
        <ul className="entries">
          {sorted.map((w, i) => (
            <EntryRow
              key={w.id}
              entry={w}
              index={i}
              side={
                <span className="entry__boxmark">
                  <i className="swatch" style={{ background: `var(--box-${w.box})` }} />
                  {BOX_LABELS[w.box]}
                </span>
              }
            />
          ))}
        </ul>
      )}

      <div className="danger-zone">
        <button
          className="link-btn"
          onClick={() => {
            setTitle(set.title);
            setEditing(true);
          }}
        >
          <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
          Переименовать набор
        </button>
        <EditWords setId={set.id} words={sorted.map((w) => ({ id: w.id, en: w.en }))} />
        <div style={{ marginTop: 40 }}>
          <button
            className="link-btn link-btn--danger"
            onClick={() => {
              if (confirm(`Удалить набор «${set.title}»? Прогресс по его словам пропадёт.`)) {
                deleteSet(set.id);
                navigate("/", { replace: true });
              }
            }}
          >
            <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
            Удалить набор
          </button>
        </div>
      </div>
    </div>
  );
}

function EditWords({ setId, words }: { setId: string; words: { id: string; en: string }[] }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <div>
        <button className="link-btn" onClick={() => setOpen(true)} disabled={words.length === 0}>
          Убрать отдельные слова
        </button>
      </div>
    );
  }
  return (
    <div className="notice">
      <div className="notice__row">
        <span>Нажми на слово, чтобы убрать его из набора</span>
        <button className="link-btn" onClick={() => setOpen(false)}>
          Готово
        </button>
      </div>
      <div className="chips chips--wrap">
        {words.map((w) => (
          <button key={w.id} className="chip" onClick={() => removeWord(setId, w.id)} aria-label={`Убрать ${w.en}`}>
            {w.en} <X size={14} strokeWidth={1.5} aria-hidden="true" style={{ verticalAlign: "-2px" }} />
          </button>
        ))}
      </div>
    </div>
  );
}
