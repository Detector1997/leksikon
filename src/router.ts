import { useSyncExternalStore } from "react";
import type { TrainMode } from "./lib/types";

export type Route =
  | { name: "today" }
  | { name: "new" }
  | { name: "set"; id: string }
  | { name: "train"; scope: string; mode: TrainMode }
  | { name: "tracker" }
  | { name: "settings" };

const MODES: TrainMode[] = ["cards", "quiz", "typing", "mixed"];

export function parse(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  switch (parts[0]) {
    case "new":
      return { name: "new" };
    case "set":
      return parts[1] ? { name: "set", id: parts[1] } : { name: "today" };
    case "train": {
      const mode = (MODES as string[]).includes(parts[2]) ? (parts[2] as TrainMode) : "mixed";
      return { name: "train", scope: parts[1] ?? "due", mode };
    }
    case "tracker":
      return { name: "tracker" };
    case "settings":
      return { name: "settings" };
    default:
      return { name: "today" };
  }
}

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parse(hash);
}

export function navigate(path: string, { replace = false } = {}): void {
  const target = `#${path.startsWith("/") ? path : `/${path}`}`;
  if (replace) {
    history.replaceState(null, "", target);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = target;
  }
}

export function goBack(fallback = "/"): void {
  if (history.length > 1) history.back();
  else navigate(fallback, { replace: true });
}

/** Order of top-level screens, so a page passes left or right like turning forward or back. */
export function routeOrder(r: Route): number {
  return { today: 0, set: 0.5, new: 1, tracker: 2, settings: 3, train: 4 }[r.name];
}

export function routeKey(r: Route): string {
  switch (r.name) {
    case "set":
      return `set:${r.id}`;
    case "train":
      return `train:${r.scope}:${r.mode}`;
    default:
      return r.name;
  }
}
