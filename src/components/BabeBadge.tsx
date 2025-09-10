import React from "react";
import { BabeCard, PlayedBabe } from "../types/cards";
import Pill from "./ui/Pill";

export default function BabeBadge({
  b,
  score,
  muted,
  onClick,
}: {
  b: PlayedBabe | BabeCard;
  score?: number;
  muted?: boolean;
  onClick?: () => void;
}) {
  const showScore = typeof score === "number";

  return (
    <div
      className={`flex items-center gap-2 ${
        onClick ? "cursor-pointer" : ""
      } ${muted ? "opacity-40" : ""}`}
      onClick={onClick}
    >
      {"img" in b && b.img ? (
        <img
          src={b.img}
          alt={b.name}
          className="w-10 h-10 object-cover rounded-xl border"
        />
      ) : (
        <div className="w-10 h-10 rounded-xl bg-gray-100 border flex items-center justify-center text-xs">
          IMG
        </div>
      )}
      <div>
        <div className="font-medium leading-tight">{b.name}</div>
        <div className="text-xs text-gray-600">
          <Pill>{b.type}</Pill> <span className="ml-2">Base {b.baseScore}</span>
          {showScore && <span className="ml-2">→ {score}</span>}
        </div>
      </div>
    </div>
  );
}
