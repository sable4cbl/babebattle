import React from "react";
import type { PlayedBabe } from "../../types/cards";
import type { BoundEffect, TargetDeck } from "../../types/effects";
import EffectBadge from "../EffectBadge";
import { computeLimits } from "../../engine";

type Props = {
  playedEffects: BoundEffect[];
  playedBabes: PlayedBabe[];
  targeting?: TargetDeck;
  onRemoveEffect: (id: string) => void;
};

export default function EffectsInPlay({ playedEffects, playedBabes, targeting, onRemoveEffect }: Props) {
  return (
    <section>
      <div className="mb-2 text-sm font-semibold text-gray-700">
        Effects in play ({playedEffects.length})
      </div>
      <div className="grid grid-cols-2 gap-3 justify-items-center">
        {playedEffects.map((pe) => {
          const remaining = (playedEffects as BoundEffect[]).filter((e) => e.playId !== pe.playId);
          const lim = computeLimits(remaining);
          const overflow = Math.max(0, playedBabes.length - lim.babes);
          let capacity = 0;
          if (overflow > 0 && (lim as any).extraBabesByType) {
            const counts: Record<string, number> = {};
            for (const b of playedBabes) counts[b.type] = (counts[b.type] || 0) + 1;
            for (const [t, extra] of Object.entries((lim as any).extraBabesByType as Record<string, number>)) {
              const avail = typeof extra === 'number' ? extra : 0;
              capacity += Math.min(avail, counts[t] || 0);
            }
          }
          const locked = overflow > capacity;
          const lockReason = locked ? "Locked by babe limit" : "Send back to deck";
          return (
            <div key={pe.playId} className="relative">
              {locked ? (
                <div
                  className="absolute left-1 top-1 z-10 text-[10px] px-1.5 py-0.5 rounded bg-gray-800/80 text-white shadow max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap"
                  title={lockReason}
                >
                  {lockReason}
                </div>
              ) : (
                <button
                  className={
                    "absolute left-1 top-1 z-10 text-xs px-1.5 py-0.5 bg-white/90 rounded border shadow-sm hover:bg-white"
                  }
                  onClick={() => onRemoveEffect(pe.playId)}
                  title={lockReason}
                  disabled={!!targeting}
                >
                  ×
                </button>
              )}
              <EffectBadge e={pe} size={{ w: 200, h: 280 }} />
            </div>
          );
        })}
        {playedEffects.length === 0 && (
          <div className="text-xs text-gray-500 col-span-2">No effects played yet.</div>
        )}
      </div>
    </section>
  );
}

