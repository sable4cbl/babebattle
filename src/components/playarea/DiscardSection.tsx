import React from "react";
import type { BabeCard } from "../../types/cards";
import type { EffectScript, PendingNext, TargetDeck } from "../../types/effects";
import BabeBadge from "../BabeBadge";
import EffectBadge from "../EffectBadge";

type Props = {
  discard: { babes: BabeCard[]; effects: EffectScript[] };
  pendingNext?: PendingNext;
  targeting?: TargetDeck;
  targetingEffectName?: string;
  selectedTargetIds?: string[];
  onBindEffect: (babeId: string) => void;
  onReplayBabeFromDiscard?: (id: string) => void;
  onHoverShow: (src: string) => void;
  onHoverHide: () => void;
  onMouseMove: (ev: React.MouseEvent) => void;
};

export default function DiscardSection({ discard, pendingNext, targeting, targetingEffectName, selectedTargetIds, onBindEffect, onReplayBabeFromDiscard, onHoverShow, onHoverHide, onMouseMove }: Props) {
  return (
    <section>
      <div className="mb-2 text-sm font-semibold text-gray-700">
        Discard pile — Babes {discard.babes.length} & Effects {discard.effects.length}
      </div>

      {/* Babes */}
      {discard.babes.length > 0 ? (
        <div className="grid grid-cols-5 gap-2 mb-2">
          {[...discard.babes].slice().reverse().map((b) => {
            let isDiscardTargeting = !!targeting && (targeting.kind === "one-babe" || targeting.kind === "many-babes") && ((targeting as any).from ?? "play") === "discard";
            if (targetingEffectName === '69') isDiscardTargeting = false;
            if (targetingEffectName === 'Babe Swap') {
              isDiscardTargeting = isDiscardTargeting && (selectedTargetIds?.length === 1);
            }
            const tAny: any = targeting as any;
            const matches = !isDiscardTargeting || !tAny?.ofType || b.type === tAny.ofType;
            const selIdx = selectedTargetIds ? selectedTargetIds.indexOf(b.id) : -1;
            const canReplayNext = !!pendingNext?.replayBabeIds?.includes(b.id);
            const nextMult = pendingNext?.babeMultNext?.[b.id] ?? undefined;
            const clsBase = "rounded overflow-hidden border bg-white relative ";
            const cls = isDiscardTargeting
              ? clsBase + (!matches ? "opacity-30 pointer-events-none " : "z-50 ring-2 ring-blue-500 pointer-events-auto ") + (selIdx >= 0 ? "ring-4 ring-green-500 " : "")
              : clsBase + (canReplayNext ? "ring-2 ring-green-600 pointer-events-auto " : "opacity-40 pointer-events-none ");
            return (
              <div
                key={b.id}
                className={cls}
                style={{ width: 80, height: 112 }}
                onMouseEnter={(e) => {
                  const img = e.currentTarget.querySelector("img") as HTMLImageElement | null;
                  if (img) onHoverShow(img.src);
                }}
                onMouseMove={onMouseMove}
                onMouseLeave={onHoverHide}
              >
                <div
                  onClick={() => {
                    if (isDiscardTargeting) {
                      onHoverHide();
                      onBindEffect(b.id);
                    } else if (canReplayNext && onReplayBabeFromDiscard) {
                      onHoverHide();
                      onReplayBabeFromDiscard(b.id);
                    }
                  }}
                >
                  <BabeBadge b={b} size={{ w: 80, h: 112 }} />
                </div>
                {canReplayNext && !isDiscardTargeting && (
                  <div className="absolute left-1 top-1 z-10 text-[10px] px-1.5 py-0.5 rounded bg-green-600 text-white shadow" title="Playable for free next turn">
                    Playable
                  </div>
                )}
                {nextMult && nextMult > 1 && !isDiscardTargeting && (
                  <div className="absolute right-1 top-1 z-10 text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white shadow" title={`Multiplied x${nextMult} if played this turn`}>
                    x{nextMult}
                  </div>
                )}
                {selIdx >= 0 && (
                  <div className="absolute -top-2 -right-2 z-50 w-5 h-5 rounded-full bg-green-600 text-white text-[10px] flex items-center justify-center shadow">
                    {selIdx + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-gray-500 mb-2">No babes in discard.</div>
      )}

      {/* Effects */}
      {discard.effects.length > 0 ? (
        <div className="grid grid-cols-6 gap-2 mb-2">
          {[...discard.effects].slice().reverse().map((e) => (
            <div
              key={e.id}
              className="rounded overflow-hidden border bg-white opacity-40"
              style={{ width: 80, height: 112 }}
              onMouseEnter={(ev) => {
                const img = ev.currentTarget.querySelector("img") as HTMLImageElement | null;
                if (img) onHoverShow(img.src);
              }}
              onMouseMove={onMouseMove}
              onMouseLeave={onHoverHide}
            >
              <EffectBadge e={e} size={{ w: 80, h: 112 }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-500 mb-2">No effects in discard.</div>
      )}
    </section>
  );
}

