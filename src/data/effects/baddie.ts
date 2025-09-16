import type { EffectScript } from "../../types/effects";
import { uid } from "../../utils/uid";

export const BADDIE_EFFECTS: EffectScript[] = [
    { // Double Base Score
    id: uid(),
    name: "She's a Rider",
    group: "BADDIE",
    target: { kind: "one-babe", ofType: "BADDIE" },
    score: [{ scope: "babe", appliesTo: "targets", op: "mult", amount: 2 }],
    description: "Choose 1 BADDIE you played this turn; double her Base Score.",
    gifName: "EFFECT BADDIE She's a Rider.gif",
  },
    { // Triple Base Score
    id: uid(),
    name: "She Can Take It!",
    group: "BADDIE",
    target: { kind: "one-babe", ofType: "BADDIE" },
    score: [{ scope: "babe", appliesTo: "targets", op: "mult", amount: 3 }],
    description: "Choose 1 BADDIE you played this turn; triple her Base Score.",
    gifName: "EFFECT BADDIE She Can Take It!.gif",
  },
  {
    id: uid(),
    name: "Measuring Time",
    group: "BADDIE",
    target: { kind: "one-babe", ofType: "BADDIE", from: "discard" },
    description:
      "Choose 1 BADDIE from your Discard; play her this turn ignoring Babe Limit. Optionally double her Base Score by paying 20 Strokes.",
    onRemove: { undoDiscardedTargets: true },
    gifName: "EFFECT BADDIE Measuring Time.gif",
  },
  {
    id: uid(),
    name: "Baddie Brigade",
    group: "BADDIE",
    requires: [{ kind: "discard-has-type-at-least", type: "BADDIE", count: 5 }],
    target: { kind: "none" },
    score: [{ scope: "final", op: "mult", amount: 2 }],
    limits: [{ capEffectLimitTo: 1 }],
    description:
      "If 5 or more BADDIE babes are in your discard, double the Final Score. You cannot play other Effect cards this turn.",
    gifName: "EFFECT BADDIE Baddie Brigade.gif",
  },
  {
    id: uid(),
    name: "Collab",
    group: "BADDIE",
    target: { kind: "many-babes", min: 2, max: 2, ofType: "BADDIE" },
    score: [{ scope: "babe", appliesTo: "targets", op: "mult", amount: 2 }],
    description: "If you played 2 BADDIES this turn, double their base scores.",
    gifName: "EFFECT BADDIE Collab.gif",
  },


  {
    id: uid(),
    name: "Teasing Together",
    group: "BADDIE",
    target: { kind: "none" },
    score: [{ scope: "final-per-babe", ofType: "BADDIE", amount: 5 }],
    description: "Add 5 Score for each BADDIE you played this turn.",
    gifName: "EFFECT BADDIE Teasing Together.gif",
  },
  {
    id: uid(),
    name: "Intimate Dreams",
    group: "BADDIE",
    target: { kind: "one-babe", ofType: "BADDIE", from: "discard" },
    score: [
      { scope: "final", op: "add-target-base", multiplier: 1, whenOnlyEffectMultiplier: 3 },
    ],
    description:
      "Choose 1 BADDIE in either Discard Pile; add her Base Score to the Final Score. If this is the only Effect Card you played this turn, add triple the chosen BADDIE's Base Score to the Final Score instead.",
    gifName: "EFFECT BADDIE Intimate Dreams.gif",
  },
  {
    id: uid(),
    name: "Link In Bio",
    group: "BADDIE",
    target: { kind: "one-babe", ofType: "BADDIE" },
    score: [{ scope: "babe", appliesTo: "targets", op: "mult", amount: 3 }],
    future: { replayBabeNextTurn: true },
    description:
      "Choose 1 BADDIE you played this turn; triple her Base Score. You can play the chosen BADDIE again next turn, ignoring Babe Limit.",
    gifName: "EFFECT BADDIE Link In Bio.gif",
  },
];

