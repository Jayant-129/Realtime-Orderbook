"use client";

import React from "react";
import { useAppSelector } from "@/store";

/**
 * Simulation history table showing recent order simulation results
 * Features: time-sorted results, metric highlighting, responsive layout
 */

export default function ScenarioTable() {
  const simState = useAppSelector((state) => state.sims);
  const history = simState.history || [];

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Simulation History</h2>
        <div className="text-xs muted">{history.length} simulations</div>
      </div>

      {history.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm muted">
          No simulations run yet
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-2 px-3 muted font-medium">Time</th>
                <th className="text-left py-2 px-3 muted font-medium">Venue</th>
                <th className="text-left py-2 px-3 muted font-medium">
                  Symbol
                </th>
                <th className="text-left py-2 px-3 muted font-medium">Type</th>
                <th className="text-left py-2 px-3 muted font-medium">Side</th>
                <th className="text-right py-2 px-3 muted font-medium">Qty</th>
                <th className="text-right py-2 px-3 muted font-medium">
                  Fill %
                </th>
                <th className="text-right py-2 px-3 muted font-medium">
                  Avg Price
                </th>
                <th className="text-right py-2 px-3 muted font-medium">
                  Slip (bps)
                </th>
                <th className="text-right py-2 px-3 muted font-medium">
                  Impact
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {history.slice(0, 10).map((scenario, index) => (
                <tr key={scenario.id} className="hover:bg-gray-800/30">
                  <td className="py-2 px-3 font-mono">
                    {scenario.results.length > 0
                      ? new Date(scenario.results[0].ts).toLocaleTimeString()
                      : "-"}
                  </td>
                  <td className="py-2 px-3">
                    {scenario.results.length > 0
                      ? scenario.results[0].venue
                      : "-"}
                  </td>
                  <td className="py-2 px-3 font-mono text-sm">
                    {/* Symbol would be extracted from venue key or input */}-
                  </td>
                  <td className="py-2 px-3">{scenario.input.type}</td>
                  <td className="py-2 px-3">
                    <span
                      className={
                        scenario.input.side === "buy"
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {scenario.input.side}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {scenario.input.qty.toFixed(4)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {scenario.results.length > 0 ? (
                      <span
                        className={
                          scenario.results[0].estFillPct < 100
                            ? "text-yellow-400"
                            : "text-green-400"
                        }
                      >
                        {scenario.results[0].estFillPct.toFixed(1)}%
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {scenario.results.length > 0
                      ? scenario.results[0].estAvgPx.toFixed(2)
                      : "-"}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {scenario.results.length > 0 ? (
                      <span
                        className={
                          Math.abs(scenario.results[0].estSlippageBps) > 50
                            ? "text-yellow-400"
                            : ""
                        }
                      >
                        {scenario.results[0].estSlippageBps.toFixed(1)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    {scenario.results.length > 0 ? (
                      <span
                        className={
                          scenario.results[0].impactQtyLevels > 5
                            ? "text-yellow-400"
                            : ""
                        }
                      >
                        {scenario.results[0].impactQtyLevels}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
