import React from "react";
import type { PendingNext, ScoreBreakdown, OverallOp } from "../../types/effects";

type Props = {
  turnNumber: number;
  strokesThisTurn: number;
  pendingNext?: PendingNext;
  finalScore: number;
  scoreBreakdown?: ScoreBreakdown;
  overallOps?: OverallOp[];
};

export default function TopBar({ turnNumber, strokesThisTurn, pendingNext, finalScore, scoreBreakdown }: Props) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm px-2 py-1 rounded-md bg-gray-100">Turn #{turnNumber}</div>
        <div className="text-sm px-2 py-1 rounded-md bg-gray-100">Strokes: {strokesThisTurn}</div>
        <div className="text-sm px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-semibold">
          Final Score: {finalScore}
        </div>
        {pendingNext && (pendingNext.addNext || pendingNext.multNext) ? (
          <div className="ml-auto text-xs text-gray-500">
            Next: {pendingNext.addNext ? `+${pendingNext.addNext}` : ""}
            {pendingNext.addNext && pendingNext.multNext ? " & " : ""}
            {pendingNext.multNext ? `x${pendingNext.multNext}` : ""}
          </div>
        ) : null}
      </div>
      {scoreBreakdown && (
        <div className="bg-gray-50 border rounded-md p-2 text-xs text-gray-700">
          <div className="font-semibold mb-1">Score Breakdown</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left align-middle">
              <thead>
                <tr className="text-gray-500">
                  <th className="pr-2 py-1">Babe</th>
                  <th className="pr-2 py-1">Base</th>
                  <th className="pr-2 py-1">Delta</th>
                  <th className="pr-2 py-1">x</th>
                  <th className="pr-2 py-1">Total</th>
                </tr>
              </thead>
              <tbody>
                {scoreBreakdown.perBabe.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="pr-2 py-1 whitespace-nowrap">{b.name}</td>
                    <td className="pr-2 py-1">{b.base}</td>
                    <td className="pr-2 py-1">{b.delta >= 0 ? `+${b.delta}` : b.delta}</td>
                    <td className="pr-2 py-1">{b.mult}</td>
                    <td className="pr-2 py-1 font-semibold">{b.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-gray-700">
            <span className="font-medium">Final:</span> {scoreBreakdown.finalAfter}
          </div>
        </div>
      )}
    </>
  );
}

