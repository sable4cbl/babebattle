import React, { useMemo, useState } from "react";
import type { BabeCard } from "../../types/cards";
import type { EffectScript, PendingNext } from "../../types/effects";
import BabeBadge from "../../components/BabeBadge";
import EffectBadge from "../../components/EffectBadge";
import { getTypeEmoji } from "../../utils/typeEmoji";

type Props = {
  title: string;
  kind: "babe" | "effect";

  poolBabes: BabeCard[];
  poolEffects: EffectScript[];

  search: string;
  setSearch: (v: string) => void;

  compact: boolean;
  setCompact: React.Dispatch<React.SetStateAction<boolean>>;

  onAddBabe?: (b: BabeCard) => void;
  onAddEffect?: (e: EffectScript) => void;

  onAddAll?: (groupKey: string, visibleList: (BabeCard | EffectScript)[]) => void;

  // Optional sorting controls (enable when provided)
  sortKey?: "name" | "score";
  setSortKey?: (k: "name" | "score") => void;
  sortDir?: "asc" | "desc";
  setSortDir?: (d: "asc" | "desc") => void;

  // Optional per-item disabled/tooltip hook (e.g., eligibility)
  getDisabled?: (x: BabeCard | EffectScript) => { disabled: boolean; reason?: string };
  // Optional: pending-next info for deck badges
  pendingNext?: PendingNext;
  // Optional: targeting context for deck highlighting (e.g., Babe Swap step 1)
  targetingEffectName?: string;
  selectedTargetIds?: string[];
};

