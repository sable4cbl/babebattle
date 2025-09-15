import React from "react";
import type { BabeCard } from "../../types/cards";
import type { EffectScript } from "../../types/effects";
import DeckBuilder from "../../features/deckbuilder/DeckBuilder";
import FullBleed from "../../layout/FullBleed";

type Props = {
  onImported: (deck: { babes: BabeCard[]; effects: EffectScript[] }) => void;
};

/**
 * Use FullBleed so this page matches the main board’s full-width layout.
 * DeckBuilder already provides its own padding/margins.
 */
export default function ImportDeckPanel(props: Props) {
  return (
    <FullBleed>
      <DeckBuilder {...props} />
    </FullBleed>
  );
}
