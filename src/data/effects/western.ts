import type { EffectScript } from "../../types/effects";
import { uid } from "../../utils/uid";
import { stubEffect } from "./helpers";

const implemented: EffectScript[] = [
  {
    id: uid(),
    name: "Cartoon Logic",
    group: "WESTERN",
    target: { kind: "one-babe", ofType: "WESTERN" },
    // Scoring engine special-cases this name to set chosen babe's base to 15 this turn
    score: [ { scope: "babe", appliesTo: "targets", op: "add", amount: 0 } ],
    limits: [ { ignoreEffectLimit: true } ],
    description:
      "Choose 1 WESTERN Babe you played this turn; her Base Score becomes 15 until the end of this turn. You can play this Card, ignoring Effect Card Limit. You can only play this Card once per game.",
    gifName: "EFFECT HENTAI WESTERN Cartoon Logic.gif",
  },
];

const stubNames: string[] = [
  // add WESTERN effect names here as they are authored
];

export const WESTERN_EFFECTS: EffectScript[] = [
  ...implemented,
  ...stubNames.map((name) => stubEffect("WESTERN", name, `EFFECT HENTAI WESTERN ${name}.gif`)),
];
