import type { EffectScript } from "../../types/effects";
import { uid } from "../../utils/uid";
import { stubEffect } from "./helpers";

const implemented: EffectScript[] = [
    { // Double Base Score
    id: uid(),
    name: "Boobs In Yo Face",
    group: "BUSTY",
    target: { kind: "one-babe", ofType: "BUSTY" },
    score: [{ scope: "babe", appliesTo: "targets", op: "mult", amount: 2 }],
    description: "Choose 1 BUSTY you played this turn; double her Base Score.",
    gifName: "EFFECT BUSTY Boobs In Yo Face.gif",
  },
  { // Pay 15 Strokes, play from discard, double her base
    id: uid(),
    name: "Cheer Me Up",
    group: "BUSTY",
    target: { kind: "one-babe", ofType: "BUSTY", from: "discard" },
    limits: [{ consumesBabeSlot: true }],
    score: [{ scope: "babe", appliesTo: "targets", op: "mult", amount: 2 }],
    onRemove: { undoDiscardedTargets: true },
    description: "Pay 15 Strokes. Choose 1 BUSTY Babe from your Discard Pile; play her this turn and double her Base Score.",
    gifName: "EFFECT BUSTY Cheer Me Up.gif",
  },
  { // Only BUSTY can be played; triple all BUSTY
    id: uid(),
    name: "Breast Is Best",
    group: "BUSTY",
    target: { kind: "none" },
    limits: [{ restrictBabeTypeTo: "BUSTY" }],
    score: [{ scope: "babe", appliesTo: "all-of-type", ofType: "BUSTY", op: "mult", amount: 3 }],
    description: "You can only play BUSTY Babes this turn, but triple each one's Base Score.",
    gifName: "EFFECT BUSTY Breast Is Best.gif",
  },
    { // Triple Base Score
    id: uid(),
    name: "Bouncing Boobies",
    group: "BUSTY",
    target: { kind: "one-babe", ofType: "BUSTY" },
    score: [{ scope: "babe", appliesTo: "targets", op: "mult", amount: 3 }],
    description: "Choose 1 BUSTY you played this turn; triple her Base Score.",
    gifName: "EFFECT BUSTY Bouncing Boobies.gif",
  },
  { // Triple all BUSTY babes this turn (ignore opponent clause)
    id: uid(),
    name: "Boobzooka",
    group: "BUSTY",
    target: { kind: "none" },
    score: [{ scope: "babe", appliesTo: "all-of-type", ofType: "BUSTY", op: "mult", amount: 3 }],
    description: "Triple the Base Score of each BUSTY Babe you played this turn.",
    gifName: "EFFECT BUSTY Boobzooka.gif",
  },
  { // Triple chosen BUSTY in play; pay her new base in strokes
    id: uid(),
    name: "Sun Dress",
    group: "BUSTY",
    target: { kind: "one-babe", ofType: "BUSTY" },
    score: [{ scope: "babe", appliesTo: "targets", op: "mult", amount: 3 }],
    description: "Choose 1 BUSTY Babe you played this turn; triple her Base Score, but pay her new Base Score in Strokes.",
    gifName: "EFFECT BUSTY Sun Dress.gif",
  },
  { // +1 BUSTY babe play this turn (type-restricted)
    id: uid(),
    name: "Titty Drop",
    group: "BUSTY",
    target: { kind: "none" },
    limits: [{ extraTypePlays: { type: "BUSTY", extraBabes: 1 } }],
    description: "You can play 1 additional BUSTY Babe this turn, ignoring Babe Limit.",
    gifName: "EFFECT BUSTY Titty Drop.gif",
  },
  { // If all played babes are BUSTY, +8 per BUSTY
    id: uid(),
    name: "Let Em Out",
    group: "BUSTY",
    target: { kind: "none" },
    score: [{ scope: "final-per-babe", ofType: "BUSTY", amount: 8, whenAllPlayedAreType: "BUSTY" }],
    description: "If all Babes you played this turn were BUSTY Babes, add 8 Score for each one.",
    gifName: "EFFECT BUSTY Let Em Out.gif",
  },
  { // Move BUSTY from Discard back to Deck; next turn if you play her, triple base
    id: uid(),
    name: "Handbra",
    group: "BUSTY",
    target: { kind: "one-babe", ofType: "BUSTY", from: "discard" },
    future: { targetsNextTurnMult: 3 },
    onRemove: { undoDiscardedTargets: true },
    description: "Choose 1 BUSTY Babe in your Discard Pile; add her to your Deck. If you play her next turn, triple her Base Score.",
    gifName: "EFFECT BUSTY Handbra.gif",
  },
  { // Play from discard ignoring babe limit; send to deck at end of turn
    id: uid(),
    name: "Side Boob",
    group: "BUSTY",
    target: { kind: "one-babe", ofType: "BUSTY", from: "discard" },
    onRemove: { undoDiscardedTargets: true },
    description: "Choose 1 BUSTY Babe from your Discard Pile; play her this turn, ignoring Babe Limit. Add her to your deck at the end of this turn.",
    gifName: "EFFECT BUSTY Side Boob.gif",
  },
  {
    id: uid(),
    name: "Jiggly Jugs",
    group: "BUSTY",
    target: { kind: "none" },
    score: [{ scope: "final-per-babe", ofType: "BUSTY", amount: 5 }],
    description: "Add 5 Score for each BUSTY you played this turn.",
    gifName: "EFFECT BUSTY Jiggly Jugs.gif",
  },
];

const stubNames = [
  "A-bra-cada-bra",
  "Shes All Yours",
];

export const BUSTY_EFFECTS: EffectScript[] = [
  ...implemented,
  ...stubNames.map((name) => stubEffect("BUSTY", name, `EFFECT BUSTY ${name}.gif`)),
];
