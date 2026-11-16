import { FileText, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EntryRow } from "../components/EntryRow";
import { Head } from "../components/Head";
import { lookupMany, lookupWord, parseList, type Found } from "../lib/lookup";
import { norm } from "../lib/picker";
import { OWN_SET_TITLE, addOwnWords, getState, useAppState } from "../lib/storage";
import type { Entry } from "../lib/types";
import { goBack, navigate } from "../router";
import { plural } from "./Today";

type Mode = "one" | "list";

const SOURCE_NOTE: Record<Found["source"], string> = {
  bank: "Нашёл во встроенном словаре.",
  claude: "Подобрал Claude.",
  online: "Нашёл в онлайн-словаре. Перевод подобран автоматически — проверь его.",
  none: "Не нашёл это слово. Впиши перевод сам — остальное можно оставить пустым.",
};

function toEntry(f: Found, level: Entry["level"]): Entry {
  return {
    en: f.en.trim(),
    ipa: f.ipa.trim(),
    pos: f.pos.trim(),
    ru: f.ru.trim(),
    example: f.example.trim(),
    exampleRu: f.exampleRu.trim(),
    topic: "own",
    level,
  };
}

export function AddWords({ setId }: { setId?: string }) {
  const s = useAppState();
  const level = s.settings.level;
  const hasKey = s.settings.apiKey.trim().length > 0;
  const own = s.sets.find((x) => x.source === "own" && x.title === OWN_SET_TITLE);
  const [target, setTarget] = useState<string>(setId ?? own?.id ?? "new");
  const [mode, setMode] = useState<Mode>("one");
  const targetTitle = target === "new" ? OWN_SET_TITLE : s.sets.find((x) => x.id === target)?.title ?? OWN_SET_TITLE;

  return (
    <div className="page">
      <Head onBack={() => goBack(setId ? `/set/${setId}` : "/new")} backLabel="Назад" right="Свои слова" />
      <h1 className="title">Свои слова</h1>
      <p className="lede">
        Напиши слово — перевод, транскрипция и пример подставятся сами. Проверь и добавь в набор.
      </p>

      <div className="addbar">
        <label className="addbar__label" htmlFor="target">
          В набор
        </label>
        <select id="target" className="field" value={target} onChange={(e) => setTarget(e.target.value)}>
          {!own && <option value="new">Новый набор «{OWN_SET_TITLE}»</option>}
          {s.sets.map((x) => (
            <option key={x.id} value={x.id}>
              {x.title} · {x.words.length}
            </option>
          ))}
        </select>
      </div>

      <div className="seg addmode" role="group" aria-label="Как добавить">
        <button aria-pressed={mode === "one"} onClick={() => setMode("one")}>
          Одно слово
        </button>
        <button aria-pressed={mode === "list"} onClick={() => setMode("list")}>
          Список или файл
        </button>
      </div>

      {mode === "one" ? (
        <OneWord target={target} level={level} hasKey={hasKey} onTarget={setTarget} targetTitle={targetTitle} />
      ) : (
        <ManyWords target={target} level={level} hasKey={hasKey} targetTitle={targetTitle} />
      )}

      <p className="status-line addnote">
        {hasKey
          ? "Слов нет во встроенном словаре — их описывает Claude по твоему ключу."
          : "Если слова нет во встроенном словаре, оно отправляется в бесплатные сервисы Free Dictionary и MyMemory. С ключом Claude в настройках переводы точнее."}
      </p>
    </div>
  );
}

