import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./app/globals.css";
import TwitchEditor from "./components/TwitchEditor";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TwitchEditor />
  </StrictMode>,
);
