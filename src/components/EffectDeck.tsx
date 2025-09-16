import React, { useMemo, useState } from "react";
import type { EffectScript } from "../types/effects";
import type { Eligibility } from "../engine/eligibility";
import { getTypeEmoji } from "../utils/typeEmoji";
import EffectBadge from "./EffectBadge";

type Props = {
  effects: EffectScript[];
  canPlayEffect: boolean;
  playEffect: (e: EffectScript) => void;
  getEligibility: (e: EffectScript) => Eligibility;
  activeEffectId?: string | null;
  isTargeting?: boolean;
};

type SortDir = "asc" | "desc";

export default function EffectDeck({ effects, canPlayEffect, playEffect, getEligibility, activeEffectId, isTargeting }: Props) {
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const groupCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of effects) m.set(e.group as string, (m.get(e.group as string) || 0) + 1);
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [effects]);

  const visible = useMemo(() => {
    const arr = activeGroup ? effects.filter(e => e.group === activeGroup) : effects.slice();
    arr.sort((a, b) => {
      const cmp = a.name.localeCompare(b.name);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [effects, activeGroup, sortDir]);

  const grouped = useMemo(() => {
    const g = new Map<string, EffectScript[]>();
    for (const e of visible) {
      const key = e.group as string;
      if (!g.has(key)) g.set(key, []);
      g.get(key)!.push(e);
    }
    return Array.from(g.entries());
  }, [visible]);

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Effects</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Sort</label>
          <div className="text-sm border rounded px-2 py-1 bg-white">A → Z</div>
          <button
            className="text-sm border rounded px-2 py-1"
            title={sortDir === "asc" ? "Ascending" : "Descending"}
            onClick={() => setSortDir(d => (d === "asc" ? "desc" : "asc"))}
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>
      </div>

      <div className="mb-2">
        <div className="text-sm font-medium mb-1">Available</div>
        <div className="flex flex-wrap gap-2">
          {groupCounts.map(([g, n]) => {
            const active = activeGroup === g;
            return (
              <button
                key={g}
                className={
                  "text-xs px-2 py-1 rounded border " +
                  (active ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-50")
                }
                onClick={() => setActiveGroup(cur => (cur === g ? null : g))}
                title={`Show only ${g}`}
              >
                <span className="mr-1">{getTypeEmoji(g as any)}</span>
                {g}: {n}
              </button>
            );
          })}
          {activeGroup && (
            <button
              className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50"
              onClick={() => setActiveGroup(null)}
              title="Clear filter"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="text-sm text-gray-500">No effects to show.</div>
      )}

      {grouped.map(([group, rows]) => (
        <div key={group} className="mb-6">
          {!activeGroup && <div className="text-2xl font-bold mb-2 mt-4">{group}</div>}
          {/* EXACTLY like Babe cards: 2 per row, 200x280 */}
          <div className="grid grid-cols-2 gap-3">
            {rows.map(e => {
              const elig = getEligibility(e);
              const disabled = !canPlayEffect || !elig.ok;
              const title = !canPlayEffect
                ? "Effect limit reached"
                : !elig.ok
                ? elig.reason || "Not eligible"
                : "Play effect";
              const active = !!isTargeting && activeEffectId === e.id;
              const dimForTargeting = !!isTargeting && !active;
              return (
                <div
                  key={e.id}
                  className={
                    "relative cursor-pointer transition-transform active:scale-[0.98] " +
                    (disabled ? "opacity-50 pointer-events-none " : "") +
                    (dimForTargeting ? "opacity-30 pointer-events-none " : "") +
                    (active ? "ring-2 ring-blue-500 z-40 " : "")
                  }
                  title={title}
                  onClick={() => {
                    if (disabled) return;
                    playEffect(e);
                  }}
                >
                  {active && (
                    <div className="absolute top-1 left-1 z-10 text-[10px] px-1 py-0.5 rounded bg-blue-600 text-white shadow">
                      Targeting
                    </div>
                  )}
                  <EffectBadge e={e} size={{ w: 200, h: 280 }} />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}



