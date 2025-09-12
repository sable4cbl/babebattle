import { BabeCard, EffectCard } from "../types/cards";
import { uid } from "../utils/uid";

export const SAMPLE_BABES: BabeCard[] = [
  { id: uid(), name: "Alice Delish GOLD", type: "BADDIE", baseScore: 9, gifName: "BADDIE Alice Delish GOLD.gif" },
  { id: uid(), name: "Elsa Jean", type: "BADDIE", baseScore: 8, gifName: "BADDIE Elsa Jean.gif" },
  { id: uid(), name: "Emily Bloom", type: "BADDIE", baseScore: 6, gifName: "BADDIE Emily Bloom.gif" },
  { id: uid(), name: "Autumn Falls GOLD", type: "BUSTY", baseScore: 9, gifName: "BUSTY Autumn Falls GOLD.gif" },
  { id: uid(), name: "JuicyJade9", type: "BUSTY", baseScore: 8, gifName: "BUSTY JuicyJade9.gif" },
  { id: uid(), name: "Lucie Wilde", type: "BUSTY", baseScore: 8, gifName: "BUSTY Lucie Wilde.gif" },
  { id: uid(), name: "Nicolette Shea", type: "BIMBO", baseScore: 8, gifName: "BIMBO Nicolette Shea.gif" },
  { id: uid(), name: "Sophie Dee", type: "MILF", baseScore: 7, gifName: "MILF Sophie Dee.gif" },
  { id: uid(), name: "Mia Malkova", type: "PAWG", baseScore: 7, gifName: "PAWG Mia Malkova.gif" },
];

export const SAMPLE_EFFECTS: EffectCard[] = [
  {
    id: uid(),
    name: "Pumping Frenzy",
    kind: "multiply-final",
    factor: 3,
    description: "Triple the Final Score (applies to both players).",
    gifName: "EFFECT Pumping Frenzy.gif",
  },
  {
    id: uid(),
    name: "Trifecta",
    kind: "discard-different-then-multiply-final",
    discardCount: 3,
    factor: 2,
    description: "Discard 3 Babes with different types → Double the Final Score.",
    gifName: "EFFECT Trifecta.gif",
  },
  {
    id: uid(),
    name: "Delish-Ious",
    kind: "next-turn-modifier",
    description: "If Alice Delish is the only Babe played this turn → double next turn's Final Score.",
    gifName: "EFFECT ALICE DELISH Delish-Ious.gif",
    gifPerformerTagUpper: "ALICE DELISH",
    schedule: { multNext: 2 },
    onlyBabePlayedName: "Alice Delish GOLD",
  },
{
  id: uid(),
  name: "Jeanie Wishes",
  kind: "set-babe-limit",
  setBabeLimitTo: 3,
  ignoreEffectLimit: true,
  // strokesCost: 0, // (optional, default 0 anyway)
  description: "If Elsa Jean is in your Discard Pile → you may play 3 Babes this turn (ignores Effect limit).",
  gifName: "EFFECT ELSA JEAN Jeanie Wishes.gif",
  gifPerformerTagUpper: "ELSA JEAN",
  requiresDiscardName: "Elsa Jean",
},
  {
    id: uid(),
    name: "Late Bloomer",
    kind: "multi-turn-modifier",
    description: "If Emily Bloom is the only Babe played this turn → triple her Base now, +30 next turn, +60 on turn after.",
    gifName: "EFFECT EMILY BLOOM Late Bloomer.gif",
    gifPerformerTagUpper: "EMILY BLOOM",
    onlyBabePlayedName: "Emily Bloom",
    targetName: "Emily Bloom",
    factor: 3,
    schedule: { addNext: 30, addTurn2: 60 },
  },

  // NEW: Choose a BUSTY Babe in play → triple her Base
  {
    id: uid(),
    name: "Bouncing Boobies",
    kind: "multiply-babe",
    factor: 3,
    targetType: "BUSTY", // UI: only BUSTY in Play Area are clickable
    description: "Choose 1 BUSTY Babe you played this turn; triple her Base Score.",
    gifName: "EFFECT BUSTY Bouncing Boobies.gif",
    gifTypeTagUpper: "BUSTY",
  },

  // Type multipliers (examples)
  {
    id: uid(),
    name: "Titty Drop",
    kind: "multiply-type",
    targetType: "BUSTY",
    factor: 2,
    description: "Double all BUSTY Babes.",
    gifName: "EFFECT BUSTY Titty Drop.gif",
    gifTypeTagUpper: "BUSTY",
  },
];
