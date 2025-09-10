import React from "react";
import { BabeCard, EffectCard, BabeType } from "../types/cards";
import BabeBadge from "./BabeBadge";
import EffectBadge from "./EffectBadge";
import CardShell from "./ui/CardShell";

export type DeckTargetMode =
  | {
      active: true;
      kind: "discard-babes-add-final";
      need: number;
      already: number;
      type?: BabeType;
    }
  | { active: false };

export default function DeckList({
  babes,
  effects,
  canPlayBabe,
  canPlayEffect,
  playBabe,
  playEffect,
  // remove buttons removed from UI; keep props absent
  targetMode = { active: false },
  onClickDeckBabe, // when targeting discard effect
}: {
  babes: BabeCard[];
  effects: EffectCard[];
  canPlayBabe: boolean;
  canPlayEffect: boolean;
  playBabe: (b: BabeCard) => void;
  playEffect: (e: EffectCard) => void;
  targetMode?: DeckTargetMode;
  onClickDeckBabe?: (b: BabeCard) => void;
  title?: string;
}) {
  const title = "Your Deck (available)";
  const targeting = targetMode.active;

  const eligible = (b: BabeCard) => {
    if (!targeting) return false;
    if (targetMode.kind === "discard-babes-add-final") {
      if (targetMode.type && b.type !== targetMode.type) return false;
      if (targetMode.already >= targetMode.need) return false;
      return true;
    }
    return false;
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-3">{title}</h2>

      <div className="space-y-4">
        {/* Babes */}
        <CardShell highlight={targeting}>
          <div className="w-full">
            <div className="font-semibold mb-2 flex items-center gap-2">
              <span>Babes</span>
              {targeting && targetMode.kind === "discard-babes-add-final" && (
                <span className="text-[11px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  Select {targetMode.need - targetMode.already} more{" "}
                  {targetMode.type ? `${targetMode.type} ` : ""}Babe(s) to discard
                </span>
              )}
            </div>
            <div className="space-y-2">
              {babes.length === 0 && (
                <div className="text-sm text-gray-500">No available Babe cards.</div>
              )}
              {babes.map((b) => {
                const isEligible = eligible(b);
                return (
                  <div
                    key={b.id}
                    className={`flex items-center justify-between rounded-xl ${
                      targeting
                        ? isEligible
                          ? "ring-2 ring-blue-200"
                          : "opacity-40"
                        : ""
                    }`}
                    onClick={
                      targeting && isEligible && onClickDeckBabe
                        ? () => onClickDeckBabe(b)
                        : undefined
                    }
                    style={{ cursor: targeting && isEligible ? "pointer" : "default" }}
                  >
                    <BabeBadge b={b} />
                    {!targeting && (
                      <div className="flex items-center gap-2">
                        <button
                          className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-100"
                          onClick={() => playBabe(b)}
                          disabled={!canPlayBabe}
                        >
                          Play
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardShell>

        {/* Effects */}
        <CardShell>
          <div className="w-full">
            <div className="font-semibold mb-2">Effects</div>
            <div className="space-y-2">
              {effects.length === 0 && (
                <div className="text-sm text-gray-500">No available Effect cards.</div>
              )}
              {effects.map((e) => (
                <div key={e.id} className="flex items-center justify-between">
                  <EffectBadge e={e} />
                  <div className="flex items-center gap-2">
                    <button
                      className="text-xs px-2 py-1 rounded-lg border hover:bg-gray-100"
                      onClick={() => playEffect(e)}
                      disabled={!canPlayEffect}
                    >
                      Play
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardShell>
      </div>
    </>
  );
}
