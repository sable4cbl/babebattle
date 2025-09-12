import {
  BoundTargets,
  EffectScript,
  EngineDelta,
  EngineRunResult,
  MinimalBabe,
  MinimalTurnState,
  Requirement,
  ScoreMod,
  TargetSelector,
} from "../types/effects";

// --------- Requirements ---------

export function requirementsMet(
  reqs: Requirement[] | undefined,
  state: MinimalTurnState
): boolean {
  if (!reqs || reqs.length === 0) return true;
  for (const r of reqs) {
    switch (r.kind) {
      case "only-babe-played": {
        const only =
          state.playedBabes.length === 1 &&
          state.playedBabes[0].name.toLowerCase().includes(r.name.toLowerCase());
        if (!only) return false;
        break;
      }
      case "played-has-babe": {
        const ok = state.playedBabes.some((b) =>
          b.name.toLowerCase().includes(r.name.toLowerCase())
        );
        if (!ok) return false;
        break;
      }
      case "discard-has-babe": {
        const ok = state.discardBabes.some((b) =>
          b.name.toLowerCase().includes(r.name.toLowerCase())
        );
        if (!ok) return false;
        break;
      }
      case "min-babes-played":
        if (state.playedBabes.length < r.count) return false;
        break;
      case "only-effect-this-turn":
        if (state.effectsPlayedCount !== 0) return false;
        break;
    }
  }
  return true;
}

// --------- Target eligibility helpers ---------

export function eligibleBabeIdsFromSelector(
  sel: TargetSelector | undefined,
  babesInPlay: MinimalBabe[]
): string[] {
  if (!sel || sel.kind === "none" || sel.kind === "from-discard" || sel.kind === "from-deck")
    return [];
  const ofType = sel.ofType;
  return babesInPlay.filter((b) => !ofType || b.type === ofType).map((b) => b.id);
}

export function eligibleDiscardBabeIds(sel: TargetSelector | undefined, discard: MinimalBabe[]) {
  if (!sel || sel.kind !== "from-discard") return [];
  const ofType = sel.ofType;
  return discard.filter((b) => !ofType || b.type === ofType).map((b) => b.id);
}

export function eligibleDeckBabeIds(sel: TargetSelector | undefined, deck: MinimalBabe[]) {
  if (!sel || sel.kind !== "from-deck") return [];
  const ofType = sel.ofType;
  return deck.filter((b) => !ofType || b.type === ofType).map((b) => b.id);
}

export function validateTargetSelection(
  sel: TargetSelector | undefined,
  chosen: BoundTargets,
  babesInPlay: MinimalBabe[],
  discard: MinimalBabe[],
  deck: MinimalBabe[]
): string | null {
  if (!sel || sel.kind === "none") return null;

  if (sel.kind === "one-babe") {
    const ids = chosen.babeIds ?? [];
    if (ids.length !== 1) return "Select exactly 1 babe.";
    const b = babesInPlay.find((x) => x.id === ids[0]);
    if (!b) return "Invalid babe selection.";
    if (sel.ofType && b.type !== sel.ofType) return `Selected babe must be ${sel.ofType}.`;
    return null;
  }

  if (sel.kind === "many-babes") {
    const ids = chosen.babeIds ?? [];
    if (ids.length < sel.min || ids.length > sel.max) return `Select ${sel.min} to ${sel.max} babes.`;
    const bs = ids.map((id) => babesInPlay.find((x) => x.id === id)).filter(Boolean) as MinimalBabe[];
    if (bs.length !== ids.length) return "Invalid babe selection.";
    if (sel.ofType && bs.some((b) => b.type !== sel.ofType)) return `All selected babes must be ${sel.ofType}.`;
    if (sel.distinctTypes) {
      const set = new Set(bs.map((b) => b.type));
      if (set.size !== bs.length) return "Selected babes must have different types.";
    }
    return null;
  }

  if (sel.kind === "from-discard") {
    const ids = chosen.discardBabeIds ?? [];
    if (ids.length < sel.min || ids.length > sel.max)
      return `Select ${sel.min} to ${sel.max} from discard.`;
    const ds = ids.map((id) => discard.find((x) => x.id === id)).filter(Boolean) as MinimalBabe[];
    if (ds.length !== ids.length) return "Invalid discard selection.";
    if (sel.ofType && ds.some((b) => b.type !== sel.ofType))
      return `All selected must be ${sel.ofType}.`;
    return null;
  }

  if (sel.kind === "from-deck") {
    const ids = chosen.deckBabeIds ?? [];
    if (ids.length < sel.min || ids.length > sel.max)
      return `Select ${sel.min} to ${sel.max} from deck.`;
    const ds = ids.map((id) => deck.find((x) => x.id === id)).filter(Boolean) as MinimalBabe[];
    if (ds.length !== ids.length) return "Invalid deck selection.";
    if (sel.ofType && ds.some((b) => b.type !== sel.ofType))
      return `All selected must be ${sel.ofType}.`;
    if (sel.distinctTypes) {
      const set = new Set(ds.map((b) => b.type));
      if (set.size !== ds.length) return "Selected must have different types.";
    }
    return null;
  }

  return "Unsupported target selector.";
}

// --------- Score mods to deltas ---------

function scoreModToDeltas(
  mod: ScoreMod,
  chosen: BoundTargets,
  babesInPlay: MinimalBabe[]
): EngineDelta[] {
  if (mod.scope === "final") {
    return [mod.op === "add" ? { t: "add-final", amount: mod.amount } : { t: "mult-final", amount: mod.amount }];
  }
  const ids: string[] = [];
  if (mod.appliesTo === "targets") {
    if (chosen.babeIds?.length) ids.push(...chosen.babeIds);
  } else if (mod.appliesTo === "type" && mod.type) {
    ids.push(...babesInPlay.filter((b) => b.type === mod.type).map((b) => b.id));
  }
  if (ids.length === 0) return [];
  return ids.map((id) =>
    mod.op === "add" ? { t: "babe-add", babeId: id, amount: mod.amount } : { t: "babe-mult", babeId: id, amount: mod.amount }
  );
}

// --------- Run effect ---------

export function runEffect(
  script: EffectScript,
  chosen: BoundTargets,
  state: MinimalTurnState
): EngineRunResult {
  const deltas: EngineDelta[] = [];

  // cost
  if (script.cost && script.cost !== 0) deltas.push({ t: "strokes", change: -Math.abs(script.cost) });
  // limits
  if (script.limits && script.limits.length) for (const p of script.limits) deltas.push({ t: "limit-change", patch: p });
  // score
  if (script.score && script.score.length)
    for (const m of script.score) deltas.push(...scoreModToDeltas(m, chosen, state.playedBabes));

  // explicit discard semantics
  if (script.discardSelectedTargets) {
    if (chosen.babeIds?.length) deltas.push({ t: "discard-babes", ids: [...chosen.babeIds] });
    if (chosen.deckBabeIds?.length) deltas.push({ t: "discard-from-deck", ids: [...chosen.deckBabeIds] });
  }

  // from-discard action
  if (script.target?.kind === "from-discard" && chosen.discardBabeIds?.length) {
    const action = script.target.action || "read";
    if (action === "play") {
      deltas.push({ t: "play-from-discard", ids: [...chosen.discardBabeIds], ignoreLimit: !!script.target.ignoreBabeLimit });
    }
  }

  // future turn
  if (script.future && (script.future.nextAdd || script.future.nextMult)) {
    deltas.push({ t: "future-next", add: script.future.nextAdd, mult: script.future.nextMult });
  }

  return { deltas, bound: chosen };
}
