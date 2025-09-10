import { BabeCard, EffectCard } from "../types/cards";
import { uid } from "../lib/uid";

export const SAMPLE_BABES: BabeCard[] = [
  {
    id: uid(),
    name: "Alice",
    type: "Pop",
    baseScore: 5,
  },
  {
    id: uid(),
    name: "Bella",
    type: "Rock",
    baseScore: 6,
  },
  {
    id: uid(),
    name: "Chloe",
    type: "Indie",
    baseScore: 4,
  },
  {
    id: uid(),
    name: "Diana",
    type: "Pop",
    baseScore: 7,
  },
];

export const SAMPLE_EFFECTS: EffectCard[] = [
  {
    id: uid(),
    name: "Encore",
    kind: "add-final",
    add: 5,
    description: "Add +5 to the final score",
  },
  {
    id: uid(),
    name: "World Tour",
    kind: "multiply-final",
    factor: 2,
    description: "Double the final score",
  },
  {
    id: uid(),
    name: "Spotlight",
    kind: "multiply-babe",
    factor: 2,
    description: "Choose 1 Babe and double her score",
  },
  {
    id: uid(),
    name: "Duo Act",
    kind: "multiply-type",
    factor: 2,
    targetType: "Pop",
    description: "Double all Pop Babes",
  },
  {
    id: uid(),
    name: "All-Stars",
    kind: "multiply-all",
    factor: 2,
    description: "Double all Babes",
  },
  {
    id: uid(),
    name: "Backstage Pass",
    kind: "extra-plays",
    extraBabes: 1,
    extraEffects: 1,
    description: "Play +1 Babe and +1 Effect this turn",
  },
  // NEW SAMPLE: discard effect
  {
    id: uid(),
    name: "Sacrifice Pop",
    kind: "discard-babes-add-final",
    discardCount: 2,
    discardType: "Pop",
    description: "Discard 2 Pop Babes from the deck and add their base scores to the final score",
  },
];
