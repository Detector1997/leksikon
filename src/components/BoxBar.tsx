import { BOX_LABELS, type Box } from "../lib/types";

const BOXES: Box[] = [0, 1, 2, 3, 4];

export function BoxBar({ counts, legend = false }: { counts: number[]; legend?: boolean }) {
  const total = counts.reduce((a, b) => a + b, 0);
  return (
    <>
      <div className={`boxbar${total === 0 ? " boxbar--empty" : ""}`} role="img" aria-label={describe(counts)}>
        {total > 0 &&
          BOXES.map((b) =>
            counts[b] ? (
              <div key={b} className="boxbar__seg" style={{ flexGrow: counts[b], background: `var(--box-${b})` }} />
            ) : null,
          )}
      </div>
      {legend && (
        <div className="boxlegend num" aria-hidden="true">
          {BOXES.map((b) => (
            <span key={b}>
              <i className="swatch" style={{ background: `var(--box-${b})` }} />
              <b>{counts[b]}</b>
              <small>{b === 0 ? "нов." : b === 4 ? "выуч." : BOX_LABELS[b]}</small>
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function describe(c: number[]) {
  return `Новых ${c[0]}, ступень I — ${c[1]}, II — ${c[2]}, III — ${c[3]}, выучено ${c[4]}`;
}
