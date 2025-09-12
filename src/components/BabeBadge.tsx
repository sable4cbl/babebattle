import React from "react";
import type { BabeCard } from "../types/cards";
import { useGifLibrary } from "../media/GifLibrary";

type Props = {
  b: BabeCard;
  size?: { w: number; h: number }; // default 200x280
  onClick?: () => void;
  muted?: boolean;
};

export default function BabeBadge({ b, size, onClick, muted }: Props) {
  const lib = useGifLibrary();
  const url = lib.getBabeURL({
    type: (b as any).type,
    name: b.name,
    gifName: (b as any).gifName,
  });

  const W = size?.w ?? 200;
  const H = size?.h ?? 280;

  return (
    <div
      className={
        "relative rounded overflow-hidden shadow " +
        (muted ? "opacity-50" : "bg-white")
      }
      style={{ width: W, height: H, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    >
      {url ? (
        <img src={url} alt={b.name} className="object-cover w-full h-full" />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-200 text-sm text-gray-700 px-2 text-center">
          {b.name}
        </div>
      )}
    </div>
  );
}
