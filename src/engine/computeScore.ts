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

  // Collect final-scope operations to enforce ordering: all adds before any multipliers
  const finalAddQueue: Array<{ name: string; amount: number }> = [];
  const finalMultQueue: Array<{ name: string; mult: number }> = [];

  for (const e of state.playedEffects) {
    if (!e.score || e.score.length === 0) continue;

    for (const op of e.score) {
      // Special case: Blooming Blossom — if Blake Blossom was played this turn, triple her
      if (
        e.name === "Blooming Blossom" &&
        (op as any)?.scope === "babe" && (op as any)?.op === "mult"
      ) {
        const blakes = score.perBabe.filter(b => (b.name || "").toUpperCase().startsWith("BLAKE BLOSSOM"));
        if (blakes.length > 0) {
          for (const t of blakes) t.mult *= 3;
          log.push(`${e.name}: ×3 → ${blakes.map(t=>t.name).join(", ")}`);
          final = score.perBabe.reduce((a,x)=>a+x.total,0);
        }
        continue;
      }
      // Special case: Late Bloomer conditional triple (only if Emily Bloom is the only babe played)
      if (
        e.name === "Late Bloomer" &&
        (op as any)?.scope === "babe" && (op as any)?.appliesTo === "all-of-type" && (op as any)?.ofType === "BADDIE"
      ) {
        const onlyEmily =
          state.playedBabes.length === 1 &&
          (state.playedBabes[0].name || "").toUpperCase().startsWith("EMILY BLOOM");
        if (!onlyEmily) {
          // Skip this op if condition not met; continue to next op
          continue;
        }
      }
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
        finalAddQueue.push({ name: e.name, amount: addAmt });
        continue;
      }
      if (op.scope === "final") {
        if (op.op === "add") {
          finalAddQueue.push({ name: e.name, amount: op.amount });
        } else if (op.op === "mult") {
          finalMultQueue.push({ name: e.name, mult: op.amount });
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
          finalAddQueue.push({ name: e.name, amount: addAmt });
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

  // Incorporate carry-over adds/mults into the same ordered queues so that
  // all adds (current + carry) happen before any multipliers (current + carry).
  if (state.pendingNext?.addNext) {
    const sources = state.pendingNext.addNextSources;
    if (sources && sources.length) {
      for (const s of sources) {
        finalAddQueue.push({ name: `${s.name} (carry-over)`, amount: s.amount });
      }
    } else {
      finalAddQueue.push({ name: 'Carry-over', amount: state.pendingNext.addNext });
    }
  }
  if (state.pendingNext?.multNext) {
    const sources = (state.pendingNext as any).multNextSources as Array<{ name: string; mult: number }> | undefined;
    if (sources && sources.length) {
      for (const s of sources) {
        finalMultQueue.push({ name: `${s.name} (carry-over)`, mult: s.mult });
      }
    } else {
      finalMultQueue.push({ name: 'Carry-over', mult: state.pendingNext.multNext });
    }
  }

  // Apply all collected Final adds first
  if (finalAddQueue.length) {
    for (const a of finalAddQueue) {
      final += a.amount;
      log.push(`${a.name}: +${a.amount} Final`);
      overallOps.push({ name: a.name, op: "add", amount: a.amount });
    }
  }
  // Then apply Final multipliers in order
  if (finalMultQueue.length) {
    for (const m of finalMultQueue) {
      final *= m.mult;
      log.push(`${m.name}: x${m.mult} Final`);
      overallOps.push({ name: m.name, op: "mult", amount: m.mult });
    }
  }

  score.finalAfter = Math.round(final);
  const nextPending = collectNextPending(
    state.playedEffects,
    state.playedBabes,
    state.discardPile,
    state.playedHistoryBabeNames || [],
    log
  ) || {};
  // Shift any existing turn+2 adds down to next turn, preserving source labels
  if (state.pendingNext?.addNextNext) {
    (nextPending as any).addNext = ((nextPending as any).addNext || 0) + state.pendingNext.addNextNext;
    const shiftedSources = (state.pendingNext as any).addNextNextSources as Array<{ name: string; amount: number }> | undefined;
    if (shiftedSources && shiftedSources.length) {
      (nextPending as any).addNextSources = [
        ...(((nextPending as any).addNextSources as Array<{ name: string; amount: number }>) || []),
        ...shiftedSources,
      ];
    }
  }
  const limits = computeLimits(state.playedEffects);

  return { score, limits, nextPending: (Object.keys(nextPending).length ? nextPending : undefined), log, overallOps };
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

function collectNextPending(
  effects: BoundEffect[],
  playedBabes: BabeCard[],
  discardBabes: BabeCard[],
  playedHistoryNames: string[],
  log: string[]
): PendingNext | undefined {
  let add = 0, mult = 1;
  let replay: string[] = [];
  let ignoreLimit = false;
  const babeMultNext: Record<string, number> = {};
  let addNextNext = 0;
  const addNextSources: Array<{ name: string; amount: number }> = [];
  const addNextNextSources: Array<{ name: string; amount: number }> = [];
  const multNextSources: Array<{ name: string; mult: number }> = [];
  let effectStrokesLastTurn = 0;
  for (const e of effects) {
    const f = e.future; if (!f) continue;
    if (typeof f.nextAdd === "number") { add += f.nextAdd; addNextSources.push({ name: e.name, amount: f.nextAdd }); log.push(`${e.name}: next +${f.nextAdd}`); }
    if (typeof f.nextMult === "number") {
      // Special case: Delish-Ious only doubles next turn if Alice Delish is the only babe played
      if (e.name === "Delish-Ious") {
        const onlyAlice =
          playedBabes.length === 1 &&
          (playedBabes[0].name || "").toUpperCase().startsWith("ALICE DELISH");
        if (!onlyAlice) {
          // Skip, condition not met
        } else {
          mult *= f.nextMult; multNextSources.push({ name: e.name, mult: f.nextMult }); log.push(`${e.name}: next x${f.nextMult}`);
        }
      } else if (e.name === "Wilde Card") {
        // Wilde Card: if you played Lucie Wilde this game (in play or in discard), double next turn
        const inPlay = playedBabes.some(b => (b.name || "").toUpperCase().startsWith("LUCIE WILDE"));
        const inDiscard = discardBabes.some(b => (b.name || "").toUpperCase().startsWith("LUCIE WILDE"));
        const inHistory = playedHistoryNames?.some?.(n => (n || "").toUpperCase().startsWith("LUCIE WILDE"));
        if (inPlay || inDiscard || inHistory) {
          mult *= f.nextMult; multNextSources.push({ name: e.name, mult: f.nextMult }); log.push(`${e.name}: next x${f.nextMult}`);
        }
      } else {
        mult *= f.nextMult; multNextSources.push({ name: e.name, mult: f.nextMult }); log.push(`${e.name}: next x${f.nextMult}`);
      }
    }
    if (f.replayBabeNextTurn && e.boundTargetIds && e.boundTargetIds.length) {
      replay = replay.concat(e.boundTargetIds);
    }
    if (f.ignoreBabeLimitNext) ignoreLimit = true;
    if (typeof f.targetsNextTurnMult === "number" && e.boundTargetIds && e.boundTargetIds.length) {
      for (const id of e.boundTargetIds) babeMultNext[id] = f.targetsNextTurnMult;
      log.push(`${e.name}: next chosen target x${f.targetsNextTurnMult}`);
    }
    if (typeof f.addNextNext === "number") {
      addNextNext += f.addNextNext; addNextNextSources.push({ name: e.name, amount: f.addNextNext });
      log.push(`${e.name}: +${f.addNextNext} in 2 turns`);
    }
  }
  // Sum strokes paid for effects this turn
  try {
    effectStrokesLastTurn = effects.reduce((s, e: any) => s + (typeof e?.strokeCost === 'number' ? e.strokeCost : 0), 0);
  } catch {}
  const payload: PendingNext = {};
  if (add !== 0) payload.addNext = add;
  if (mult !== 1) payload.multNext = mult;
  if (effectStrokesLastTurn > 0) (payload as any).effectStrokesLastTurn = effectStrokesLastTurn;
  if (replay.length) payload.replayBabeIds = Array.from(new Set(replay));
  if (ignoreLimit) payload.ignoreBabeLimitNext = true;
  if (Object.keys(babeMultNext).length) payload.babeMultNext = babeMultNext;
  if (addNextNext !== 0) payload.addNextNext = addNextNext;
  if (addNextSources.length) payload.addNextSources = addNextSources;
  if (addNextNextSources.length) payload.addNextNextSources = addNextNextSources;
  if (multNextSources.length) (payload as any).multNextSources = multNextSources;
  return Object.keys(payload).length ? payload : undefined;
}






