// ---- Babe domain types ----

// If you want stricter control, list your known types explicitly.
// I included the Rule34 spinoff ones you mentioned as well.
// The `(string & {})` keeps it open to future custom types without breaking.
export type BabeType =
  | "BADDIE"
  | "BIMBO"
  | "BUSTY"
  | "PAWG"
  | "MILF"
  | "TRANS"
  | "COMICS"
  | "GAME"
  | "WESTERN"
  | "ANIME"
  | (string & {});

export type BabeCard = {
  id: string;
  name: string;
  type: BabeType;
  baseScore: number;
  gifName?: string;
};

// ---- Effects bridge to the engine ----

import type { EffectScript, BoundEffect } from "./effects";

// Legacy compatibility alias (many components refer to EffectCard)
export type EffectCard = EffectScript;

/**
 * Old code used to have its own "PlayedEffect" shape with "bound"/"deltas".
 * In the new engine, a played instance is represented by BoundEffect
 * (it’s the authored script plus playId and any bound targets).
 *
 * So we alias PlayedEffect to BoundEffect for maximum compatibility.
 */
export type PlayedEffect = BoundEffect;

// Some UIs expect a PlayedBabe with a playId separate from id.
// You can map BabeCard -> PlayedBabe when passing down to those UIs.
export type PlayedBabe = BabeCard & { playId: string };
