import React from "react";
import type { EffectScript, BoundEffect } from "../types/effects";
import { useGifLibrary } from "../media/GifLibrary";

type Props = {
  // Accept both authored scripts and played/bound instances
  e: EffectScript | BoundEffect;
  size?: { w: number; h: number }; // default 200x280
  className?: string;
  onClick?: () => void;
};

export default function EffectBadge({ e, size, className, onClick }: Props) {
  const lib = useGifLibrary();

  // Defensive normalization — NEVER pass undefined to the gif helper
  const group = (e as any)?.group ?? "";
  const name = typeof (e as any)?.name === "string" ? (e as any).name : "";
  const gifName = (e as any)?.gifName ?? "";
  const signatureOf = (e as any)?.signatureOf ?? "";

  const url = lib.getEffectURL({
    group: group as any,
    name,          // always a string (maybe empty)
    gifName,       // always a string (maybe empty)
    signatureOf,   // always a string (maybe empty)
  });

  const W = size?.w ?? 200;
  const H = size?.h ?? 280;

  return (
    <div
      className={("relative rounded overflow-hidden shadow bg-white" + (className ? " " + className : "")).trim()}
      style={{ width: W, height: H }}
      title={name || "Effect"}
      onClick={onClick}
    >
      {url ? (
        <img src={url} alt={name || "Effect"} className="object-cover w-full h-full pointer-events-none" />
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-200 text-sm text-gray-700 px-2 text-center">
          {name || "Unknown Effect"}
        </div>
      )}
    </div>
  );
}
