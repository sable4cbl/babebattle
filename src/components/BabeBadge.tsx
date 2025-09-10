import React, { useEffect, useState } from "react";
import { BabeCard } from "../types/cards";
import { useGifLibrary } from "../media/GifLibrary";

export default function BabeBadge({
  b,
  score,
  muted,
  selected,
  onClick,
  small = false,
}: {
  b: BabeCard;
  score?: number;
  muted?: boolean;
  selected?: boolean;
  onClick?: () => void;
  small?: boolean;
}) {
  const { getGifURLByName, makeBabeGifName, version } = useGifLibrary();
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const expectedFilename = makeBabeGifName(b.type, b.name, b.gifName);

  useEffect(() => {
    let alive = true;
    let prev: string | null = null;
    (async () => {
      const url = await getGifURLByName(expectedFilename);
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
  }, [expectedFilename, getGifURLByName, version]);

  const tileClass = small ? "w-[100px] h-[140px]" : "w-[175px] h-[245px]";

  return (
    <div
      className={[
        "relative rounded-xl overflow-hidden border bg-white",
        tileClass,
        "flex-none",
        "transition-shadow hover:shadow-md cursor-pointer",
        muted ? "opacity-40" : "",
        selected ? "ring-2 ring-blue-400" : "",
      ].join(" ")}
      onClick={onClick}
      role="button"
      title={`${b.name} • ${b.type} • Base ${b.baseScore}`}
    >
      {gifUrl ? (
        <img src={gifUrl} alt={b.name} className="w-full h-full object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-end justify-stretch">
          <div className="w-full bg-gray-900/80 text-white p-2">
            <div className="text-xs font-semibold truncate">{b.name}</div>
            <div className="text-white/80 text-[11px]">
              {b.type} • Base {b.baseScore}
              {typeof score === "number" && score !== b.baseScore ? ` → ${score}` : ""}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
