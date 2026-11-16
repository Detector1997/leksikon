import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { TabBar } from "./components/TabBar";
import { flush, useAppState, useLoaded } from "./lib/storage";
import { routeKey, routeOrder, useRoute } from "./router";
import { NewSet } from "./screens/NewSet";
import { SetDetail } from "./screens/SetDetail";
import { Settings } from "./screens/Settings";
import { Today } from "./screens/Today";
import { Tracker } from "./screens/Tracker";
import { Session } from "./train/Session";

export function App() {
  const route = useRoute();
  const loaded = useLoaded();
  const theme = useAppState().settings.theme;
  const reduce = useReducedMotion();
  const prevOrder = useRef(routeOrder(route));
  const order = routeOrder(route);
  // A page passes in from the side it lies on, like turning forward or back.
  const dir = order >= prevOrder.current ? 1 : -1;

  useEffect(() => {
    prevOrder.current = order;
    window.scrollTo(0, 0);
  }, [order, routeKey(route)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  if (!loaded) return <div className="app" aria-busy="true" />;

  const training = route.name === "train";
  let screen;
  switch (route.name) {
    case "today":
      screen = <Today />;
      break;
    case "new":
      screen = <NewSet />;
      break;
    case "set":
      screen = <SetDetail id={route.id} />;
      break;
    case "train":
      screen = <Session scope={route.scope} mode={route.mode} />;
      break;
    case "tracker":
      screen = <Tracker />;
      break;
    case "settings":
      screen = <Settings />;
      break;
  }

  return (
    <div className={`app${training ? " app--bare" : ""}`}>
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.main
          key={routeKey(route)}
          className="screen"
          custom={dir}
          variants={reduce ? undefined : PAGE}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          {screen}
        </motion.main>
      </AnimatePresence>
      {!training && <TabBar route={route} />}
    </div>
  );
}

/**
 * A page passes like a leaf of the lexicon: going forward, the new page slides over
 * from the right while the old one gives way; going back, the top page lifts off to the right.
 */
const PAGE = {
  enter: (d: number) => (d > 0 ? { x: "100%", zIndex: 2 } : { x: "-28%", zIndex: 0 }),
  center: { x: 0, zIndex: 1 },
  exit: (d: number) => (d > 0 ? { x: "-28%", zIndex: 0 } : { x: "100%", zIndex: 2 }),
};
