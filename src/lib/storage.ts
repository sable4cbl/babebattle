import type { BabeCard, EffectCard } from "../types/cards";
const LS_KEY = "card-game-tool-deck-v0.2";

export type DeckState = { babes: BabeCard[]; effects: EffectCard[] };

export function loadDeck(fallback: DeckState): DeckState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

export function saveDeck(state: DeckState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {}
}

export function clearDeckStorage() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}
