import { Download, Eye, EyeOff, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Head } from "../components/Head";
import { isStandalone } from "../lib/platform";
import { ImportError, clearKnown, exportJson, importJson, resetAll, updateSettings, useAppState } from "../lib/storage";
import { LEVELS, type ThemePref } from "../lib/types";
import { plural } from "./Today";

const GOALS = [10, 20, 30, 50];
const THEMES: { v: ThemePref; label: string }[] = [
  { v: "auto", label: "Авто" },
  { v: "light", label: "Светлая" },
  { v: "dark", label: "Ночная" },
];

export function Settings() {
  const s = useAppState();
  const st = s.settings;
  const [key, setKey] = useState(st.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [keyMsg, setKeyMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ioMsg, setIoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const file = useRef<HTMLInputElement>(null);

  const saveKey = () => {
    const k = key.trim();
    if (k && !k.startsWith("sk-ant-")) {
      setKeyMsg({ ok: false, text: "Ключ Claude начинается с «sk-ant-». Скопируй его целиком с console.anthropic.com." });
      return;
    }
    updateSettings({ apiKey: k });
    setKeyMsg({
      ok: true,
      text: k ? "Ключ сохранён на этом телефоне. В «Подборе» появилась своя тема." : "Ключ удалён.",
    });
  };

  const doExport = async () => {
    const json = exportJson();
    const name = `leksikon-${new Date().toISOString().slice(0, 10)}.json`;
    const blob = new Blob([json], { type: "application/json" });
    const f = new File([blob], name, { type: "application/json" });
    try {
      if (navigator.canShare?.({ files: [f] })) {
        await navigator.share({ files: [f], title: "Резервная копия Лексикона" });
        setIoMsg({ ok: true, text: "Резервная копия готова." });
        return;
      }
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setIoMsg({ ok: true, text: `Файл ${name} сохранён.` });
  };

  const doImport = async (f: File | undefined) => {
    if (!f) return;
    if (!confirm("Заменить все наборы и историю данными из файла?")) return;
    try {
      importJson(await f.text());
      setIoMsg({ ok: true, text: "Данные восстановлены из резервной копии." });
    } catch (err) {
      setIoMsg({ ok: false, text: err instanceof ImportError ? err.message : "Не удалось прочитать файл." });
    } finally {
      if (file.current) file.current.value = "";
    }
  };

  return (
    <div className="page">
      <Head left="Настройки" right="Лексикон" />
      <h1 className="title">Настройки</h1>

      <div className="setting">
        <div className="setting__label">Уровень слов</div>
        <p className="setting__hint">С него начинается подбор. В «Подборе» уровень можно сменить в любой момент.</p>
        <div className="setting__control seg" role="group" aria-label="Уровень">
          {LEVELS.map((l) => (
            <button key={l} aria-pressed={st.level === l} onClick={() => updateSettings({ level: l })}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="setting">
        <div className="setting__label">Цель дня</div>
        <p className="setting__hint">Сколько верных ответов нужно, чтобы день засчитался в серию.</p>
        <div className="setting__control seg num" role="group" aria-label="Цель дня">
          {GOALS.map((g) => (
            <button key={g} aria-pressed={st.dailyGoal === g} onClick={() => updateSettings({ dailyGoal: g })}>
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="setting setting--row">
        <div>
          <div className="setting__label" id="autospeak-label">
            Озвучивать слова
          </div>
          <p className="setting__hint">Произносить английское слово, когда оно появляется.</p>
        </div>
        <button
          className="switch setting__control"
          role="switch"
          aria-checked={st.autoSpeak}
          aria-labelledby="autospeak-label"
          onClick={() => updateSettings({ autoSpeak: !st.autoSpeak })}
        />
      </div>

      <div className="setting">
        <div className="setting__label">Оформление</div>
        <p className="setting__hint">«Авто» следует за светлой или тёмной темой iPhone.</p>
        <div className="setting__control seg" role="group" aria-label="Оформление">
          {THEMES.map((t) => (
            <button key={t.v} aria-pressed={st.theme === t.v} onClick={() => updateSettings({ theme: t.v })}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="setting">
        <label className="setting__label" htmlFor="api-key">
          Ключ Claude
        </label>
        <p className="setting__hint">
          Необязательно. С ключом слова подбираются на любую тему, без ключа — из встроенного словаря на{" "}
          1887 слов. Ключ создаётся на console.anthropic.com, хранится только на этом телефоне и не попадает в
          резервную копию. Один набор стоит около 4 центов.
        </p>
        <form
          className="setting__control keyrow"
          onSubmit={(e) => {
            e.preventDefault();
            saveKey();
          }}
        >
          <div style={{ position: "relative" }}>
            <input
              id="api-key"
              className="field"
              type={showKey ? "text" : "password"}
              placeholder="sk-ant-…"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setKeyMsg(null);
              }}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              style={{ paddingRight: 48 }}
            />
            <button
              type="button"
              className="icon-btn"
              style={{ position: "absolute", right: 1, top: 1 }}
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? "Скрыть ключ" : "Показать ключ"}
            >
              {showKey ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
            </button>
          </div>
          <button className="btn btn--small" type="submit" disabled={key.trim() === st.apiKey}>
            Сохранить
          </button>
        </form>
        {keyMsg && (
          <p className={`status-line ${keyMsg.ok ? "status-line--ok" : "status-line--err"}`} role="status">
            {keyMsg.text}
          </p>
        )}
      </div>

      <div className="setting">
        <div className="setting__label">Резервная копия</div>
        <p className="setting__hint">
          Наборы и история хранятся только на этом устройстве. Сохраняй копию, чтобы не потерять прогресс.
        </p>
        <div className="setting__control" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn--small" onClick={() => void doExport()}>
            <Download size={18} strokeWidth={1.5} aria-hidden="true" />
            Сохранить копию
          </button>
          <button className="btn btn--small" onClick={() => file.current?.click()}>
            <Upload size={18} strokeWidth={1.5} aria-hidden="true" />
            Восстановить
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={(e) => void doImport(e.target.files?.[0])}
            tabIndex={-1}
          />
        </div>
        {ioMsg && (
          <p className={`status-line ${ioMsg.ok ? "status-line--ok" : "status-line--err"}`} role="status">
            {ioMsg.text}
          </p>
        )}
      </div>

      {s.known.length > 0 && (
        <div className="setting setting--row">
          <div>
            <div className="setting__label">Слова «знаю»</div>
            <p className="setting__hint num">
              {s.known.length} {plural(s.known.length, "слово", "слова", "слов")} больше не предлагаются.
            </p>
          </div>
          <button
            className="link-btn"
            onClick={() => {
              if (confirm("Снова предлагать слова, отмеченные как «знаю»?")) clearKnown();
            }}
          >
            Сбросить
          </button>
        </div>
      )}

      {!isStandalone() && (
        <div className="setting">
          <div className="setting__label">Как поставить на iPhone</div>
          <ol className="howto setting__control">
            <li>Открой Лексикон в Safari.</li>
            <li>Нажми «Поделиться» внизу экрана.</li>
            <li>Выбери «На экран „Домой“» и нажми «Добавить».</li>
          </ol>
        </div>
      )}

      <div className="setting">
        <div className="setting__label">Источники слов</div>
        <p className="setting__hint">
          Слова B2 и C1 отобраны из открытых списков CEFR-J Wordlist v1.5 (Yukio Tono, Токийский университет
          иностранных языков) и Octanove Vocabulary Profile C1/C2 (Octanove Labs, CC BY-SA 4.0). Переводы и примеры
          написаны для Лексикона.
        </p>
      </div>

      <div className="danger-zone">
        <button
          className="link-btn link-btn--danger"
          onClick={() => {
            if (confirm("Удалить все наборы, историю и настройки? Это нельзя отменить.")) resetAll();
          }}
        >
          Удалить все данные
        </button>
      </div>
    </div>
  );
}
