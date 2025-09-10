import type { BabeCard, PlayedEffect } from "../../types/cards";

type Params = {
  playedEffects: PlayedEffect[];
  setDiscard: React.Dispatch<
    React.SetStateAction<{ babes: BabeCard[]; effects: any[] }>
  >;
  setDeck: React.Dispatch<
    React.SetStateAction<{ babes: BabeCard[]; effects: any[] }>
  >;
  removePlayedEffect: (playId: string) => void;
  returnDiscardToDeck: () => { babes: BabeCard[]; effects: any[] };
  /** Optional: if removing an effect that is currently targeted, exit targeting */
  onExitTargeting?: (playId: string) => void;
};

export function useTurnHandlers({
  playedEffects,
  setDiscard,
  setDeck,
  removePlayedEffect,
  returnDiscardToDeck,
  onExitTargeting,
}: Params) {
  function handleRemovePlayedEffect(playId: string) {
    const e = playedEffects.find((x) => x.playId === playId);
    if (e && e.kind === "discard-different-then-multiply-final") {
      const returnIds = new Set((e.boundDiscards ?? []).map((d) => d.id));
      const toReturn: BabeCard[] = [];
      // Remove those from discard, collect full card objects
      setDiscard((d) => {
        const remaining = d.babes.filter((b) => {
          if (returnIds.has(b.id)) {
            toReturn.push(b);
            return false;
          }
          return true;
        });
        return { ...d, babes: remaining };
      });
      // Add them back to the deck (avoid duplicates)
      setDeck((deck) => ({
        ...deck,
        babes: [...deck.babes, ...toReturn.filter((b) => !deck.babes.some((x) => x.id === b.id))],
      }));
      // Notify targeting to exit if needed
      onExitTargeting?.(playId);
    }
    removePlayedEffect(playId);
  }

  function onReturnDiscardToDeck() {
    const ret = returnDiscardToDeck();
    setDeck((d) => ({
      babes: [...d.babes, ...ret.babes.filter((b) => !d.babes.some((x) => x.id === b.id))],
      effects: [
        ...d.effects,
        ...ret.effects.filter((e) => !d.effects.some((x) => x.id === e.id)),
      ],
    }));
  }

  return { handleRemovePlayedEffect, onReturnDiscardToDeck };
}
