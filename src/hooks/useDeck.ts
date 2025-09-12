import { useEffect, useMemo, useState } from "react";
import type { BabeCard, EffectCard } from "../types/cards";

const STORAGE_KEY = "card-game-tool-deck-v3"; // bumped! starts empty for everyone

type Deck = { babes: BabeCard[]; effects: EffectCard[] };

export function useDeck(hiddenIds: Set<string>) {
  const [deck, setDeck] = useState<Deck>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as Deck;
    } catch {}
    return { babes: [], effects: [] };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
    } catch {}
  }, [deck]);

  const visibleBabes = useMemo(
    () => deck.babes.filter((b) => !hiddenIds.has(b.id)),
    [deck.babes, hiddenIds]
  );
  const visibleEffects = useMemo(
    () => deck.effects.filter((e) => !hiddenIds.has(e.id)),
    [deck.effects, hiddenIds]
  );

  function removeBabe(id: string) {
    setDeck((d) => ({ ...d, babes: d.babes.filter((b) => b.id !== id) }));
  }

  function removeEffect(id: string) {
    setDeck((d) => ({ ...d, effects: d.effects.filter((e) => e.id !== id) }));
  }

  return {
    visibleBabes,
    visibleEffects,
    setDeck,
    removeBabe,
    removeEffect,
  };
}
