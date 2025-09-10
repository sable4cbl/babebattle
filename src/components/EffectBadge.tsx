import React from "react";
import { BabeType, EffectCard, PlayedEffect } from "../types/cards";
import { TextInput } from "./ui/Inputs";

export default function EffectBadge({
  e,
  onBind,
  selected,
  onSelect,
}: {
  e: PlayedEffect | EffectCard;
  onBind?: (updates: Partial<PlayedEffect>) => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const description = e.description || e.kind;
  const factor = e.factor ?? 1;
  const add = e.add ?? 0;

  const needsTargetBabe =
    e.kind === "multiply-babe" &&
    !("boundTargetBabeId" in e && e.boundTargetBabeId) &&
    !e.targetBabeId;

  const needsTargetType =
    e.kind === "multiply-type" &&
    !("boundTargetType" in e && e.boundTargetType) &&
    !e.targetType;

  const isDiscardEffect = e.kind === "discard-babes-add-final";
  const selectedCount = isDiscardEffect
    ? ("boundDiscards" in e && e.boundDiscards ? e.boundDiscards.length : 0)
    : 0;
  const needCount = isDiscardEffect ? (e.discardCount ?? 0) : 0;

  return (
    <div className={`${onSelect ? "cursor-pointer" : ""}`} onClick={onSelect}>
      <div className="font-medium leading-tight flex items-center gap-2">
        {e.name}
        {selected && (
          <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
            targeting…
          </span>
        )}
        {isDiscardEffect && (
          <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
            {selectedCount}/{needCount} selected
            {e.discardType ? ` (${e.discardType})` : ""}
          </span>
        )}
      </div>

      <div className="text-xs text-gray-600">{description}</div>
      <div className="text-[11px] mt-1 text-gray-700">
        {e.kind.startsWith("multiply") && <span>×{factor}</span>}
        {e.kind === "add-final" && <span>+{add} final</span>}
        {e.kind === "extra-plays" && (
          <span>
            +{e.extraBabes ?? 0} Babe, +{e.extraEffects ?? 0} Effect
          </span>
        )}
        {isDiscardEffect && (
          <span>
            Discard {needCount} {e.discardType ? e.discardType + " " : ""}Babe(s), add their base to final
          </span>
        )}
      </div>

      {/* Only show text binders for multiply-babe/type; discard effect binds via Deck clicks */}
      {onBind && (needsTargetBabe || needsTargetType) && !selected && (
        <div className="mt-2 text-xs">
          {needsTargetBabe && (
            <div className="flex items-center gap-2">
              <span>Bind Babe ID:</span>
              <TextInput
                value={
                  ("boundTargetBabeId" in e && (e as any).boundTargetBabeId) || ""
                }
                onChange={(v) => onBind({ boundTargetBabeId: v })}
                placeholder="playId or card id"
              />
            </div>
          )}
          {needsTargetType && (
            <div className="flex items-center gap-2 mt-1">
              <span>Bind Type:</span>
              <TextInput
                value={
                  ("boundTargetType" in e && (e as any).boundTargetType) || ""
                }
                onChange={(v) => onBind({ boundTargetType: v as BabeType })}
                placeholder="e.g., Pop"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
