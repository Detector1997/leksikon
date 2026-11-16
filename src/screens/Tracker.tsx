import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Head } from "../components/Head";
import { MONTHS, WEEKDAYS_SHORT, addDays, dayKey } from "../lib/dates";
import { boxCounts } from "../lib/srs";
import { bestStreak, currentStreak, isComplete } from "../lib/streak";
import { useAppState } from "../lib/storage";
import { plural } from "./Today";

export function Tracker() {
  const s = useAppState();
  const goal = s.settings.dailyGoal;
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const today = dayKey(now);

  const words = s.sets.flatMap((x) => x.words);
  const counts = boxCounts(words);
  const streak = currentStreak(s.days, goal, today);
  const best = bestStreak(s.days, goal);
  const totals = Object.values(s.days).reduce(
    (a, d) => ({ answers: a.answers + d.answers, correct: a.correct + d.correct }),
    { answers: 0, correct: 0 },
  );
  const accuracy = totals.answers ? Math.round((totals.correct / totals.answers) * 100) : 0;

  // Month grid, Monday first.
  const first = new Date(cursor.y, cursor.m, 1);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: { key: string; day: number; out: boolean }[] = [];
  for (let i = 0; i < offset; i++) cells.push({ key: `pre-${i}`, day: 0, out: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ key: dayKey(new Date(cursor.y, cursor.m, d)), day: d, out: false });
  const monthDone = cells.filter((c) => !c.out && isComplete(s.days[c.key], goal)).length;
  const isCurrentMonth = cursor.y === now.getFullYear() && cursor.m === now.getMonth();

  // Last fourteen days of correct answers.
  const recent = Array.from({ length: 14 }, (_, i) => {
    const k = dayKey(addDays(now.getTime(), i - 13));
    return { k, d: Number(k.slice(-2)), v: s.days[k]?.correct ?? 0 };
  });
  const peak = Math.max(goal * 1.25, ...recent.map((r) => r.v), 1);

  const shift = (n: number) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <div className="page">
      <Head left="Трекер" right={`${MONTHS[now.getMonth()]} ${now.getFullYear()}`} />
      <h1 className="title">Каждый день</h1>
      <p className="lede">
        День засчитан, когда набрано {goal} {plural(goal, "верный ответ", "верных ответа", "верных ответов")}.
      </p>

      <dl className="ledger num">
        <div>
          <dt>Серия сейчас</dt>
          <dd>
            {streak} {plural(streak, "день", "дня", "дней")}
          </dd>
        </div>
        <div>
          <dt>Лучшая серия</dt>
          <dd>
            {best} {plural(best, "день", "дня", "дней")}
          </dd>
        </div>
        <div>
          <dt>Выучено слов</dt>
          <dd>
            {counts[4]} из {words.length}
          </dd>
        </div>
        <div>
          <dt>Верных ответов</dt>
          <dd>{accuracy}%</dd>
        </div>
      </dl>

      <section className="plate" aria-label="Календарь">
        <div className="plate__cap cal__nav">
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="Предыдущий месяц">
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <span className="cal__month">
            {MONTHS[cursor.m][0].toUpperCase() + MONTHS[cursor.m].slice(1)} {cursor.y}
          </span>
          <button
            className="icon-btn"
            onClick={() => shift(1)}
            aria-label="Следующий месяц"
            disabled={isCurrentMonth}
            style={{ opacity: isCurrentMonth ? 0.3 : 1 }}
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="cal num" role="grid" aria-label={`${MONTHS[cursor.m]} ${cursor.y}`}>
          {WEEKDAYS_SHORT.map((w) => (
            <div key={w} className="cal__wd sc" role="columnheader">
              {w}
            </div>
          ))}
          {cells.map((c) => {
            if (c.out) return <div key={c.key} className="cal__d" aria-hidden="true" />;
            const log = s.days[c.key];
            const state = isComplete(log, goal) ? "done" : (log?.answers ?? 0) > 0 ? "part" : undefined;
            return (
              <div
                key={c.key}
                className="cal__d"
                role="gridcell"
                data-state={state}
                data-today={c.key === today}
                data-out={c.key > today}
                aria-label={`${c.day}: ${state === "done" ? "цель выполнена" : state === "part" ? `${log!.correct} верных` : "нет занятий"}`}
              >
                {c.day}
              </div>
            );
          })}
        </div>
        <p className="plate__cap" style={{ marginTop: 12, marginBottom: 0 }}>
          <span>
            <i className="swatch" style={{ background: "var(--vermilion)" }} /> цель выполнена{" "}
            <i className="swatch" style={{ boxShadow: "inset 0 0 0 1.5px var(--vermilion)", marginLeft: 10 }} /> начато
          </span>
          <span className="num">
            {monthDone} {plural(monthDone, "день", "дня", "дней")}
          </span>
        </p>
      </section>

      <section className="plate" aria-label="Верные ответы за две недели">
        <div className="plate__cap">
          <span className="sc">Верные ответы за 14 дней</span>
          <span className="num">цель {goal}</span>
        </div>
        <div className="chart" aria-hidden="true">
          <div className="chart__goal" style={{ bottom: `${(goal / peak) * 100}%` }} />
          {recent.map((r) => (
            <div
              key={r.k}
              className="chart__bar"
              data-hit={r.v >= goal}
              style={{ height: `${(r.v / peak) * 100}%` }}
              title={`${r.v}`}
            />
          ))}
        </div>
        <div className="chart__axis num" aria-hidden="true">
          {recent.map((r, i) => (
            <span key={r.k}>{i % 2 === 1 || i === 13 ? r.d : ""}</span>
          ))}
        </div>
        <table className="visually-hidden">
          <tbody>
            {recent.map((r) => (
              <tr key={r.k}>
                <th>{r.k}</th>
                <td>{r.v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
