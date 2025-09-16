import type { EffectScript } from "../../types/effects";
import { stubEffect } from "./helpers";

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
  ["EMILY BLOOM", "Late Bloomer"],
  ["MALENA MORGAN", "Morganized Crime"],
  ["ALETTA OCEAN", "Ocean Of Love"],
  ["OCTAVIA RED", "Red Alert"],
  ["RUTH LEE", "Ruthless Game"],
  ["SOMMER RAY", "Sommer Heat"],
  ["KALI ROSES", "Thorned Roses"],
  ["VICTORIA JUNE", "Victorias Secret"],
  ["LUCIE WILDE", "Wilde Card"],
  ["ELSA JEAN", "Jeanie Wishes"],
  ["ALICE DELISH", "Delish-Ious"],
] as const;

export const SIGNATURE_EFFECTS: EffectScript[] = pairs.map(([sig, name]) =>
  stubEffect("SIGNATURE", name, `EFFECT ${sig} ${name}.gif`)
);

