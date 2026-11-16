import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Fleuron } from "./Ornament";

interface Props {
  left?: ReactNode;
  right?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
}

/** The lexicon's running head: a guide word on each side of the fleuron, ruled underneath. */
export function Head({ left, right, onBack, backLabel = "Назад" }: Props) {
  return (
    <header className="head">
      <div className="head__row">
        <div className="head__l">
          {onBack ? (
            <button className="head__back" onClick={onBack} type="button">
              <ChevronLeft size={20} strokeWidth={1.5} aria-hidden="true" />
              {backLabel}
            </button>
          ) : (
            left
          )}
        </div>
        <div className="head__mid">
          <Fleuron />
        </div>
        <div className="head__r">{right}</div>
      </div>
    </header>
  );
}
