import React from "react";
import { BabeCard, EffectCard } from "../types/cards";
import CardShell from "./ui/CardShell";
import Pill from "./ui/Pill";
import BabeBadge from "./BabeBadge";
import EffectBadge from "./EffectBadge";

export default function DiscardPile({
  babes,
  effects,
  onReturnAll,
}: {
  babes: BabeCard[];
  effects: EffectCard[];
  onReturnAll: () => void;
}) {
  return (
    <>
      <h2 className="text-xl font-semibold mb-3">Discard Pile</h2>
      <CardShell>
        <div className="w-full text-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-medium">Babes</div>
            <Pill>{babes.length}</Pill>
          </div>
          {babes.length === 0 && <div className="text-gray-500 mb-3">— empty —</div>}
          <div className="space-y-2 mb-4">
            {babes.map((b) => (
              <div key={b.id} className="flex items-center justify-between">
                <BabeBadge b={b} />
              </div>
            ))}
          </div>

          <div className="mb-2 flex items-center justify-between">
            <div className="font-medium">Effects</div>
            <Pill>{effects.length}</Pill>
          </div>
          {effects.length === 0 && <div className="text-gray-500">— empty —</div>}
          <div className="space-y-2">
            {effects.map((e) => (
              <div key={e.id} className="flex items-center justify-between">
                <EffectBadge e={e} />
              </div>
            ))}
          </div>

          <div className="mt-3">
            <button className="text-xs px-3 py-2 rounded-lg border hover:bg-gray-100" onClick={onReturnAll}>
              Return all to Deck
            </button>
          </div>
        </div>
      </CardShell>
    </>
  );
}
