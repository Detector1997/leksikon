import { useEffect, useState } from "react";

/**
 * Guide words, as at the head of a dictionary page: the first and last entry
 * currently in view, recomputed as the list passes under the head rule.
 */
export function useGuideWords(deps: unknown[]): [string, string] {
  const [words, setWords] = useState<[string, string]>(["", ""]);

  useEffect(() => {
    const visible = new Map<number, string>();
    const update = () => {
      if (visible.size === 0) return;
      const idx = [...visible.keys()].sort((a, b) => a - b);
      setWords([visible.get(idx[0])!, visible.get(idx[idx.length - 1])!]);
    };
    const io = new IntersectionObserver(
      (records) => {
        for (const r of records) {
          const el = r.target as HTMLElement;
          const i = Number(el.dataset.index);
          if (r.isIntersecting) visible.set(i, el.dataset.guide ?? "");
          else visible.delete(i);
        }
        update();
      },
      // Exclude the sticky head rule above and the tab bar below.
      { rootMargin: "-64px 0px -120px 0px", threshold: 0.5 },
    );
    document.querySelectorAll<HTMLElement>("[data-guide]").forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return words;
}
