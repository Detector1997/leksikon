import { BookOpen, BookPlus, CalendarDays, SlidersHorizontal } from "lucide-react";
import type { Route } from "../router";

const TABS = [
  { href: "#/", label: "Сегодня", Icon: BookOpen, match: ["today", "set"] },
  { href: "#/new", label: "Подбор", Icon: BookPlus, match: ["new"] },
  { href: "#/tracker", label: "Трекер", Icon: CalendarDays, match: ["tracker"] },
  { href: "#/settings", label: "Настройки", Icon: SlidersHorizontal, match: ["settings"] },
] as const;

export function TabBar({ route }: { route: Route }) {
  return (
    <nav className="tabbar" aria-label="Разделы">
      <div className="tabbar__inner">
        {TABS.map(({ href, label, Icon, match }) => {
          const active = (match as readonly string[]).includes(route.name);
          return (
            <a key={href} className="tab" href={href} aria-current={active ? "page" : undefined}>
              <Icon size={22} strokeWidth={1.5} aria-hidden="true" />
              <span className="tab__label sc">{label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
