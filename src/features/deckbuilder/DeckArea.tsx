import React from "react";
import type { BabeCard } from "../../types/cards";
import type { EffectScript } from "../../types/effects";
import BabeBadge from "../../components/BabeBadge";
import EffectBadge from "../../components/EffectBadge";

type Item =
  | { key: string; kind: "babe"; b: BabeCard }
  | { key: string; kind: "effect"; e: EffectScript };

type Props = {
  items: Item[];
  onRemoveBabe: (id: string) => void;
  onRemoveEffect: (id: string) => void;
};

export default function DeckArea({ items, onRemoveBabe, onRemoveEffect }: Props) {
  return (
    <section className="w-full bg-white/80 backdrop-blur border rounded-xl p-3 shadow sticky top-2 self-start min-w-0">
      <div className="text-sm font-semibold text-gray-700 mb-2">
        Deck under construction ({items.length})
      </div>

      {items.length === 0 ? (
        <div className="text-xs text-gray-500">No cards in deck yet.</div>
      ) : (
        <div className="grid [grid-template-columns:repeat(auto-fill,minmax(120px,1fr))] gap-3 justify-items-center">
          {items.map((it) => (
            <div key={it.key} className="relative">
              <button
                className="absolute left-1 top-1 z-10 text-xs px-1.5 py-0.5 bg-white/90 rounded border shadow-sm hover:bg-white"
                onClick={() =>
                  it.kind === "babe" ? onRemoveBabe(it.b.id) : onRemoveEffect(it.e.id)
                }
                title="Remove from deck"
              >
                ×
              </button>
              {it.kind === "babe" ? (
                <BabeBadge b={it.b} size={{ w: 120, h: 168 }} />
              ) : (
                <EffectBadge e={it.e} size={{ w: 120, h: 168 }} />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
