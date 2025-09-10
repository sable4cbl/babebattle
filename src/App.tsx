import React, { useMemo } from "react";
import DeckList, { type DeckTargetMode } from "./components/DeckList";
import PlayArea from "./components/PlayArea";
import DiscardPile from "./components/DiscardPile";

import { useTurn } from "./hooks/useTurn";
import { useDeck } from "./hooks/useDeck";
import { applyEffects } from "./engine/applyEffects";
import type { BabeCard, BoundDiscard, PlayedEffect } from "./types/cards";

export default function App() {
  const {
    playedBabes,
    playedEffects,
    selectedEffectId,
    setSelectedEffectId,
    computedLimits,
    canPlayBabe,
    canPlayEffect,
    playBabe,
    playEffect,
    bindEffect,
    resetTurn,
    endTurn,
    discard,
    setDiscard,
    returnDiscardToDeck,
    removePlayedBabe,
    removePlayedEffect,
  } = useTurn();

  // Hide cards that are in play or in discard
  const hiddenIds = useMemo(
    () =>
      new Set([
        ...playedBabes.map((b) => b.id),
        ...playedEffects.map((e) => e.id),
        ...discard.babes.map((b) => b.id),
        ...discard.effects.map((e) => e.id),
      ]),
    [playedBabes, playedEffects, discard]
  );

  const {
    deck,
    visibleBabes,
    visibleEffects,
    // We'll use add/remove programmatically (UI doesn't show remove buttons)
    addBabe,
    addEffect,
    removeBabe,
    removeEffect,
    setDeck,
  } = useDeck(hiddenIds);

  const resolution = applyEffects(playedBabes, playedEffects, computedLimits);

  const onReturnDiscardToDeck = () => {
    const ret = returnDiscardToDeck();
    setDeck((d) => ({
      babes: [...d.babes, ...ret.babes.filter((b) => !d.babes.some((x) => x.id === b.id))],
      effects: [...d.effects, ...ret.effects.filter((e) => !d.effects.some((x) => x.id === e.id))],
    }));
  };

  // -------- Discard-from-Deck Effect Targeting --------
  const selectedEffect: PlayedEffect | undefined = playedEffects.find(
    (e) => e.playId === selectedEffectId
  );

  const deckTargetMode: DeckTargetMode =
    selectedEffect && selectedEffect.kind === "discard-babes-add-final"
      ? {
          active: true,
          kind: "discard-babes-add-final",
          need: selectedEffect.discardCount ?? 0,
          already: selectedEffect.boundDiscards?.length ?? 0,
          type: selectedEffect.discardType || undefined,
        }
      : { active: false };

  // click a Babe in the Deck to bind/discard for the selected discard effect
  const onClickDeckBabeForDiscard = (b: BabeCard) => {
    const e = selectedEffect;
    if (!e || e.kind !== "discard-babes-add-final") return;
    const need = e.discardCount ?? 0;
    const already = e.boundDiscards?.length ?? 0;
    if (already >= need) return;
    if (e.discardType && b.type !== e.discardType) return;

    // 1) bind snapshot to effect
    const snapshot: BoundDiscard = { id: b.id, name: b.name, baseScore: b.baseScore, type: b.type };
    bindEffect(e.playId, {
      boundDiscards: [...(e.boundDiscards ?? []), snapshot],
    });

    // 2) move this babe from Deck -> Discard pile (mid-turn)
    removeBabe(b.id); // remove from deck state
    setDiscard((d) => ({ ...d, babes: [...d.babes, b] })); // add to discard pile (visible below play area)

    // Auto-exit targeting when reached required count
    if (already + 1 >= need) {
      setSelectedEffectId(null);
    }
  };

  // If a played discard effect is removed, return its babes from Discard -> Deck
  const handleRemovePlayedEffect = (playId: string) => {
    const e = playedEffects.find((x) => x.playId === playId);
    if (e && e.kind === "discard-babes-add-final" && e.boundDiscards?.length) {
      const ids = new Set(e.boundDiscards.map((d) => d.id));
      // 1) remove those babes from discard pile and add back to deck
      setDiscard((d) => {
        const returning = d.babes.filter((b) => ids.has(b.id));
        const remaining = d.babes.filter((b) => !ids.has(b.id));
        // add back to deck (only if not already there)
        setDeck((deck) => ({
          ...deck,
          babes: [
            ...deck.babes,
            ...returning.filter((b) => !deck.babes.some((x) => x.id === b.id)),
          ],
        }));
        return { ...d, babes: remaining };
      });
    }
    // 2) finally remove the effect from play
    removePlayedEffect(playId);
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Card Game Scoring Tool</h1>
          <p className="text-gray-600 mt-1">
            Cards you play are hidden from the Deck. Ending a turn sends them to Discard.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Deck only (now also used for discard-target selection) */}
          <div className="lg:col-span-1 space-y-6">
            <DeckList
              babes={visibleBabes}
              effects={visibleEffects}
              canPlayBabe={canPlayBabe}
              canPlayEffect={canPlayEffect}
              playBabe={playBabe}
              playEffect={playEffect}
              targetMode={deckTargetMode}
              onClickDeckBabe={onClickDeckBabeForDiscard}
            />
          </div>

          {/* Right column: Play area + Discard beneath it */}
          <div className="lg:col-span-2 space-y-6">
            <PlayArea
              playedBabes={playedBabes}
              playedEffects={playedEffects}
              babeScores={resolution.babeScores}
              computedLimits={computedLimits}
              selectedEffectId={selectedEffectId}
              onRemovePlayedBabe={removePlayedBabe}
              onRemovePlayedEffect={handleRemovePlayedEffect} // intercept to restore discards
              onBindEffect={bindEffect}
              onToggleSelectEffect={(e) => {
                const needsTarget =
                  e.kind === "multiply-babe" ||
                  (e.kind === "multiply-type" && !(e.boundTargetType || e.targetType)) ||
                  e.kind === "discard-babes-add-final"; // NEW: enter deck-target mode
                if (!needsTarget) return;
                setSelectedEffectId((cur) => (cur === e.playId ? null : e.playId));
              }}
              onClickBabeForTarget={(b) => {
                // remains for multiply-babe/multiply-type targeting in play area
                const e = playedEffects.find((x) => x.playId === selectedEffectId);
                if (!e) return;
                if (e.kind === "multiply-babe") {
                  bindEffect(e.playId, { boundTargetBabeId: b.playId });
                  setSelectedEffectId(null);
                } else if (e.kind === "multiply-type" && !(e.boundTargetType || e.targetType)) {
                  bindEffect(e.playId, { boundTargetType: b.type });
                  setSelectedEffectId(null);
                }
              }}
              onClearTurn={resetTurn}
              onEndTurn={endTurn}
              finalScore={resolution.finalScore}
              baseSum={resolution.baseSum}
              mutatedSum={resolution.mutatedSum}
              resolutionLog={resolution.log}
            />

            <DiscardPile
              babes={discard.babes}
              effects={discard.effects}
              onReturnAll={onReturnDiscardToDeck}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
