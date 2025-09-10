import React, { useMemo, useState } from "react";

import BabeDeck from "../components/BabeDeck";
import EffectsList from "../components/EffectsList";
import PlayArea from "../components/PlayArea";
import DiscardPile from "../components/DiscardPile";
import GifImportPanel from "../components/GifImportPanel";
import Modal from "../components/Modal";
import TargetingOverlay from "./TargetingOverlay";

import { useTurn } from "../hooks/useTurn";
import { useDeck } from "../hooks/useDeck";
import { applyEffects } from "../engine/applyEffects";
import { effectEligibility } from "../engine/conditions";

import { useTargeting } from "../features/targeting/useTargeting";
import { useEffectPlay } from "../features/effects/useEffectPlay";
import { useTurnHandlers } from "../features/turn/useTurnHandlers";

export default function App() {
  const {
    turnNumber,
    pendingNext,
    playedBabes,
    playedEffects,
    computedLimits,
    strokesThisTurn,
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

  const [showGifModal, setShowGifModal] = useState(false);

  // Hide used cards from Deck
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

  const { visibleBabes, visibleEffects, removeBabe, setDeck } = useDeck(hiddenIds);

  // Targeting hook (pending/selected flows)
  const targeting = useTargeting({
    playedBabes,
    visibleBabes,
    playEffect,
    bindEffect,
    setDiscard,
    removeBabe,
    playedEffects,
  });

  // Effects click handler
  const { onClickEffect } = useEffectPlay({
    targeting,
    playedBabes,
    visibleBabes,
    discard,
    playEffect,
  });

  // Turn helpers (undo Trifecta discards, return-all)
  const { handleRemovePlayedEffect, onReturnDiscardToDeck } = useTurnHandlers({
    playedEffects,
    setDiscard,
    setDeck,
    removePlayedEffect,
    returnDiscardToDeck,
    onExitTargeting: (playId) => {
      if (targeting.selectedEffectId === playId) targeting.cancel();
    },
  });

  // Scoring
  const resolution = applyEffects(playedBabes, playedEffects, computedLimits, {
    addNext: pendingNext.addNext,
    multNext: pendingNext.multNext,
  });

  // Eligibility map for effects list
  const effectEligibilityMap = useMemo(() => {
    const map = new Map<string, { ok: boolean; reason?: string }>();
    for (const e of visibleEffects) {
      const elig = effectEligibility(e, {
        playedBabes,
        discardBabes: discard.babes,
      });

      if (e.kind === "multiply-babe" && e.targetType && !playedBabes.some((b) => b.type === e.targetType)) {
        map.set(e.id, { ok: false, reason: "Needs a Babe in play" });
        continue;
      }
      if (e.kind === "discard-different-then-multiply-final") {
        const needed = e.discardCount ?? 3;
        const types = new Set(visibleBabes.map((b) => b.type));
        if (types.size < needed) {
          map.set(e.id, { ok: false, reason: `Need ${needed} different types in Deck` });
          continue;
        }
      }

      map.set(e.id, elig);
    }
    return map;
  }, [visibleEffects, playedBabes, visibleBabes, discard.babes]);

  const showOverlay = targeting.showOverlay;

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Card Game Scoring Tool</h1>
          <p className="text-gray-600 mt-1">
            Left: Babes • Middle: Play & Discard • Right: Effects. Press <kbd>Esc</kbd> to cancel targeting.
          </p>
        </header>

        {/* Equal columns */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 relative">
          {/* LEFT: Babes */}
          <div className="space-y-6 relative">
            <BabeDeck
              babes={visibleBabes}
              canPlayBabe={true}
              playBabe={playBabe}
              title="Babes (Deck)"
              onOpenGifLibrary={() => setShowGifModal(true)}
              targetMode={targeting.deckTargetMode}
              onClickDeckBabe={targeting.onClickDeckBabe}
            />
          </div>

          {/* MIDDLE: Play area + Discard */}
          <div className="space-y-6 relative">
            <PlayArea
              turnNumber={turnNumber}
              strokesThisTurn={strokesThisTurn}
              pendingNext={{ addNext: pendingNext.addNext, multNext: pendingNext.multNext }}
              playedBabes={playedBabes}
              playedEffects={playedEffects}
              babeScores={resolution.babeScores}
              computedLimits={computedLimits}
              pendingEffectName={targeting.pendingEffect?.name}
              pendingEffectTargetType={
                targeting.pendingEffect && targeting.pendingEffect.targetType
                  ? (targeting.pendingEffect.targetType as string)
                  : null
              }
              onClickBabeForTarget={targeting.onClickBabeForTarget}
              onRemovePlayedBabe={removePlayedBabe}
              onRemovePlayedEffect={handleRemovePlayedEffect}
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
              targetMode={{ active: false }}
              smallBabeTiles
            />
          </div>

          {/* RIGHT: Effects */}
          <div className="space-y-6 relative">
            <EffectsList
              effects={visibleEffects}
              canPlayEffect={true}
              canStartTargeting={targeting.canStartTargeting}
              onClickEffect={onClickEffect}
              effectEligibilityMap={effectEligibilityMap}
              title="Effects (Deck)"
            />
          </div>
        </div>
      </div>

      {/* Global overlay (z-40). Deck gets z-[60] while targeting, so only deck stays bright/clickable. */}
      {showOverlay && <TargetingOverlay onCancel={targeting.cancel} />}

      {/* GIF Library modal */}
      <Modal open={showGifModal} onClose={() => setShowGifModal(false)} title="GIF Library">
        <GifImportPanel />
      </Modal>
    </div>
  );
}
