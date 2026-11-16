import { ArrowRight } from "lucide-react";
import { BoxBar } from "../components/BoxBar";
import { Head } from "../components/Head";
import { MONTHS_GEN, WEEKDAYS_SHORT, dayKey, weekKeys } from "../lib/dates";
import { boxCounts, dueWords } from "../lib/srs";
import { currentStreak, isComplete } from "../lib/streak";
import { useAppState } from "../lib/storage";
import { navigate } from "../router";
import { isStandalone } from "../lib/platform";

const WEEKDAYS_LONG = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export function Today() {
  const s = useAppState();
  const now = new Date();
  const today = dayKey(now);
  const goal = s.settings.dailyGoal;
  const log = s.days[today] ?? { answers: 0, correct: 0, newWords: 0 };
  const streak = currentStreak(s.days, goal, today);
  const due = dueWords(s.sets);
  const allWords = s.sets.flatMap((x) => x.words);
  const counts = boxCounts(allWords);
  const dueCounts = boxCounts(
    due.map((r) => s.sets.find((x) => x.id === r.setId)!.words.find((w) => w.id === r.wordId)!),
  );
  const progress = Math.min(1, log.correct / goal);

  return (
    <div className="page">
      <Head left={WEEKDAYS_LONG[now.getDay()]} right={`${now.getDate()} ${MONTHS_GEN[now.getMonth()]}`} />

      <section className="tally" aria-label="Серия и цель дня">
        <div>
          <div className="tally__num num">{streak}</div>
          <p className="tally__label">
            {plural(streak, "день", "дня", "дней")} подряд
          </p>
        </div>
        <div className="goal">
          <div className="goal__num num">
            {Math.min(log.correct, 999)}
            <span> / {goal}</span>
          </div>
          <div className="goal__rule" aria-hidden="true">
            <div className="goal__fill" style={{ transform: `scaleX(${progress})` }} />
          </div>
          <p className="goal__label">{progress >= 1 ? "цель дня выполнена" : "верных ответов сегодня"}</p>
        </div>
      </section>

      <Week days={s.days} goal={goal} />

      {s.sets.length === 0 ? (
        <FirstRun />
      ) : (
        <>
          <section className="plate" aria-labelledby="due-cap">
            <div className="plate__cap">
              <span id="due-cap" className="sc">
                К повторению
              </span>
              <span className="num">{allWords.length} в словаре</span>
            </div>
            {due.length > 0 ? (
              <div className="due">
                <div className="due__num num">{due.length}</div>
                <p className="due__text">
                  {plural(due.length, "слово ждёт", "слова ждут", "слов ждут")} повторения
                  {due.length > 20 ? ", за подход — первые 20" : ""}
                </p>
                <BoxBar counts={dueCounts} legend />
              </div>
            ) : (
              <div className="due">
                <div className="due__num num">0</div>
                <p className="due__text">Всё повторено. Следующие слова вернутся по расписанию.</p>
                <BoxBar counts={counts} legend />
              </div>
            )}
          </section>

          <h2 className="section-title">
            Наборы
            <small className="num">{s.sets.length}</small>
          </h2>
          <ul className="setlist">
            {s.sets.map((set) => {
              const c = boxCounts(set.words);
              const d = set.words.filter((w) => w.dueAt <= Date.now()).length;
              return (
                <li key={set.id}>
                  <button className="setrow" onClick={() => navigate(`/set/${set.id}`)}>
                    <div className="setrow__top">
                      <span className="setrow__title">{set.title}</span>
                      <span className="setrow__lvl">{set.level}</span>
                    </div>
                    <p className="setrow__meta num">
                      {set.words.length} {plural(set.words.length, "слово", "слова", "слов")}
                      {" · "}
                      {d > 0 ? <b>{d} к повтору</b> : `выучено ${c[4]}`}
                    </p>
                    <BoxBar counts={c} />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {!isStandalone() && <InstallNote />}

      {s.sets.length > 0 && (
        <div className="cta-dock">
          {due.length > 0 ? (
            <button className="btn btn--primary btn--block" onClick={() => navigate("/train/due/mixed")}>
              Тренировать
              <span className="btn__count num">{Math.min(due.length, 20)}</span>
            </button>
          ) : (
            <button className="btn btn--block" onClick={() => navigate("/new")}>
              Подобрать новые слова
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Week({ days, goal }: { days: ReturnType<typeof useAppState>["days"]; goal: number }) {
  const keys = weekKeys();
  const today = dayKey();
  return (
    <div className="week" role="list" aria-label="Эта неделя">
      {keys.map((k, i) => {
        const log = days[k];
        const done = isComplete(log, goal);
        const part = !done && (log?.answers ?? 0) > 0;
        const future = k > today;
        return (
          <div key={k} className="week__day" role="listitem" data-today={k === today}>
            <span className="sc">{WEEKDAYS_SHORT[i]}</span>
            <DayMark done={done} part={part} future={future} />
            <span className="visually-hidden">{done ? "цель выполнена" : part ? "занимался" : "без занятий"}</span>
          </div>
        );
      })}
    </div>
  );
}

function DayMark({ done, part, future }: { done: boolean; part: boolean; future: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      {done ? (
        <circle cx="9" cy="9" r="7" fill="var(--vermilion)" />
      ) : part ? (
        <>
          <circle cx="9" cy="9" r="6.5" fill="none" stroke="var(--vermilion)" strokeWidth="1.5" />
          <path d="M9 2.5a6.5 6.5 0 0 1 0 13z" fill="var(--vermilion)" />
        </>
      ) : (
        <circle cx="9" cy="9" r="6.5" fill="none" stroke={future ? "var(--rule)" : "var(--rule-2)"} strokeWidth="1" />
      )}
    </svg>
  );
}

function FirstRun() {
  return (
    <section className="state state--left">
      <h2>Словарь пока пуст</h2>
      <p className="lede">
        Лексикон сам предложит 20 слов твоего уровня. Отметь те, что хочешь выучить, — из них получится набор для
        тренировки. Новый набор можно собрать в любой момент.
      </p>
      <button className="btn btn--primary btn--block" onClick={() => navigate("/new")}>
        Подобрать первые 20 слов
        <ArrowRight size={20} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </section>
  );
}

function InstallNote() {
  return (
    <aside className="notice">
      <p>
        <b>Поставь на экран «Домой».</b> В Safari нажми «Поделиться», затем «На экран „Домой“». Так Лексикон
        откроется без адресной строки и будет работать без интернета.
      </p>
    </aside>
  );
}