export default function DeckPool({
  title,
  kind,
  poolBabes,
  poolEffects,
  search,
  setSearch,
  compact,
  setCompact,
  onAddBabe,
  onAddEffect,
  onAddAll,
  sortKey,
  setSortKey,
  sortDir,
  setSortDir,
  getDisabled,
  pendingNext,
  targetingEffectName,
  selectedTargetIds,
}: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, (BabeCard | EffectScript)[]>();
    let src: (BabeCard | EffectScript)[] = kind === "babe" ? poolBabes : poolEffects;
    // Optional sort: if controls provided, apply here before grouping
    if (sortKey && sortDir) {
      const dir = sortDir === "asc" ? 1 : -1;
      src = src.slice().sort((a, b) => {
        if (kind === "babe") {
          if (sortKey === "score") {
            const av = (a as BabeCard).baseScore ?? 0;
            const bv = (b as BabeCard).baseScore ?? 0;
            return (av - bv) * dir;
          }
          return ((a as BabeCard).name.localeCompare((b as BabeCard).name)) * dir;
        }
        // effects: by name
        return ((a as EffectScript).name.localeCompare((b as EffectScript).name)) * dir;
      });
    }
    for (const x of src) {
      const key = kind === "babe" ? (x as BabeCard).type : String((x as EffectScript).group || "");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(x);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [kind, poolBabes, poolEffects]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <section className="border rounded-xl p-3 bg-white/80 backdrop-blur min-w-0">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <input
            className="text-sm border rounded px-2 py-1 w-56"
            placeholder={`Search ${title.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="text-xs border rounded px-2 py-1"
            onClick={() => setCompact(v => !v)}
            title="Toggle compact view"
          >
            {compact ? "Card view" : "Compact"}
          </button>
          {setSortKey && setSortDir && (
            <>
              <label className="text-sm text-gray-600">Sort</label>
              <select
                className="text-sm border rounded px-2 py-1"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as any)}
              >
                <option value="name">A → Z</option>
                {kind === "babe" && <option value="score">Score</option>}
              </select>
              <button
                className="text-sm border rounded px-2 py-1 flex items-center justify-center"
                title={sortDir === "asc" ? "Ascending" : "Descending"}
                aria-label={sortDir === "asc" ? "Sort ascending" : "Sort descending"}
                onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
              >
                {sortDir === "asc" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 17L17 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M11 7H17V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 7L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M11 17H17V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {grouped.length === 0 && (
        <div className="text-sm text-gray-500">No {title.toLowerCase()} loaded.</div>
      )}

      <div className="space-y-4">
        {grouped.map(([key, list]) => {
          const isCollapsed = !!collapsed[key];
          const icon = getTypeEmoji(key as any);

          return (
            <div key={key}>
              <div className="flex items-center justify-between">
                <div
                  className="text-2xl font-bold mb-2 mt-2 flex items-center gap-2 cursor-pointer select-none"
                  onClick={() => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))}
                >
                  <span className="opacity-80">{isCollapsed ? "▸" : "▾"}</span>
                  <span>{icon}</span>
                  <span>{key}</span>
                  <span className="text-sm text-gray-500">({list.length})</span>
                </div>
                {onAddAll && (
                  <button
                    className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-50"
                    onClick={() => onAddAll(key, list)}
                  >
                    Add all
                  </button>
                )}
              </div>

              {!isCollapsed && (
                compact ? (
                  <div className="space-y-1">
                    {list.map((x) => {
                      const disabledMeta = getDisabled?.(x);
                      const name = (x as any).name as string;
                      const desc = kind === "effect" ? ((x as EffectScript).description || "") : "";
                      const title = (disabledMeta?.reason) || (desc ? `${name} — ${desc}` : name);
                      const isBabe = kind === "babe";
                      const isSelected = isBabe && selectedTargetIds?.includes((x as BabeCard).id);
                      const isEligible69 = isBabe && targetingEffectName === '69' && (x as BabeCard).baseScore === 6 && !isSelected && ((selectedTargetIds?.length ?? 0) < 3);
                      const rowHighlight = isSelected
                        ? ' ring-2 ring-green-500 bg-green-50'
                        : (isEligible69 ? ' ring-1 ring-amber-300 bg-amber-50' : '');
                      return (
                        <div
                          key={(x as any).id}
                          className={
                            ("flex items-start gap-2 text-sm cursor-pointer rounded px-1 py-1 " +
                            (disabledMeta?.disabled ? "opacity-50 pointer-events-none" : "hover:bg-gray-50")) + rowHighlight
                          }
                          onClick={() => disabledMeta?.disabled
                            ? undefined
                            : (kind === "babe" ? onAddBabe?.(x as BabeCard) : onAddEffect?.(x as EffectScript))}
                          title={title}
                        >
                          <span className="mt-0.5">{icon}</span>
                          {kind === "babe" ? (
                            <span className="truncate flex items-center gap-2">
                              <span>
                                {(x as BabeCard).name}{" "}
                                <span className="text-gray-500">({(x as BabeCard).baseScore})</span>
                              </span>
                              {pendingNext?.babeMultNext?.[(x as BabeCard).id] && pendingNext!.babeMultNext![(x as BabeCard).id]! > 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white shadow" title={`Multiplied x${pendingNext!.babeMultNext![(x as BabeCard).id]} if played this turn`}>
                                  x{pendingNext!.babeMultNext![(x as BabeCard).id]}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="truncate">
                              <span className="font-medium">{(x as EffectScript).name}</span>
                              {desc && (
                                <span className="block text-[11px] text-gray-500 truncate">{desc}</span>
                              )}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // <- auto-fill grid: uses all available width with min 200px
                  <div className="grid [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))] gap-3">
                    {list.map((x) => {
                      const disabledMeta = getDisabled && getDisabled(x);
                      const handleClick = () => {
                        if (disabledMeta?.disabled) return;
                        if (kind === "babe") onAddBabe?.(x as BabeCard); else onAddEffect?.(x as EffectScript);
                      };
                      const isBabe = kind === 'babe';
                      const isSelected = isBabe && selectedTargetIds?.includes((x as BabeCard).id);
                      const isEligible69 = isBabe && targetingEffectName === '69' && (x as BabeCard).baseScore === 6 && !isSelected && ((selectedTargetIds?.length ?? 0) < 3);
                      const extraClass = isSelected
                        ? ' ring-4 ring-green-500'
                        : (isEligible69 ? ' ring-2 ring-amber-400' : '');
                      return (
                        <div
                          key={(x as any).id}
                          className={(disabledMeta?.disabled ? "opacity-50 " : "") + "relative pointer-events-none"}
                          title={(disabledMeta?.reason) || (x as any).name}
                        >
                          {kind === "babe" ? (
                            <BabeBadge
                              b={x as BabeCard}
                              size={{ w: 200, h: 280 }}
                              className={
                                ((targetingEffectName === 'Babe Swap' && ((selectedTargetIds?.length ?? 0) === 0))
                                  ? 'ring-2 ring-blue-500 '
                                  : '') +
                                (extraClass ? (extraClass + ' ') : '') +
                                'pointer-events-auto'
                              }
                              onClick={handleClick}
                            />
                          ) : (
                            <EffectBadge
                              e={x as EffectScript}
                              size={{ w: 200, h: 280 }}
                              className="pointer-events-auto"
                              onClick={handleClick as any}
                            />
                          )}
                          {isBabe && isSelected && (
                            <div className="absolute left-1 top-1 z-10 text-[10px] px-1.5 py-0.5 rounded bg-green-600 text-white shadow pointer-events-none">Selected</div>
                          )}
                          {kind === "babe" && pendingNext?.babeMultNext?.[(x as BabeCard).id] && pendingNext!.babeMultNext![(x as BabeCard).id]! > 1 && (
                            <div className="absolute right-1 top-1 z-10 text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white shadow pointer-events-none" title={`Multiplied x${pendingNext!.babeMultNext![(x as BabeCard).id]} if played this turn`}>
                              x{pendingNext!.babeMultNext![(x as BabeCard).id]}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
