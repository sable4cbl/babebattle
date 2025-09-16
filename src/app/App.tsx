import React, { useState } from "react";
import ImportDeckPanel from "../components/import/ImportDeckPanel";
import ErrorBoundary from "../components/core/ErrorBoundary";
import type { BabeCard } from "../types/cards";
import type { EffectScript } from "../types/effects";
import MainBoard from "./MainBoard";

export type DeckState = { babes: BabeCard[]; effects: EffectScript[] };

export default function App() {
  const [deck, setDeck] = useState<DeckState | null>(null);

  if (typeof window !== "undefined" && !(window as any).__appSafeLogger) {
    (window as any).__appSafeLogger = true;
    window.addEventListener("error", (e) =>
      console.error("window.onerror:", e.error || e.message || e)
    );
    window.addEventListener("unhandledrejection", (e) =>
      console.error("unhandledrejection:", e.reason)
    );
  }

  function setDeckSafe(next: DeckState) {
    const safe: DeckState = {
      babes: Array.isArray(next?.babes) ? next.babes : [],
      effects: Array.isArray(next?.effects) ? next.effects : [],
    };
    setDeck(safe);
  }

  return (
    <ErrorBoundary>
      {!deck ? (
        <div className="p-6 max-w-6xl mx-auto w-full">
          <h1 className="text-2xl font-bold mb-4">Import your Deck</h1>
          <ImportDeckPanel onImported={setDeckSafe} />
        </div>
      ) : (
        // ✅ MainBoard is where engine logic is hooked in
        <MainBoard deck={deck} setDeck={setDeck} />
      )}
    </ErrorBoundary>
  );
}
