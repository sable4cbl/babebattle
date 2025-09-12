import React, { useMemo } from "react";
import BabeDeck from "../components/BabeDeck";
import EffectDeck from "../components/EffectDeck";
import PlayArea from "../components/PlayArea";
import { useTurn } from "../hooks/useTurn";
import type { BabeCard } from "../types/cards";
import type { EffectScript } from "../types/effects";

type DeckState = { babes: BabeCard[]; effects: EffectScript[] };

type Props = {
  deck: DeckState;
  setDeck: React.Dispatch<React.SetStateAction<DeckState | null>>;
};

export default function MainBoard({ deck, setDeck }: Props) {
  const turn = useTurn({
    getDeckBabes: () => deck.babes,
    setDeckBabes: (updater) =>
      setDeck((prev) => (prev ? { ...prev, babes: updater(prev.babes) } : prev)),

    getDeckEffects: () => deck.effects,
    setDeckEffects: (updater) =>
      setDeck((prev) => (prev ? { ...prev, effects: updater(prev.effects) } : prev)),
  });

  const playedBabesForPlayArea = useMemo(
    () => turn.playedBabes.map((b) => ({ ...b, playId: b.id } as any)),
    [turn.playedBabes]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      {/* LEFT: Babes (deck zone) */}
      <div className="min-h-screen overflow-y-auto">
        <BabeDeck
          babes={deck.babes}
          canPlayBabe={turn.playedBabes.length < turn.computedLimits.babes}
          playBabe={turn.playBabe}
        />
      </div>

      {/* CENTER: Play Area */}
      <div className="lg:col-span-1">
        <div className="sticky top-0 z-30">
          <div className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border rounded-xl p-3 shadow">
            <PlayArea
              turnNumber={turn.turnNumber}
              strokesThisTurn={turn.strokesThisTurn}
              pendingNext={turn.pendingNext}
              playedBabes={playedBabesForPlayArea}
              playedEffects={turn.playedEffects as any}
              onRemoveBabe={(id: string) => turn.removePlayedBabe(id)}
              onRemoveEffect={(id: string) => turn.removePlayedEffect(id)}
              onBindEffect={(babeId: string) => turn.bindEffect(babeId)}
              discard={turn.discard}
              onReturnDiscardToDeck={turn.returnDiscardToDeck}
              onReset={turn.resetTurn}
              onEndTurn={turn.endTurn}
              finalScore={turn.finalScore}
              resolutionLog={[]}
            />
          </div>
        </div>
      </div>

      {/* RIGHT: Effects (deck zone) */}
      <div className="min-h-screen overflow-y-auto">
        <EffectDeck
          effects={deck.effects}
          canPlayEffect={turn.playedEffects.length < turn.computedLimits.effects}
          playEffect={turn.playEffect}
        />
      </div>
    </div>
  );
}
