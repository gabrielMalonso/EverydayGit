import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource-variable/inter";
import "./styles.css";
import { isDemoMode } from "./demo/demoMode";
import { initDemoState } from "./demo/initDemoState";
import "./i18n";

if (isDemoMode()) {
  initDemoState();
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
