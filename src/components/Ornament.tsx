/** Printer's fleuron for the head rule: two hairlines and a lozenge. */
export function Fleuron() {
  return (
    <svg width="34" height="10" viewBox="0 0 34 10" aria-hidden="true">
      <path d="M1 5h10M23 5h10" stroke="currentColor" strokeWidth="1" />
      <path d="M17 1l4 4-4 4-4-4z" fill="currentColor" />
      <circle cx="11.5" cy="5" r="1.2" fill="currentColor" />
      <circle cx="22.5" cy="5" r="1.2" fill="currentColor" />
    </svg>
  );
}

/** Printed tick for the entry margin: a selected entry is marked like a proof correction. */
export function Tick({ on }: { on: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      {on ? (
        <path d="M3.5 11.5l5 5L19 4.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
      ) : (
        <rect x="4.5" y="4.5" width="13" height="13" fill="none" stroke="var(--rule-2)" strokeWidth="1" />
      )}
    </svg>
  );
}
