import type { EffectScript } from "../types/effects";
import { BADDIE_EFFECTS } from "./effects/baddie";
import { BIMBO_EFFECTS } from "./effects/bimbo";
import { BUSTY_EFFECTS } from "./effects/busty";
import { GENERIC_EFFECTS } from "./effects/generic";
import { MILF_EFFECTS } from "./effects/milf";
import { PAWG_EFFECTS } from "./effects/pawg";
import { SIGNATURE_EFFECTS, SIGNATURE_IMPLEMENTED } from "./effects/signature";
import { ANIME_EFFECTS } from "./effects/anime";
import { COMICS_EFFECTS } from "./effects/comics";
import { GAME_EFFECTS } from "./effects/game";
import { WESTERN_EFFECTS } from "./effects/western";

export const EFFECTS: EffectScript[] = [
  ...BADDIE_EFFECTS,
  ...BIMBO_EFFECTS,
  ...BUSTY_EFFECTS,
  ...GENERIC_EFFECTS,
  ...MILF_EFFECTS,
  ...PAWG_EFFECTS,
  ...ANIME_EFFECTS,
  ...COMICS_EFFECTS,
  ...GAME_EFFECTS,
  ...WESTERN_EFFECTS,
  ...SIGNATURE_IMPLEMENTED,
  ...SIGNATURE_EFFECTS,
];
