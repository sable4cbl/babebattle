import React, { useEffect, useState } from "react";
import { PlayedEffect } from "../types/cards";
import { useGifLibrary } from "../media/GifLibrary";

/**
 * Visual tile for an effect that is ALREADY in play.
 * - Supports "selected" ring to indicate targeting mode
 * - Click to select/deselect (parent provides onSelect)
 * - Clean image-only style when GIF exists; fallback ribbon when missing
 */
export default function PlayedEffectBadge({
  e,
  selected,
  onSelect,
}: {
  e: PlayedEffect;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const { getEffectGifURL, version } = useGifLibrary();
  const [gifUrl, setGifUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let prev: string | null = null;
    (async () => {
      const url = await getEffectGifURL(e.name, {
        override: e.gifName,
        performerUpper: e.gifPerformerTagUpper,
        typeUpper:
          e.gifTypeTagUpper ||
          (typeof e.targetType === "string" ? e.targetType.toUpperCase() : undefined),
      });
      if (!alive) return;
      if (prev && prev !== url) {
        try { URL.revokeObjectURL(prev); } catch {}
      }
      prev = url;
      setGifUrl(url);
    })();
    return () => {
      alive = false;
      if (prev) {
        try { URL.revokeObjectURL(prev); } catch {}
      }
    };
  }, [e.name, e.gifName, e.gifPerformerTagUpper, e.gifTypeTagUpper, e.targetType, getEffectGifURL, version]);

  return (
    <div
      className={[
        "relative rounded-xl overflow-hidden border bg-white",
        "w-[100px] h-[140px] flex-none",
        "transition-shadow hover:shadow-md cursor-pointer",
        selected ? "ring-2 ring-blue-400" : "",
      ].join(" ")}
      onClick={onSelect}
      role="button"
      title={e.description || e.name}
    >
      {gifUrl ? (
        <img src={gifUrl} alt={e.name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-end justify-stretch">
          <div className="w-full bg-gray-900/80 text-white p-1.5">
            <div className="text-[11px] font-semibold truncate">{e.name}</div>
          </div>
        </div>
      )}
    </div>
  );
}
