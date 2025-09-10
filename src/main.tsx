import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./index.css";
import { GifLibraryProvider } from "./media/GifLibrary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GifLibraryProvider>
      <App />
    </GifLibraryProvider>
  </React.StrictMode>
);
