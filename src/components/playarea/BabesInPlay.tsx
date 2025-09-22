import React from "react";
import type { PlayedBabe, BabeCard } from "../../types/cards";
import type { BoundEffect, Limits, TargetDeck } from "../../types/effects";
import BabeBadge from "../BabeBadge";
import { getTypeEmoji } from "../../utils/typeEmoji";

type Props = {
  playedBabes: PlayedBabe[];
  playedEffects: BoundEffect[];
  limits?: Limits;
  targeting?: TargetDeck;
  targetingEffectName?: string;
  selectedTargetIds?: string[];
  onRemoveBabe: (id: string) => void;
  onBindEffect: (babeId: string) => void;
};

export default function BabesInPlay({ playedBabes, playedEffects, limits, targeting, targetingEffectName, selectedTargetIds, onRemoveBabe, onBindEffect }: Props) {
  return (
    <section>
      <div className="mb-2 text-sm font-semibold text-gray-700">
        Babes in play ({playedBabes.length})
        {limits && (
          <span className="ml-2 text-xs text-gray-500">
            Limit {limits.babes}
            {limits.extraBabesByType && Object.entries(limits.extraBabesByType).map(([t, n]) => (
              (n as number) > 0 ? <span key={t} className="ml-1">+{n as number} {getTypeEmoji(t as any)}</span> : null
            ))}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 justify-items-center">
        {playedBabes.map((b) => {
          const locking = playedEffects.filter(pe => (pe.boundTargetIds || []).includes(b.id));
          const isLocked = locking.length > 0;
          const lockReason = isLocked ? `Locked by ${locking.map(pe => pe.name).join(", ")}` : undefined;
          let isPlayTargeting = !!targeting && (targeting.kind === "one-babe" || targeting.kind === "many-babes") && ((targeting as any).from ?? "play") === "play";
          if (targetingEffectName === '69') isPlayTargeting = false;
          const tAnyPlay: any = targeting as any;
          const matches = !isPlayTargeting || !tAnyPlay?.ofType || b.type === tAnyPlay.ofType;
          const selIdx = selectedTargetIds ? selectedTargetIds.indexOf(b.id) : -1;
          const cls =
            "relative " +
            (isPlayTargeting && !matches ? "opacity-30 pointer-events-none " : "") +
            (isPlayTargeting && matches ? "z-50 ring-2 ring-blue-500 rounded pointer-events-auto " : "") +
            (selIdx >= 0 ? "ring-4 ring-green-500 " : "");
          return (
            <div key={b.id} className={cls}>
              {isLocked ? (
                <div
                  className="absolute left-1 top-1 z-10 text-[10px] px-1.5 py-0.5 rounded bg-gray-800/80 text-white shadow max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap"
                  title={lockReason}
                >
                  {lockReason}
                </div>
              ) : (
                <button
                  className="absolute left-1 top-1 z-10 text-xs px-1.5 py-0.5 bg-white/90 rounded border shadow-sm hover:bg-white"
                  onClick={() => onRemoveBabe(b.id)}
                  title="Send back to deck"
                  disabled={!!targeting}
                >
                  ×
                </button>
              )}
              <BabeBadge
                b={b as unknown as BabeCard}
                onClick={() => onBindEffect(b.id)}
                size={{ w: 200, h: 280 }}
              />
              {selIdx >= 0 && (
                <div className="absolute -top-2 -right-2 z-50 w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center shadow">
                  {selIdx + 1}
                </div>
              )}
            </div>
          );
        })}
        {playedBabes.length === 0 && (
          <div className="text-xs text-gray-500 col-span-2">No babes played yet.</div>
        )}
      </div>
    </section>
  );
}

