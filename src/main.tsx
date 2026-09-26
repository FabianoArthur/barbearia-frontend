import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { api } from "./lib/api";

async function start() {
  // Static check: in a normal build Vite replaces it with `false` and the
  // demo module is dropped from the bundle entirely.
  if (import.meta.env.VITE_DEMO === "true") {
    const { installDemo } = await import("./demo/install");
    installDemo(api);
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
