import "@fontsource/old-standard-tt/400.css";
import "@fontsource/old-standard-tt/700.css";
import "@fontsource/gentium-book-plus/400.css";
import "@fontsource/gentium-book-plus/400-italic.css";
import "@fontsource/gentium-book-plus/700.css";
import "./styles/global.css";
import "./styles/app.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import { loadState } from "./lib/storage";

void loadState();
registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
