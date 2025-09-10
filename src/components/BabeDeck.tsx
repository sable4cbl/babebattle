import React, { useMemo, useState } from "react";
import { BabeCard, BabeType } from "../types/cards";
import BabeBadge from "./BabeBadge";
import CardShell from "./ui/CardShell";
import TypeCounters from "./TypeCounters";

export type DeckTargetMode =
  | {
      active: true;
      kind: "discard-babes-add-final";
      need: number;
      already: number;
      type?: BabeType;
      takenTypes?: Set<string>; // types already chosen (dim them)
    }
  | { active: false };

export default function BabeDeck({
  babes,
  canPlayBabe,
  playBabe,
  title,
  onOpenGifLibrary,
  targetMode = { active: false },
  onClickDeckBabe,
}: {
  babes: BabeCard[];
  canPlayBabe: boolean;
  playBabe: (b: BabeCard) => void;
  title?: string;
  onOpenGifLibrary?: () => void;
  targetMode?: DeckTargetMode;
  onClickDeckBabe?: (b: BabeCard) => void;
}) {
  const [sortBy, setSortBy] = useState<"name" | "base">("name");

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

  const targeting = targetMode.active;
  const taken = targetMode.active && targetMode.takenTypes ? targetMode.takenTypes : new Set<string>();
  const picksRemaining =
    targetMode.active && typeof targetMode.need === "number"
      ? Math.max(0, targetMode.need - (targetMode.already ?? 0))
      : 0;

  /** For Trifecta we want: initially everything bright/clickable; after a pick, dim that type. */
  const eligibleForTarget = (b: BabeCard) => {
    if (!targeting) return false;
    if (targetMode.kind !== "discard-babes-add-final") return false;
    if (picksRemaining <= 0) return false;
    // If a type is already taken, we must NOT allow more of that type
    if (taken.has(b.type)) return false;
    // If targetMode.type is specified (not for Trifecta), enforce it
    if (targetMode.type && b.type !== targetMode.type) return false;
    return true;
  };

  const onBabeCardClick = (b: BabeCard) => {
    if (targeting && eligibleForTarget(b) && onClickDeckBabe) {
      onClickDeckBabe(b);
      return;
    }
    if (!targeting && canPlayBabe) playBabe(b);
  };

  return (
    // Raise the entire deck above the global overlay when targeting
    <div className={`space-y-4 relative ${targeting ? "z-[60]" : ""}`}>
      <div className="flex items-end justify-between">
        <h2 className="text-xl font-semibold">{title ?? "Babes"}</h2>
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
          {onOpenGifLibrary && (
            <button
              className="text-xs px-2 py-1 rounded-md border hover:bg-gray-100"
              onClick={onOpenGifLibrary}
              title="Open GIF Library"
            >
              GIF Library
            </button>
          )}
        </div>
      </div>

      <CardShell highlight={targeting}>
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Available</div>
            <TypeCounters babes={babes} />
          </div>

          {groups.length === 0 ? (
            <div className="text-sm text-gray-500">No available Babe cards.</div>
          ) : (
            <div className="space-y-5">
              {groups.map(([type, arr]) => (
                <section key={String(type)}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{type}</h3>
                  {/* Two columns per type section */}
                  <div className="grid grid-cols-2 gap-3">
                    {arr.map((b) => {
                      // Muting rule for Trifecta: dim only already-chosen types
                      const selectable = eligibleForTarget(b);
                      const muted = targeting && (taken.has(b.type) || !selectable ? true : false);

                      return (
                        <div key={b.id} className="flex justify-center">
                          <BabeBadge
                            b={b}
                            muted={muted}
                            onClick={() => onBabeCardClick(b)}
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </CardShell>
    </div>
  );
}
