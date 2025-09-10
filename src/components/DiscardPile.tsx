import React from "react";
import { BabeCard, EffectCard } from "../types/cards";
import CardShell from "./ui/CardShell";
import BabeBadge from "./BabeBadge";
import EffectBadge from "./EffectBadge";

export type DiscardTargetMode =
  | {
      active: true;
      kind: "use-discard-add-final" | "play-from-discard";
      need: number;
      already: number;
      type?: string;
      hasBabeSlots: boolean;
      allowBeyondBabeLimit: boolean;
    }
  | { active: false };

export default function DiscardPile({
  babes,
  effects,
  onReturnAll,
  targetMode = { active: false },
  onClickDiscardBabe,
  smallBabeTiles = false,
}: {
  babes: BabeCard[];
  effects: EffectCard[];
  onReturnAll: () => void;
  targetMode?: DiscardTargetMode;
  onClickDiscardBabe?: (b: BabeCard) => void;
  smallBabeTiles?: boolean;
}) {
  const targeting = targetMode.active;

  return (
    <CardShell>
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Discard</div>
        <button
          className="px-2 py-1 text-xs rounded-md border hover:bg-gray-100"
          onClick={onReturnAll}
          title="Return everything to the Deck"
        >
          Return all to Deck
        </button>
      </div>

      {/* Babes */}
      <div className="flex flex-wrap gap-3 mb-4">
        {babes.length === 0 ? (
          <div className="text-sm text-gray-500">No Babes in discard.</div>
        ) : (
          babes.map((b) => {
            const isMuted =
              targeting &&
              targetMode.kind === "use-discard-add-final" &&
              !!targetMode.type &&
              b.type !== targetMode.type;

            return (
              <div key={b.id} className="relative">
                <BabeBadge
                  b={b}
                  small={smallBabeTiles}
                  muted={isMuted}
                  onClick={
                    targeting && onClickDiscardBabe
                      ? () => onClickDiscardBabe(b)
                      : undefined
                  }
                />
              </div>
            );
          })
        )}
      </div>

      {/* Effects */}
      <div className="flex flex-wrap gap-3">
        {effects.length === 0 ? (
          <div className="text-sm text-gray-500">No Effects in discard.</div>
        ) : (
          effects.map((e) => <EffectBadge key={e.id} e={e} disabled />)
        )}
      </div>
    </CardShell>
  );
}
