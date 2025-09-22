import React from "react";
import type { TargetDeck } from "../../types/effects";

type Props = {
  recycleDisabled: boolean;
  targeting?: TargetDeck;
  onReturnDiscardToDeck: () => void;
  onReset: () => void;
  onEndTurn: () => void;
};

export default function ActionsBar({ recycleDisabled, targeting, onReturnDiscardToDeck, onReset, onEndTurn }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="ml-auto flex items-center gap-2">
        <button
          className={
            "text-xs px-2 py-1 rounded-md border " +
            (recycleDisabled ? "bg-gray-100 text-gray-400 opacity-50 pointer-events-none" : "bg-white hover:bg-gray-50")
          }
          onClick={onReturnDiscardToDeck}
          title="Return all discard to the deck lists"
          disabled={recycleDisabled}
        >
          Recycle Discard
        </button>
        <button
          className={
            "text-xs px-2 py-1 rounded-md border " +
            (targeting ? "bg-gray-100 text-gray-400 opacity-50 pointer-events-none" : "bg-white hover:bg-gray-50")
          }
          onClick={onReset}
          title="Return all cards in play to their lists"
          disabled={!!targeting}
        >
          Cancel Turn
        </button>
        <button
          className={
            "text-xs px-3 py-1 rounded-md " +
            (targeting ? "bg-blue-300 text-white opacity-50 pointer-events-none" : "bg-blue-600 text-white hover:bg-blue-700")
          }
          onClick={onEndTurn}
          title="Move all cards in play to the Discard pile"
          disabled={!!targeting}
        >
          End Turn
        </button>
      </div>
    </div>
  );
}

