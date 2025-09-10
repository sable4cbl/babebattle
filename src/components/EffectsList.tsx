import React from "react";
import { EffectCard } from "../types/cards";
import EffectBadge from "./EffectBadge";
import CardShell from "./ui/CardShell";

export default function EffectsList({
  effects,
  canPlayEffect,
  canStartTargeting,
  onClickEffect,
  effectEligibilityMap,
  title,
}: {
  effects: EffectCard[];
  canPlayEffect: boolean;
  canStartTargeting: (e: EffectCard) => boolean;
  onClickEffect: (e: EffectCard) => void;
  effectEligibilityMap?: Map<string, { ok: boolean; reason?: string }>;
  title?: string;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{title ?? "Effects"}</h2>
      <CardShell>
        <div className="space-y-3">
          {effects.length === 0 ? (
            <div className="text-sm text-gray-500">No available Effect cards.</div>
          ) : (
            effects.map((e) => {
              const elig = effectEligibilityMap?.get(e.id) ?? { ok: true };
              const requiresTarget =
                e.kind === "multiply-babe" && !!e.targetType && !e.targetBabeId && !e.targetName;
              const okToUse =
                (canPlayEffect || e.ignoreEffectLimit) &&
                elig.ok &&
                (!requiresTarget || canStartTargeting(e));

              const reason =
                !elig.ok
                  ? elig.reason
                  : requiresTarget && !canStartTargeting(e)
                  ? "Needs a valid Babe in play"
                  : undefined;

              return (
                <div
                  key={e.id}
                  className={[
                    "flex items-center gap-3 p-2 rounded-xl border bg-white",
                    "transition hover:shadow cursor-pointer",
                    okToUse ? "" : "opacity-50 pointer-events-none",
                  ].join(" ")}
                  onClick={() => okToUse && onClickEffect(e)}
                  title={reason || e.description || e.name}
                >
                  <EffectBadge e={e} disabled={!okToUse} />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{e.name}</div>
                    {e.description && (
                      <div className="text-xs text-gray-600">{e.description}</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardShell>
    </div>
  );
}
