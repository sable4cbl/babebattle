import type { EffectScript } from "../../types/effects";
import { stubEffect } from "./helpers";
import { uid } from "../../utils/uid";

const pairs = [
  ["ANGELA WHITE SAVANNAH BOND", "Aussie Awesomeness"],
  ["BLAKE BLOSSOM", "Blooming Blossom"],
  ["BONNIE BLUE", "Blue Balls"],
  ["SAVANNAH BOND", "Bond For Life"],
  ["BROOKLYN CHASE", "Chase The Sun"],
  ["PIPER PERRI", "Cream-Pied Piper"],
  ["ALEXIS TEXAS", "Everything Is Bigger In Texas"],
  ["ANGIE FAITH", "Faithful"],
  ["AUTUMN FALLS", "Fall For Autumn"],
  ["FAYE REAGAN", "Faye-Tal"],
  ["KARMA RX", "Instant Karma"],
  ["JYNX MAZE", "Jynxd"],
  ["KRYSTAL BOYD", "Krystal Klear"],
  ["MALENA MORGAN", "Morganized Crime"],
  ["ALETTA OCEAN", "Ocean Of Love"],
  ["OCTAVIA RED", "Red Alert"],
  ["RUTH LEE", "Ruthless Game"],
  ["SOMMER RAY", "Sommer Heat"],
  ["KALI ROSES", "Thorned Roses"],
  ["VICTORIA JUNE", "Victorias Secret"],
] as const;

export const SIGNATURE_EFFECTS: EffectScript[] = pairs.map(([sig, name]) =>
  stubEffect("SIGNATURE", name, `EFFECT ${sig} ${name}.gif`)
);

// Implemented signature effects
export const SIGNATURE_IMPLEMENTED: EffectScript[] = [
  {
    id: uid(),
    name: "Late Bloomer",
    group: "SIGNATURE",
    target: { kind: "none" },
    score: [{ scope: "babe", appliesTo: "all-of-type", ofType: "BADDIE", op: "mult", amount: 3 }],
    future: { nextAdd: 30, addNextNext: 60 },
    gifName: "EFFECT EMILY BLOOM Late Bloomer.gif",
    description:
      "If Emily Bloom is the only Babe you played this turn, triple her Base Score. Add 30 Score next turn, and add 60 score the turn after that.",
  },
  {
    id: uid(),
    name: "Blooming Blossom",
    group: "SIGNATURE",
    target: { kind: "none" },
    // Score handled via special-case in engine: triples Blake Blossom if played
    score: [{ scope: "babe", appliesTo: "targets", op: "mult", amount: 3 } as any],
    gifName: "EFFECT BLAKE BLOSSOM Blooming Blossom.gif",
    description:
      "If you played Blake Blossom this turn, triple her Base Score.",
  },
  {
    id: uid(),
    name: "Delish-Ious",
    group: "SIGNATURE",
    target: { kind: "none" },
    future: { nextMult: 2 },
    gifName: "EFFECT ALICE DELISH Delish-Ious.gif",
    description:
      "If Alice Delish is the only Babe you played this turn, double your next turn's Final Score. Your opponent cannot play Effect Cards next turn.",
  },
  {
    id: uid(),
    name: "Wilde Card",
    group: "SIGNATURE",
    target: { kind: "none" },
    future: { nextMult: 2 },
    gifName: "EFFECT LUCIE WILDE Wilde Card.gif",
    description:
      "If you played Lucie Wilde this game, choose 1: Double the next turn's Final Score. Or halve the Final Score of your Opponent's next turn.",
  },
  {
    id: uid(),
    name: "Jeanie Wishes",
    group: "SIGNATURE",
    requires: [{ kind: "discard-has-babe", name: "Elsa Jean" }],
    target: { kind: "none" },
    limits: [{ setBabeLimitTo: 3 }],
    freeEffect: true,
    gifName: "EFFECT ELSA JEAN Jeanie Wishes.gif",
    description:
      "If Elsa Jean is in your Discard Pile, you can play 3 Babes this turn. You can play this Card, ignoring Effect Card Limit.",
  },
];
