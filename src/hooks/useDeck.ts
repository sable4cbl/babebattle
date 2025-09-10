import { useEffect, useMemo, useState } from "react";
import type { BabeCard, EffectCard } from "../types/cards";
import { SAMPLE_BABES, SAMPLE_EFFECTS } from "../data/samples";
import { loadDeck, saveDeck, type DeckState } from "../lib/storage";

export function useDeck(hiddenIds: Set<string>) {
  const [deck, setDeck] = useState<DeckState>(() =>
    loadDeck({ babes: SAMPLE_BABES, effects: SAMPLE_EFFECTS })
  );

  useEffect(() => saveDeck(deck), [deck]);

  const visibleBabes = useMemo(
    () => deck.babes.filter((b) => !hiddenIds.has(b.id)),
    [deck.babes, hiddenIds]
  );
  const visibleEffects = useMemo(
    () => deck.effects.filter((e) => !hiddenIds.has(e.id)),
    [deck.effects, hiddenIds]
  );

  const addBabe = (b: Partial<BabeCard>) => {
    const n: BabeCard = {
      id: b.id || (crypto as any).randomUUID?.() || Math.random().toString(36).slice(2),
      name: b.name || "New Babe",
      type: (b.type as any) || "Any",
      baseScore: b.baseScore ?? 1,
      img: b.img,
    };
    setDeck((d) => ({ ...d, babes: [...d.babes, n] }));
  };

  const addEffect = (e: Partial<EffectCard>) => {
    const n: EffectCard = {
      id: e.id || (crypto as any).randomUUID?.() || Math.random().toString(36).slice(2),
      name: e.name || "New Effect",
      kind: (e.kind as any) || "add-final",
      factor: e.factor,
      add: e.add,
      description: e.description,
      targetBabeId: e.targetBabeId,
      targetType: e.targetType,
      extraBabes: e.extraBabes,
      extraEffects: e.extraEffects,
      // priority removed
      discardCount: (e as any).discardCount, // optional for discard-babes-add-final
      discardType: (e as any).discardType,
    };
    setDeck((d) => ({ ...d, effects: [...d.effects, n] }));
  };

  const removeBabe = (id: string) =>
    setDeck((d) => ({ ...d, babes: d.babes.filter((x) => x.id !== id) }));
  const removeEffect = (id: string) =>
    setDeck((d) => ({ ...d, effects: d.effects.filter((x) => x.id !== id) }));

  return { deck, visibleBabes, visibleEffects, addBabe, addEffect, removeBabe, removeEffect, setDeck };
}
