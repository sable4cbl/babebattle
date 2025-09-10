import React, { useMemo, useState } from "react";
import { BabeCard, BabeType, EffectCard } from "../types/cards";
import BabeBadge from "./BabeBadge";
import EffectBadge from "./EffectBadge";
import CardShell from "./ui/CardShell";
import TypeCounters from "./TypeCounters";

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
  targetMode = { active: false },
  onClickDeckBabe,
  effectEligibilityMap,
  title,
}: {
  babes: BabeCard[];
  effects: EffectCard[];
  canPlayBabe: boolean;
  canPlayEffect: boolean;
  playBabe: (b: BabeCard) => void;
  playEffect: (e: EffectCard) => void;
  targetMode?: DeckTargetMode;
  onClickDeckBabe?: (b: BabeCard) => void;
  effectEligibilityMap?: Map<string, { ok: boolean; reason?: string }>;
  title?: string;
}) {
  const [sortBy, setSortBy] = useState<"name" | "base">("name");

  // Group babes by type and sort within groups
  const groups = useMemo(() => {
    const byType = new Map<BabeType, BabeCard[]>();
    for (const b of babes) {
      if (!byType.has(b.type)) byType.set(b.type, []);
      byType.get(b.type)!.push(b);
    }
    for (const [t, arr] of byType) {
      arr.sort((a, b) =>
        sortBy === "name"
          ? a.name.localeCompare(b.name)
          : b.baseScore - a.baseScore || a.name.localeCompare(b.name)
      );
      byType.set(t, arr);
    }
    return Array.from(byType.entries()).sort(([a], [b]) =>
      String(a).localeCompare(String(b))
    );
  }, [babes, sortBy]);

  const titleText = title ?? "Your Deck (available)";
  const targeting = targetMode.active;

  const eligibleForTarget = (b: BabeCard) => {
    if (!targeting) return false;
    if (targetMode.kind === "discard-babes-add-final") {
      if (targetMode.already >= targetMode.need) return false;
      if (targetMode.type && b.type !== targetMode.type) return false;
      return true;
    }
    return false;
  };

  const onBabeCardClick = (b: BabeCard) => {
    if (targeting && eligibleForTarget(b) && onClickDeckBabe) {
      onClickDeckBabe(b);
      return;
    }
    if (!targeting && canPlayBabe) {
      playBabe(b);
    }
  };

  const onEffectCardClick = (e: EffectCard) => {
    const elig = effectEligibilityMap?.get(e.id);
    const disabled = (!canPlayEffect && !e.ignoreEffectLimit) || !elig?.ok;
    if (!disabled) playEffect(e);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold">{titleText}</h2>
          {/* hint removed for a cleaner header */}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600">Sort</label>
          <select
            className="text-xs px-2 py-1 rounded-md border bg-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "base")}
            title="Sort Babes"
          >
            <option value="name">A → Z</option>
            <option value="base">Base Score</option>
          </select>
        </div>
      </div>

      {/* Babes (grouped by Type) */}
      <CardShell highlight={targeting}>
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Babes</div>
            <TypeCounters babes={babes} />
          </div>

          {groups.length === 0 ? (
            <div className="text-sm text-gray-500">No available Babe cards.</div>
          ) : (
            <div className="space-y-5">
              {groups.map(([type, arr]) => (
                <section key={String(type)}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{type}</h3>

                  {/* Fixed-size tiles that wrap; each tile is flex-none so it never grows */}
                  <div className="flex flex-wrap gap-3">
                    {arr.map((b) => {
                      const selectable = eligibleForTarget(b);
                      return (
                        <BabeBadge
                          key={b.id}
                          b={b}
                          muted={targeting && !selectable}
                          selected={false}
                          onClick={() => onBabeCardClick(b)}
                        />
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </CardShell>

      {/* Effects — single column list with text beside thumbnail */}
      <CardShell>
        <div className="w-full">
          <div className="font-semibold mb-2">Effects</div>
          {effects.length === 0 ? (
            <div className="text-sm text-gray-500">No available Effect cards.</div>
          ) : (
            <div className="space-y-3">
              {effects.map((e) => {
                const elig = effectEligibilityMap?.get(e.id) ?? { ok: true };
                const disabled = (!canPlayEffect && !e.ignoreEffectLimit) || !elig.ok;

                return (
                  <div
                    key={e.id}
                    className={[
                      "flex items-center gap-3 p-2 rounded-xl border bg-white",
                      "transition hover:shadow cursor-pointer",
                      disabled ? "opacity-50 pointer-events-none" : "",
                    ].join(" ")}
                    onClick={() => onEffectCardClick(e)}
                    title={elig.reason || e.description || e.name}
                  >
                    <EffectBadge e={e} disabled={disabled} />

                    <div className="min-w-0">
                      <div className="font-semibold truncate">{e.name}</div>
                      {e.description && (
                        <div className="text-xs text-gray-600">
                          {e.description}
                        </div>
                      )}
                      {/* Optional metadata line — uncomment if you want to see kind/limits
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        kind: {e.kind}
                        {e.ignoreEffectLimit ? " • ignores Effect limit" : ""}
                        {e.ignoreBabeLimit ? " • ignores Babe limit" : ""}
                      </div>
                      */}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardShell>
    </div>
  );
}
