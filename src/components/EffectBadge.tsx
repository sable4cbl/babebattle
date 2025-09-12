import React from "react";
import type { EffectScript } from "../types/effects";
import { useGifLibrary } from "../media/GifLibrary";

type Props = {
  e: EffectScript;
  size?: { w: number; h: number }; // default 200x280
};

export default function EffectBadge({ e, size }: Props) {
  const lib = useGifLibrary();
  // If your EffectScript has signatureOf (for SIGNATURE), lib will use it.
  const url = lib.getEffectURL({
    group: e.group as any,
    name: e.name,
    gifName: (e as any).gifName,
    signatureOf: (e as any).signatureOf,
  });

  const W = size?.w ?? 200;
  const H = size?.h ?? 280;

  return (
    <div
      className="relative rounded overflow-hidden shadow bg-white"
      style={{ width: W, height: H }}
    >
      {url ? (
        <img src={url} alt={e.name} className="object-cover w-full h-full" />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-200 text-sm text-gray-700 px-2 text-center">
          {e.name}
        </div>
      )}
    </div>
  );
}
