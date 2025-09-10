import type { PlayedBabe, PlayedEffect, BoundDiscard } from "../types/cards";
import type { Limits, Resolution } from "../types/scoring";

/**
 * Resolution rules:
 * - Effects are processed in the order they were played.
 * - Babe-affecting effects (multiply-babe/type/all) mutate per-babe scores immediately.
 * - Final effects (add-final, multiply-final, discard-babes-add-final) are queued
 *   and then applied sequentially in play order to a running final value
 *   that starts as the sum of the current babe scores.
 */
export function applyEffects(
  babes: PlayedBabe[],
  effects: PlayedEffect[],
  limits: Limits
): Resolution {
  const log: string[] = [];
  const babeScores = new Map<string, number>();
  for (const b of babes) babeScores.set(b.playId, b.baseScore);

  let updatedLimits = { ...limits };

  type FinalOp =
    | { kind: "add-final"; add: number; name?: string }
    | { kind: "multiply-final"; factor: number; name?: string }
    | { kind: "discard-babes-add-final"; totalAdd: number; details: BoundDiscard[]; need: number; name?: string };

  const finalOps: FinalOp[] = [];

  const findBabe = (playIdOrCardId?: string) =>
    playIdOrCardId
      ? babes.find((b) => b.playId === playIdOrCardId || b.id === playIdOrCardId)
      : undefined;

  // 1) Process effects in play order; queue final ops
  for (const e of effects) {
    switch (e.kind) {
      case "extra-plays": {
        const addB = e.extraBabes ?? 0;
        const addE = e.extraEffects ?? 0;
        updatedLimits.babes += addB;
        updatedLimits.effects += addE;
        log.push(
          `Extra Plays: +${addB} Babe, +${addE} Effect (limits now B${updatedLimits.babes}/E${updatedLimits.effects})`
        );
        break;
      }

      case "multiply-babe": {
        const factor = e.factor ?? 1;
        const targetId = e.boundTargetBabeId || e.targetBabeId;
        const target = findBabe(targetId);
        if (target) {
          const prev = babeScores.get(target.playId) ?? target.baseScore;
          const next = prev * factor;
          babeScores.set(target.playId, next);
          log.push(
            `Multiply Babe${e.name ? ` [${e.name}]` : ""}: ${target.name} ×${factor} ⇒ ${prev} → ${next}`
          );
        } else {
          log.push(`(multiply-babe${e.name ? ` [${e.name}]` : ""} skipped: no target chosen)`);
        }
        break;
      }

      case "multiply-type": {
        const factor = e.factor ?? 1;
        const t = e.boundTargetType || e.targetType;
        const matches = babes.filter((b) => (t ? b.type === t : true));
        if (matches.length === 0) {
          log.push(
            `(multiply-type${e.name ? ` [${e.name}]` : ""} skipped: no babes of type ${t ?? "(any)"})`
          );
          break;
        }
        for (const b of matches) {
          const prev = babeScores.get(b.playId) ?? b.baseScore;
          babeScores.set(b.playId, prev * factor);
        }
        log.push(
          `Multiply Type${e.name ? ` [${e.name}]` : ""}: ${t ?? "Any"} ×${factor} ⇒ [${matches
            .map((m) => m.name)
            .join(", ")}]`
        );
        break;
      }

      case "multiply-all": {
        const factor = e.factor ?? 1;
        for (const b of babes) {
          const prev = babeScores.get(b.playId) ?? b.baseScore;
          babeScores.set(b.playId, prev * factor);
        }
        log.push(`Multiply ALL Babes${e.name ? ` [${e.name}]` : ""} ×${factor}`);
        break;
      }

      case "add-final": {
        finalOps.push({ kind: "add-final", add: e.add ?? 0, name: e.name });
        break;
      }

      case "multiply-final": {
        finalOps.push({ kind: "multiply-final", factor: e.factor ?? 1, name: e.name });
        break;
      }

      case "discard-babes-add-final": {
        const selected = e.boundDiscards ?? [];
        const totalAdd = selected.reduce((acc, d) => acc + (d.baseScore || 0), 0);
        finalOps.push({
          kind: "discard-babes-add-final",
          totalAdd,
          details: selected,
          need: e.discardCount ?? 0,
          name: e.name,
        });
        break;
      }

      default: {
        log.push(`(unhandled effect kind: ${(e as any).kind})`);
      }
    }
  }

  // 2) Compute sums after babe effects
  const baseSum = babes.reduce((acc, b) => acc + (b.baseScore || 0), 0);
  const mutatedSum = babes.reduce(
    (acc, b) => acc + (babeScores.get(b.playId) ?? b.baseScore),
    0
  );

  // 3) Apply final ops in order
  let final = mutatedSum;
  for (const op of finalOps) {
    const before = final;
    if (op.kind === "add-final") {
      final = before + op.add;
      log.push(`Final${op.name ? ` [${op.name}]` : ""}: Add +${op.add} ⇒ ${before} → ${final}`);
    } else if (op.kind === "multiply-final") {
      final = before * op.factor;
      log.push(`Final${op.name ? ` [${op.name}]` : ""}: Multiply ×${op.factor} ⇒ ${before} → ${final}`);
    } else if (op.kind === "discard-babes-add-final") {
      if (op.details.length === 0) {
        log.push(
          `Final${op.name ? ` [${op.name}]` : ""}: Discard ${op.need} babes ⇒ (none selected yet, +0)`
        );
      } else {
        const names = op.details.map((d) => d.name).join(", ");
        final = before + op.totalAdd;
        log.push(
          `Final${op.name ? ` [${op.name}]` : ""}: Discarded ${op.details.length} babe(s) [${names}] (+${op.totalAdd}) ⇒ ${before} → ${final}`
        );
      }
    }
  }

  const finalScore = Math.max(0, Math.round(final));
  return { finalScore, mutatedSum, baseSum, log, updatedLimits, babeScores };
}