function OneWord({
  target,
  level,
  hasKey,
  onTarget,
  targetTitle,
}: {
  target: string;
  level: Entry["level"];
  hasKey: boolean;
  onTarget: (id: string) => void;
  targetTitle: string;
}) {
  const [word, setWord] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<Entry[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const lastLooked = useRef("");

  const look = async (w: string) => {
    const q = w.trim();
    if (q.length < 2 || norm(q) === lastLooked.current) return;
    lastLooked.current = norm(q);
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setBusy(true);
    setMsg(null);
    const f = await lookupWord(q, { apiKey: getState().settings.apiKey, level, signal: ctrl.signal });
    if (ctrl.signal.aborted) return;
    setFound({ ...f, en: q });
    setBusy(false);
  };

  // Look the word up on its own once the learner pauses typing.
  useEffect(() => {
    if (word.trim().length < 2) return;
    const t = setTimeout(() => void look(word), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  useEffect(() => () => abort.current?.abort(), []);

  const edit = (k: keyof Found, v: string) => setFound((f) => (f ? { ...f, [k]: v } : f));

  const add = () => {
    if (!found || !found.ru.trim() || !found.en.trim()) return;
    const entry = toEntry(found, level);
    const { setId, added: n } = addOwnWords(target === "new" ? null : target, level, [entry]);
    onTarget(setId);
    if (n === 0) {
      setMsg(`«${entry.en}» уже есть в наборе «${targetTitle}».`);
      return;
    }
    setAdded((a) => [entry, ...a]);
    setMsg(`Добавлено: ${entry.en}`);
    setWord("");
    setFound(null);
    lastLooked.current = "";
    input.current?.focus();
  };

  return (
    <section className="addone">
      <form
        className="ask"
        onSubmit={(e) => {
          e.preventDefault();
          lastLooked.current = "";
          void look(word);
        }}
      >
        <label htmlFor="own-word" className="visually-hidden">
          Слово по-английски
        </label>
        <input
          ref={input}
          id="own-word"
          className="field field--word"
          placeholder="Слово по-английски"
          value={word}
          onChange={(e) => {
            setWord(e.target.value);
            setMsg(null);
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          lang="en"
        />
        <button className="btn btn--small" type="submit" disabled={word.trim().length < 2 || busy} aria-label="Найти перевод">
          <Search size={18} strokeWidth={1.5} aria-hidden="true" />
          Найти
        </button>
      </form>

      {msg && (
        <p className="status-line status-line--ok" role="status">
          {msg}
        </p>
      )}

      {busy && (
        <p className="status-line" role="status">
          {hasKey ? "Ищу в словаре и спрашиваю Claude…" : "Ищу перевод и пример…"}
        </p>
      )}

      {found && !busy && (
        <form
          className="plate editor"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <p className="plate__cap">
            <span className="sc">{found.en}</span>
            <span>{SOURCE_NOTE[found.source]}</span>
          </p>

          <label className="editor__row">
            <span>Перевод</span>
            <input className="field" value={found.ru} onChange={(e) => edit("ru", e.target.value)} placeholder="обязательно" required />
          </label>
          {found.variants.length > 1 && (
            <div className="chips chips--wrap editor__variants" role="group" aria-label="Другие варианты перевода">
              {found.variants.map((v) => (
                <button key={v} type="button" className="chip" aria-pressed={found.ru === v} onClick={() => edit("ru", v)}>
                  {v}
                </button>
              ))}
            </div>
          )}
          <label className="editor__row">
            <span>Транскрипция</span>
            <input className="field" value={found.ipa} onChange={(e) => edit("ipa", e.target.value)} lang="en-fonipa" />
          </label>
          <label className="editor__row">
            <span>Пример</span>
            <input className="field" value={found.example} onChange={(e) => edit("example", e.target.value)} lang="en" />
          </label>
          <label className="editor__row">
            <span>Перевод примера</span>
            <input className="field" value={found.exampleRu} onChange={(e) => edit("exampleRu", e.target.value)} />
          </label>

          <button className="btn btn--primary btn--block" type="submit" disabled={!found.ru.trim()}>
            Добавить в «{targetTitle}»
          </button>
        </form>
      )}

      {added.length > 0 && (
        <>
          <h2 className="section-title">
            Добавлено сейчас
            <small className="num">{added.length}</small>
          </h2>
          <ul className="entries">
            {added.map((e, i) => (
              <EntryRow key={e.en} entry={e} index={i} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

interface Row extends Found {
  /** Translation came with the pasted line, so it is the learner's own. */
  given: boolean;
}

function ManyWords({
  target,
  level,
  hasKey,
  targetTitle,
}: {
  target: string;
  level: Entry["level"];
  hasKey: boolean;
  targetTitle: string;
}) {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const abort = useRef<AbortController | null>(null);
  const parsed = useMemo(() => parseList(text), [text]);

  useEffect(() => () => abort.current?.abort(), []);

  const readFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 500_000) {
      setError("Файл слишком большой. Подойдёт обычный текстовый файл или экспорт из Quizlet.");
      return;
    }
    setError(null);
    setText(await f.text());
    if (file.current) file.current.value = "";
  };

  const prepare = async () => {
    if (!parsed.length) return;
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setRows(null);
    setError(null);
    setProgress({ done: 0, total: parsed.length });
    const found = await lookupMany(
      parsed.map((p) => p.en),
      {
        apiKey: getState().settings.apiKey,
        level,
        signal: ctrl.signal,
        onProgress: (done) => setProgress({ done, total: parsed.length }),
      },
    );
    if (ctrl.signal.aborted) return;
    setRows(
      found.map((f, i) => {
        const given = parsed[i].ru;
        return given ? { ...f, en: parsed[i].en, ru: given, given: true } : { ...f, en: parsed[i].en, given: false };
      }),
    );
    setProgress(null);
  };

  const inSet = new Set(
    (target === "new" ? [] : getState().sets.find((x) => x.id === target)?.words ?? []).map((w) => norm(w.en)),
  );
  const ready = rows?.filter((r) => r.ru.trim() && !inSet.has(norm(r.en))) ?? [];
  const already = rows?.filter((r) => inSet.has(norm(r.en))).length ?? 0;

  const addAll = () => {
    if (!ready.length) return;
    const { setId, added } = addOwnWords(target === "new" ? null : target, level, ready.map((r) => toEntry(r, level)));
    if (added === 0) {
      setError(`Все эти слова уже есть в наборе «${targetTitle}».`);
      return;
    }
    navigate(`/set/${setId}`, { replace: true });
  };

  if (rows) {
    const missing = rows.filter((r) => !r.ru.trim() && !inSet.has(norm(r.en))).length;
    return (
      <section>
        <h2 className="section-title">
          Проверь переводы
          <small className="num">{rows.length}</small>
        </h2>
        {missing > 0 && (
          <p className="status-line status-line--err">
            {missing} {plural(missing, "слово", "слова", "слов")} без перевода — впиши перевод или убери строку.
          </p>
        )}
        <ul className="importlist">
          {rows.map((r, i) => (
            <li key={r.en} className="importrow">
              <div className="importrow__word">
                <b lang="en">{r.en}</b>
                {r.ipa && <span lang="en-fonipa">[{r.ipa}]</span>}
              </div>
              <input
                className="field"
                value={r.ru}
                placeholder="перевод"
                aria-label={`Перевод для ${r.en}`}
                onChange={(e) => setRows((rs) => rs!.map((x, j) => (j === i ? { ...x, ru: e.target.value } : x)))}
              />
              <button
                className="icon-btn"
                type="button"
                aria-label={`Убрать ${r.en}`}
                onClick={() => setRows((rs) => rs!.filter((_, j) => j !== i))}
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </li>
          ))}
        </ul>
        {already > 0 && (
          <p className="status-line">
            {already} {plural(already, "слово уже есть", "слова уже есть", "слов уже есть")} в наборе «{targetTitle}» — {already === 1 ? "его" : "их"} пропущу.
          </p>
        )}
        {error && <p className="status-line status-line--err">{error}</p>}
        <div className="cta-dock">
          <button className="btn btn--primary btn--block" onClick={addAll} disabled={!ready.length}>
            Добавить {ready.length} {plural(ready.length, "слово", "слова", "слов")}
          </button>
          <button className="link-btn" onClick={() => setRows(null)} style={{ width: "100%", justifyContent: "center" }}>
            Назад к списку
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <label htmlFor="own-list" className="visually-hidden">
        Список слов
      </label>
      <textarea
        id="own-list"
        className="field field--area"
        rows={9}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"По одному слову в строке:\ncommute\nsustainable\n\nМожно сразу с переводом:\ngive up - сдаваться\nbargain\tвыгодная покупка"}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        lang="en"
      />
      <p className="status-line">
        Подойдёт и экспорт из Quizlet («слово ⇥ перевод»). Слова без перевода я подберу сам
        {hasKey ? " с помощью Claude." : "."}
      </p>
      <div className="listactions">
        <button className="btn btn--small" type="button" onClick={() => file.current?.click()}>
          <FileText size={18} strokeWidth={1.5} aria-hidden="true" />
          Из файла
        </button>
        <button className="btn btn--primary btn--small" type="button" onClick={() => void prepare()} disabled={!parsed.length || !!progress}>
          {progress
            ? `Ищу переводы ${progress.done} / ${progress.total}`
            : parsed.length
              ? `Подобрать переводы · ${parsed.length}`
              : "Подобрать переводы"}
        </button>
        <input
          ref={file}
          type="file"
          accept=".txt,.csv,.tsv,text/plain,text/csv,text/tab-separated-values"
          className="visually-hidden"
          tabIndex={-1}
          onChange={(e) => void readFile(e.target.files?.[0])}
        />
      </div>
      {error && <p className="status-line status-line--err">{error}</p>}
    </section>
  );
}
