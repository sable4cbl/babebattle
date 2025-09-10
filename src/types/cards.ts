export type BabeType = "BADDIE" | "BUSTY" | "BIMBO" | "MILF" | "PAWG" | string;

export type BabeCard = {
  id: string;
  name: string;
  type: BabeType;
  baseScore: number;

  // Media (local GIF support)
  img?: string;       // optional URL fallback
  gifName?: string;   // explicit filename, e.g. "BUSTY Lucie Wilde.gif"

  strokesCost?: number;
};

export type EffectKind =
  | "multiply-babe"
  | "multiply-type"
  | "multiply-all"
  | "add-final"
  | "multiply-final"
  | "extra-plays"
  | "discard-babes-add-final"
  | "use-discard-add-final"
  | "play-from-discard"
  | "discard-different-then-multiply-final" // Trifecta: discard 3 different types, then ×final
  | "set-babe-limit"                        // e.g., Jeanie Wishes
  | "next-turn-modifier"                    // e.g., Delish-Ious: schedule next-turn multiplier/add
  | "multi-turn-modifier";                  // e.g., Late Bloomer: immediate multiply + schedule adds

export type EffectCard = {
  id: string;
  name: string;
  description?: string;
  kind: EffectKind;

  // Media (local GIF support)
  img?: string;         // optional URL fallback
  gifName?: string;     // explicit filename for GIF, e.g., "EFFECT Trifecta.gif"
  gifPerformerTagUpper?: string; // helps resolver: "ELSA JEAN"
  gifTypeTagUpper?: string;      // helps resolver: "BADDIE"

  // Costs/limits flags
  strokesCost?: number;
  ignoreBabeLimit?: boolean;
  ignoreEffectLimit?: boolean; // playing THIS effect won't consume an effect slot

  // Multipliers / adders (immediate or final)
  factor?: number;         // for multiply-* / multiply-final
  add?: number;            // for add-final

  // Targeting for multipliers
  targetBabeId?: string;   // multiply-babe by id
  targetName?: string;     // multiply-babe by name
  targetType?: BabeType;   // multiply-type

  // Extra/Set plays
  extraBabes?: number;     // extra-plays (+delta)
  extraEffects?: number;   // extra-plays (+delta)
  setBabeLimitTo?: number; // set-babe-limit (absolute/min cap for this turn)

  // From Deck discards
  discardCount?: number;
  discardType?: BabeType;
  requireDistinctTypes?: boolean; // Trifecta

  // From Discard reading/playing
  selectCount?: number;
  selectType?: BabeType;

  // Generic conditions (used by signatures)
  onlyBabePlayedName?: string;   // condition: only this babe played this turn
  requiresDiscardName?: string;  // condition: specific babe must be in Discard

  // Scheduling payload for next/multi-turn effects
  schedule?: {
    // For next-turn-modifier
    multNext?: number;
    addNext?: number;
    // For multi-turn-modifier (turn+2)
    addTurn2?: number;
  };
};

export type PlayedBabe = BabeCard & { playId: string };

export type BoundDiscard = { id: string; name: string; baseScore: number; type: BabeType };
export type BoundPlayedFromDiscard = { snapshot: BoundDiscard; playId: string };

export type PlayedEffect = EffectCard & {
  playId: string;
  // bindings captured during targeting / resolution
  boundTargetBabeId?: string;
  boundTargetType?: BabeType;
  boundDiscards?: BoundDiscard[];
  boundFromDiscard?: BoundDiscard[];
  boundPlayedFromDiscard?: BoundPlayedFromDiscard[];
};
