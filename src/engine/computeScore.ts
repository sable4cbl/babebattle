import type { BoundEffect, EngineResult, EngineState, PendingNext, ScoreBreakdown, ScoreOp, OverallOp } from "../types/effects";
import type { BabeCard } from "../types/cards";
import { computeLimits } from "./limits";

export function computeScore(state: EngineState): EngineResult {
  const log: string[] = [];
  const overallOps: OverallOp[] = [];
  const perBabe = state.playedBabes.map(b => ({
    id: b.id, name: b.name, type: b.type,
    base: b.baseScore ?? 0, delta: 0, mult: 1,
    get total() { return Math.round((this.base + this.delta) * this.mult); },
  }));

  const score: ScoreBreakdown = {
    baseSum: perBabe.reduce((a,x)=>a+x.base,0),
    perBabe, finalBefore: 0, finalAfter: 0,
  };

  let final = score.baseSum;

  // Apply any next-turn per-babe multipliers (babeMultNext) for babes played this turn
  if (state.pendingNext?.babeMultNext) {
    for (const b of perBabe) {
      const m = state.pendingNext.babeMultNext[b.id];
      if (typeof m === "number" && m !== 1) {
        b.mult *= m;
        log.push(`Carry-over: ${b.name} x${m}`);
      }
    }
    // Recompute base sum-derived final after applying multipliers
    final = perBabe.reduce((a, x) => a + x.total, 0);
  }

  for (const e of state.playedEffects) {
    if (!e.score || e.score.length === 0) continue;

    for (const op of e.score) {
      if (op.scope === "final-per-babe") {
        if (op.whenAllPlayedAreType) {
          const allMatch = state.playedBabes.length > 0 && state.playedBabes.every(b => b.type === op.whenAllPlayedAreType);
          if (!allMatch) {
            continue;
          }
        }
        const count = op.ofType
          ? state.playedBabes.filter((b) => b.type === op.ofType).length
          : state.playedBabes.length;
        const addAmt = op.amount * count;
        final += addAmt;
        log.push(`${e.name}: +${addAmt} Final`);
        overallOps.push({ name: e.name, op: "add", amount: addAmt });
        continue;
      }
      if (op.scope === "final") {
        if (op.op === "add") {
          final += op.amount;
          log.push(`${e.name}: +${op.amount} Final`);
          overallOps.push({ name: e.name, op: "add", amount: op.amount });
        } else if (op.op === "mult") {
          final *= op.amount;
          log.push(`${e.name}: x${op.amount} Final`);
          overallOps.push({ name: e.name, op: "mult", amount: op.amount });
        } else if (op.op === "add-target-base") {
          const ids = new Set(e.boundTargetIds ?? []);
          // Always add the chosen babe's original base score, regardless of current zone.
          // Look up in played babes first, then fall back to discard.
          let baseSum = 0;
          if (ids.size) {
            for (const id of ids) {
              const inPlay = state.playedBabes.find(b => b.id === id);
              if (inPlay) { baseSum += inPlay.baseScore ?? 0; continue; }
              const inDiscard = state.discardPile.find(b => b.id === id);
              if (inDiscard) { baseSum += inDiscard.baseScore ?? 0; }
            }
          }
          const onlyEffect = state.playedEffects.length === 1;
          const mult = onlyEffect && typeof op.whenOnlyEffectMultiplier === "number"
            ? op.whenOnlyEffectMultiplier
            : op.multiplier;
          const addAmt = baseSum * mult;
          final += addAmt;
          log.push(`${e.name}: +${addAmt} Final`);
          overallOps.push({ name: e.name, op: "add", amount: addAmt });
        }
        continue;
      }

      const targets = resolveBabeTargets(e, perBabe, op);
      if (targets.length === 0) continue;

      if (op.op === "add") { for (const t of targets) t.delta += op.amount; log.push(`${e.name}: +${op.amount} → ${targets.map(t=>t.name).join(", ")}`); }
      else { for (const t of targets) t.mult *= op.amount; log.push(`${e.name}: ×${op.amount} → ${targets.map(t=>t.name).join(", ")}`); }

      final = perBabe.reduce((a,x)=>a+x.total,0);
    }
  }

  // Sum of per-babe totals only (before any overall/final-scope or carry-over ops)
  score.finalBefore = perBabe.reduce((a, x) => a + x.total, 0);

  if (state.pendingNext?.addNext) { final += state.pendingNext.addNext; log.push(`Carry-over: +${state.pendingNext.addNext}`); overallOps.push({ name: "Carry-over", op: "carry-add", amount: state.pendingNext.addNext }); }
  if (state.pendingNext?.multNext) {
    final *= state.pendingNext.multNext;
    log.push(`Carry-over: x${state.pendingNext.multNext}`);
    overallOps.push({ name: "Carry-over", op: "carry-mult", amount: state.pendingNext.multNext });
  }

  score.finalAfter = Math.round(final);
  const nextPending = collectNextPending(state.playedEffects, log);
  const limits = computeLimits(state.playedEffects);

  return { score, limits, nextPending, log, overallOps };
}

function resolveBabeTargets(
  e: BoundEffect,
  perBabe: ScoreBreakdown["perBabe"],
  op: Extract<ScoreOp, { scope: "babe" }>
) {
  if (op.appliesTo === "all-of-type") {
    const t = op.ofType ?? e.boundTargetType;
    if (!t) return [];
    return perBabe.filter(b => b.type === t);
  }
  const ids = new Set(e.boundTargetIds ?? []);
  return perBabe.filter(b => ids.has(b.id));
}

function collectNextPending(effects: BoundEffect[], log: string[]): PendingNext | undefined {
  let add = 0, mult = 1;
  let replay: string[] = [];
  let ignoreLimit = false;
  const babeMultNext: Record<string, number> = {};
  for (const e of effects) {
    const f = e.future; if (!f) continue;
    if (typeof f.nextAdd === "number") { add += f.nextAdd; log.push(`${e.name}: next +${f.nextAdd}`); }
    if (typeof f.nextMult === "number") { mult *= f.nextMult; log.push(`${e.name}: next x${f.nextMult}`); }
    if (f.replayBabeNextTurn && e.boundTargetIds && e.boundTargetIds.length) {
      replay = replay.concat(e.boundTargetIds);
    }
    if (f.ignoreBabeLimitNext) ignoreLimit = true;
    if (typeof f.targetsNextTurnMult === "number" && e.boundTargetIds && e.boundTargetIds.length) {
      for (const id of e.boundTargetIds) babeMultNext[id] = f.targetsNextTurnMult;
      log.push(`${e.name}: next chosen target x${f.targetsNextTurnMult}`);
    }
  }
  const payload: PendingNext = {};
  if (add !== 0) payload.addNext = add;
  if (mult !== 1) payload.multNext = mult;
  if (replay.length) payload.replayBabeIds = Array.from(new Set(replay));
  if (ignoreLimit) payload.ignoreBabeLimitNext = true;
  if (Object.keys(babeMultNext).length) payload.babeMultNext = babeMultNext;
  return Object.keys(payload).length ? payload : undefined;
}












