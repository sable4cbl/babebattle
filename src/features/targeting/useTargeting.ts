import { useEffect, useMemo, useState } from "react";
import type {
  BabeCard,
  EffectCard,
  PlayedBabe,
  PlayedEffect,
} from "../../types/cards";

/** Helpers to detect special effect behaviors */
function needsPlayedBabeTarget(e: EffectCard | PlayedEffect) {
  return e.kind === "multiply-babe" && !!e.targetType && !e.targetBabeId && !e.targetName;
}
function needsDeckDiscardsDifferentTypes(e: EffectCard | PlayedEffect) {
  return e.kind === "discard-different-then-multiply-final";
}

type UseTargetingParams = {
  playedBabes: PlayedBabe[];
  visibleBabes: BabeCard[];
  /** Effects API from useTurn */
  playEffect: (e: EffectCard) => PlayedEffect | null;
  bindEffect: (playId: string, updates: Partial<PlayedEffect>) => void;
  /** Deck/Discard mutators */
  setDiscard: React.Dispatch<
    React.SetStateAction<{ babes: BabeCard[]; effects: EffectCard[] }>
  >;
  removeBabe: (id: string) => void;
  /** Full list of played effects (to derive selected one) */
  playedEffects?: PlayedEffect[];
};

export function useTargeting({
  playedBabes,
  visibleBabes,
  playEffect,
  bindEffect,
  setDiscard,
  removeBabe,
  playedEffects = [],
}: UseTargetingParams) {
  /** Draft effect (not played yet) waiting for a PLAYED-babe target */
  const [pendingEffect, setPendingEffect] = useState<EffectCard | null>(null);
  /** In-play effect selected for DECK/DISCARD targeting (e.g., Trifecta) */
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(null);

  // ESC cancels any targeting
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cancel() {
    setPendingEffect(null);
    setSelectedEffectId(null);
  }

  /** Derived — currently selected in-play effect (for deck targeting) */
  const selectedEffect: PlayedEffect | undefined = useMemo(
    () => playedEffects.find((x) => x.playId === selectedEffectId),
    [playedEffects, selectedEffectId]
  );

  /** Can we start targeting for a given effect? */
  function canStartTargeting(e: EffectCard) {
    if (needsPlayedBabeTarget(e)) {
      // must have at least one played babe of the required type
      return playedBabes.some((b) => b.type === e.targetType);
    }
    if (needsDeckDiscardsDifferentTypes(e)) {
      // need 3 deck babes with all-different types
      const types = new Set(visibleBabes.map((b) => b.type));
      return types.size >= 3;
    }
    return true;
  }

  /** Start "played babe target" flow (do not play yet) */
  function startPendingPlayedBabe(effect: EffectCard) {
    setPendingEffect(effect);
  }

  /** Start "deck different types" flow from a just-played effect */
  function startDeckTargeting(effectPlayId: string) {
    setSelectedEffectId(effectPlayId);
  }

  /** Click a PLAYED babe when pendingEffect wants a target */
  function onClickBabeForTarget(b: PlayedBabe) {
    if (!pendingEffect) return;
    const pe = playEffect(pendingEffect);
    if (!pe) {
      cancel();
      return;
    }
    if (pe.kind === "multiply-babe") {
      bindEffect(pe.playId, { boundTargetBabeId: b.playId });
    }
    setPendingEffect(null);
  }

  /** Taken types for the "discard different types" (to dim duplicates) */
  const takenTypes = useMemo(() => {
    if (!selectedEffect || !needsDeckDiscardsDifferentTypes(selectedEffect))
      return new Set<string>();
    return new Set((selectedEffect.boundDiscards ?? []).map((d) => d.type));
  }, [selectedEffect]);

  /** Deck targeting mode for BabeDeck */
  const deckTargetMode = useMemo(() => {
    if (!selectedEffect || !needsDeckDiscardsDifferentTypes(selectedEffect)) {
      return { active: false as const };
    }
    return {
      active: true as const,
      kind: "discard-babes-add-final" as const,
      need: selectedEffect.discardCount ?? 3,
      already: selectedEffect.boundDiscards?.length ?? 0,
      type: undefined as undefined,
      takenTypes,
    };
  }, [selectedEffect, takenTypes]);

  /** Click a DECK babe during Trifecta targeting */
  function onClickDeckBabe(b: BabeCard) {
    const e = selectedEffect;
    if (!e || !needsDeckDiscardsDifferentTypes(e)) return;

    const need = e.discardCount ?? 3;
    const already = e.boundDiscards?.length ?? 0;
    if (already >= need) return;

    // Must be a new type
    const used = new Set((e.boundDiscards ?? []).map((d) => d.type));
    if (used.has(b.type)) return;

    const snapshot = { id: b.id, name: b.name, baseScore: b.baseScore, type: b.type };
    bindEffect(e.playId, { boundDiscards: [...(e.boundDiscards ?? []), snapshot] });

    // Move the selected babe from DECK to DISCARD
    removeBabe(b.id);
    setDiscard((d) => ({ ...d, babes: [...d.babes, b] }));

    if (already + 1 >= need) setSelectedEffectId(null);
  }

  /** Overlay visible if any targeting is active */
  const showOverlay =
    (!!pendingEffect && needsPlayedBabeTarget(pendingEffect)) ||
    (!!selectedEffect && needsDeckDiscardsDifferentTypes(selectedEffect));

  return {
    // state
    pendingEffect,
    selectedEffectId,
    selectedEffect,
    // flows
    canStartTargeting,
    startPendingPlayedBabe,
    startDeckTargeting,
    cancel,
    // handlers
    onClickBabeForTarget,
    onClickDeckBabe,
    // UI
    deckTargetMode,
    takenTypes,
    showOverlay,
  };
}
