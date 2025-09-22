// src/main.tsx
import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./index.css";
import "./styles/themes.css";
import { GifLibraryProvider } from "./media/GifLibrary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GifLibraryProvider>
      <App />
    </GifLibraryProvider>
  </StrictMode>
);
