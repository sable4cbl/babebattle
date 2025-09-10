import type {
  PlayedBabe,
  PlayedEffect,
  BoundDiscard,
} from "../types/cards";
import type { Limits, Resolution } from "../types/scoring";

/**
 * Order-sensitive resolution (no priorities).
 *
 * 'pending' lets us inject next-turn bonuses at the start of scoring.
 */
export function applyEffects(
  babes: PlayedBabe[],
  effects: PlayedEffect[],
  limits: Limits,
  pending?: { addNext?: number; multNext?: number }
): Resolution {
  const log: string[] = [];
  const babeScores = new Map<string, number>();
  for (const b of babes) babeScores.set(b.playId, b.baseScore);

  let updatedLimits = { ...limits };

  type FinalOp =
    | { kind: "add-final"; add: number; name?: string }
    | { kind: "multiply-final"; factor: number; name?: string }
    | { kind: "discard-babes-add-final"; totalAdd: number; details: BoundDiscard[]; need: number; name?: string }
    | { kind: "use-discard-add-final"; totalAdd: number; details: BoundDiscard[]; need: number; name?: string }
    | { kind: "discard-different-then-multiply-final"; ok: boolean; factor: number; picked: BoundDiscard[]; need: number; name?: string };

  const finalOps: FinalOp[] = [];

  const findBabeById = (playIdOrCardId?: string) =>
    playIdOrCardId
      ? babes.find((b) => b.playId === playIdOrCardId || b.id === playIdOrCardId)
      : undefined;
  const findBabeByName = (name?: string) =>
    name ? babes.find((b) => b.name.toLowerCase() === name.toLowerCase()) : undefined;

  const onlyBabePlayed = (name?: string) => {
    if (!name) return false;
    const alive = babes.filter(Boolean);
    return alive.length === 1 && alive[0].name.toLowerCase() === name.toLowerCase();
  };

  // In-order processing
  for (const e of effects) {
    switch (e.kind) {
      case "extra-plays": {
        const addB = e.extraBabes ?? 0;
        const addE = e.extraEffects ?? 0;
        updatedLimits.babes += addB;
        updatedLimits.effects += addE;
        log.push(`Extra Plays: +${addB} Babe, +${addE} Effect (now B${updatedLimits.babes}/E${updatedLimits.effects})`);
        break;
      }

      case "set-babe-limit": {
        // We rely on 'conditions' to gate play; here we just enforce the cap/raise for this turn.
        if (e.setBabeLimitTo != null) {
          updatedLimits.babes = Math.max(updatedLimits.babes, e.setBabeLimitTo);
          log.push(`Set Babe Limit${e.name ? ` [${e.name}]` : ""}: limit → ${updatedLimits.babes}`);
        }
        break;
      }

      case "multiply-babe": {
        const factor = e.factor ?? 1;
        // allow targeting by id or by name
        const target =
          findBabeById(e.boundTargetBabeId || e.targetBabeId) ||
          findBabeByName(e.targetName);
        if (e.onlyBabePlayedName && !onlyBabePlayed(e.onlyBabePlayedName)) {
          log.push(`(multiply-babe${e.name ? ` [${e.name}]` : ""} skipped: not the only babe)`);
          break;
        }
        if (target) {
          const prev = babeScores.get(target.playId) ?? target.baseScore;
          const next = prev * factor;
          babeScores.set(target.playId, next);
          log.push(`Multiply Babe${e.name ? ` [${e.name}]` : ""}: ${target.name} ×${factor} ⇒ ${prev} → ${next}`);
        } else {
          log.push(`(multiply-babe${e.name ? ` [${e.name}]` : ""} skipped: no target)`);
        }
        break;
      }

      case "multiply-type": {
        const factor = e.factor ?? 1;
        const t = e.boundTargetType || e.targetType;
        const matches = babes.filter((b) => (t ? b.type === t : true));
        if (matches.length === 0) {
          log.push(`(multiply-type${e.name ? ` [${e.name}]` : ""} skipped: no type ${t ?? "(any)"} )`);
          break;
        }
        for (const b of matches) {
          const prev = babeScores.get(b.playId) ?? b.baseScore;
          babeScores.set(b.playId, prev * factor);
        }
        log.push(`Multiply Type${e.name ? ` [${e.name}]` : ""}: ${t ?? "Any"} ×${factor} on [${matches.map(m => m.name).join(", ")}]`);
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
        finalOps.push({ kind: "discard-babes-add-final", totalAdd, details: selected, need: e.discardCount ?? 0, name: e.name });
        break;
      }

      case "use-discard-add-final": {
        const selected = e.boundFromDiscard ?? [];
        const totalAdd = selected.reduce((acc, d) => acc + (d.baseScore || 0), 0);
        finalOps.push({ kind: "use-discard-add-final", totalAdd, details: selected, need: e.selectCount ?? 0, name: e.name });
        break;
      }

      case "play-from-discard": {
        log.push(`Play from Discard${e.name ? ` [${e.name}]` : ""}: ${(e.boundPlayedFromDiscard?.length ?? 0)} selected`);
        break;
      }

      case "discard-different-then-multiply-final": {
        const picked = e.boundDiscards ?? [];
        const distinct = new Set(picked.map(p => p.type)).size;
        const need = e.discardCount ?? 3;
        const ok = picked.length >= need && distinct >= need;
        finalOps.push({
          kind: "discard-different-then-multiply-final",
          ok,
          factor: e.factor ?? 2,
          picked,
          need,
          name: e.name
        });
        break;
      }

      // NEW: schedule-only modifier (e.g., Delish-Ious)
      case "next-turn-modifier": {
        // Nothing immediate to apply here; scheduling is handled at endTurn in useTurn.
        log.push(`Next-turn Modifier${e.name ? ` [${e.name}]` : ""} queued if conditions met.`);
        break;
      }

      // NEW: multi-turn modifier (e.g., Late Bloomer)
      case "multi-turn-modifier": {
        // If it includes an immediate multiply for a specific babe, apply it now (when only-babe condition true)
        if (e.onlyBabePlayedName && e.targetName && e.factor && onlyBabePlayed(e.onlyBabePlayedName)) {
          const target = findBabeByName(e.targetName);
          if (target) {
            const prev = babeScores.get(target.playId) ?? target.baseScore;
            const next = prev * e.factor;
            babeScores.set(target.playId, next);
            log.push(`Multi-Turn Now${e.name ? ` [${e.name}]` : ""}: ${target.name} ×${e.factor} ⇒ ${prev} → ${next}`);
          }
        } else {
          log.push(`(multi-turn ${e.name ?? ""}: no immediate multiply applied)`);
        }
        // Scheduling is applied in useTurn at endTurn
        break;
      }

      default:
        log.push(`(unhandled effect kind: ${(e as any).kind})`);
    }
  }

  const baseSum = babes.reduce((acc, b) => acc + (b.baseScore || 0), 0);
  const mutatedSum = babes.reduce((acc, b) => acc + (babeScores.get(b.playId) ?? b.baseScore), 0);

  // Apply pending NEXT-turn buffs first (if any)
  let final = mutatedSum;
  if (pending?.addNext) {
    const before = final;
    final = before + pending.addNext;
    log.push(`Next-turn carryover: +${pending.addNext} ⇒ ${before} → ${final}`);
  }
  if (pending?.multNext) {
    const before = final;
    final = before * pending.multNext;
    log.push(`Next-turn carryover: ×${pending.multNext} ⇒ ${before} → ${final}`);
  }

  // Apply final ops in order
  for (const op of finalOps) {
    const before = final;
    if (op.kind === "add-final") {
      final = before + op.add;
      log.push(`Final${op.name ? ` [${op.name}]` : ""}: +${op.add} ⇒ ${before} → ${final}`);
    } else if (op.kind === "multiply-final") {
      final = before * op.factor;
      log.push(`Final${op.name ? ` [${op.name}]` : ""}: ×${op.factor} ⇒ ${before} → ${final}`);
    } else if (op.kind === "discard-babes-add-final") {
      if (op.details.length === 0) log.push(`Final${op.name ? ` [${op.name}]` : ""}: Discard ${op.need} ⇒ +0`);
      else {
        const names = op.details.map(d => d.name).join(", ");
        final = before + op.totalAdd;
        log.push(`Final${op.name ? ` [${op.name}]` : ""}: Discarded [${names}] (+${op.totalAdd}) ⇒ ${before} → ${final}`);
      }
    } else if (op.kind === "use-discard-add-final") {
      if (op.details.length === 0) log.push(`Final${op.name ? ` [${op.name}]` : ""}: Use ${op.need} from Discard ⇒ +0`);
      else {
        const names = op.details.map(d => d.name).join(", ");
        final = before + op.totalAdd;
        log.push(`Final${op.name ? ` [${op.name}]` : ""}: Used [${names}] (+${op.totalAdd}) ⇒ ${before} → ${final}`);
      }
    } else if (op.kind === "discard-different-then-multiply-final") {
      if (!op.ok) {
        log.push(`Final${op.name ? ` [${op.name}]` : ""}: Need ${op.need} different types ⇒ skipped`);
      } else {
        const names = op.picked.map(p => p.name).join(", ");
        final = before * op.factor;
        log.push(`Final${op.name ? ` [${op.name}]` : ""}: Trifecta [${names}] ×${op.factor} ⇒ ${before} → ${final}`);
      }
    }
  }

  const finalScore = Math.max(0, Math.round(final));
  return { finalScore, mutatedSum, baseSum, log, updatedLimits, babeScores };
}
