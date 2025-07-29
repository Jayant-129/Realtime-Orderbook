"use client";

import React, { useMemo, useState } from "react";
import { useAppSelector } from "@/store";
import {
  selectTopN,
  selectHighlight,
  selectBookStatus,
} from "@/store/selectors";

type Props = {
  venue: "OKX" | "Bybit" | "Deribit";
  symbol: string;
  levels?: number;
};

export default function OrderBookTable({ venue, symbol, levels = 100 }: Props) {
  const { bids, asks } = useAppSelector(selectTopN(venue, symbol, levels));
  const bidHighlight = useAppSelector(selectHighlight(venue, symbol, "buy"));
  const askHighlight = useAppSelector(selectHighlight(venue, symbol, "sell"));
  const connectionStatus = useAppSelector(selectBookStatus(venue, symbol));

  const isLoading = connectionStatus === "connecting";
  const hasError = connectionStatus === "error";
  const hasData = bids.length > 0 || asks.length > 0;

  const shouldHighlightBid = (price: number): boolean => {
    return bidHighlight !== undefined && Math.abs(price - bidHighlight) < 1e-8;
  };

  const shouldHighlightAsk = (price: number): boolean => {
    return askHighlight !== undefined && Math.abs(price - askHighlight) < 1e-8;
  };

  const maxBidSize = useMemo(() => {
    return bids.length > 0 ? Math.max(...bids.map(([_, size]) => size)) : 0;
  }, [bids]);

  const maxAskSize = useMemo(() => {
    return asks.length > 0 ? Math.max(...asks.map(([_, size]) => size)) : 0;
  }, [asks]);

  const getBarWidth = (size: number, isAsk: boolean) => {
    const maxSize = isAsk ? maxAskSize : maxBidSize;
    if (maxSize <= 0) return 0;
    return Math.min(100, (size / maxSize) * 100);
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Order Book</h2>
        <div className="text-xs muted">
          {venue} • {symbol} • {bids.length + asks.length} levels
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-sm muted">
          <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-gray-400 rounded-full mr-2"></div>
          Connecting...
        </div>
      )}

      {hasError && (
        <div className="flex items-center justify-center py-12 text-sm text-red-400">
          ⚠️ Connection failed
        </div>
      )}

      {!isLoading && !hasError && !hasData && (
        <div className="flex items-center justify-center py-12 text-sm muted">
          No market data available
        </div>
      )}

      {hasData && (
        <>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium mb-2 text-green-400">
                Bids ({bids.length})
              </h3>
              <div className="h-[300px] flex flex-col">
                <table className="w-full text-xs">
                  <thead>
                    <tr
                      className="border-b orderbook-header bg-black"
                      style={{
                        borderColor: "var(--divider)",
                      }}
                    >
                      <th className="text-right py-2 muted font-medium">
                        Price
                      </th>
                      <th className="text-right py-2 muted font-medium pr-2">
                        Size
                      </th>
                    </tr>
                  </thead>
                </table>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                  <table className="w-full text-xs">
                    <tbody>
                      {bids.map(([price, size], i) => (
                        <tr
                          key={i}
                          className={`border-b transition-colors orderbook-row ${
                            shouldHighlightBid(price) ? "highlight" : ""
                          }`}
                          style={{ borderColor: "var(--divider)" }}
                        >
                          <td
                            className="relative text-right py-1.5 font-mono"
                            style={{ color: "var(--bid)" }}
                          >
                            <div
                              className="absolute top-0 bottom-0 right-0 h-full bg-green-500/20 z-0"
                              style={{
                                width: `${getBarWidth(size, false)}%`,
                                maxWidth: "100%",
                              }}
                            />
                            <span className="relative z-10">
                              {price.toFixed(2)}
                            </span>
                          </td>
                          <td className="relative text-right py-1.5 font-mono text-gray-300 pr-2">
                            <span className="relative z-10">
                              {size.toFixed(4)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Asks Table (Right) */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-red-400">
                Asks ({asks.length})
              </h3>
              <div className="h-[300px] flex flex-col">
                <table className="w-full text-xs">
                  <thead>
                    <tr
                      className="border-b orderbook-header bg-black"
                      style={{
                        borderColor: "var(--divider)",
                      }}
                    >
                      <th className="text-right py-2 muted font-medium">
                        Price
                      </th>
                      <th className="text-right py-2 muted font-medium pr-2">
                        Size
                      </th>
                    </tr>
                  </thead>
                </table>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
                  <table className="w-full text-xs">
                    <tbody>
                      {asks.map(([price, size], i) => (
                        <tr
                          key={i}
                          className={`border-b transition-colors orderbook-row ${
                            shouldHighlightAsk(price) ? "highlight" : ""
                          }`}
                          style={{ borderColor: "var(--divider)" }}
                        >
                          <td
                            className="relative text-right py-1.5 font-mono"
                            style={{ color: "var(--ask)" }}
                          >
                            <div
                              className="absolute top-0 bottom-0 right-0 h-full bg-red-500/20 z-0"
                              style={{
                                width: `${getBarWidth(size, true)}%`,
                                maxWidth: "100%",
                              }}
                            />
                            <span className="relative z-10">
                              {price.toFixed(2)}
                            </span>
                          </td>
                          <td className="relative text-right py-1.5 font-mono text-gray-300 pr-2">
                            <span className="relative z-10">
                              {size.toFixed(4)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Smart warning bar for insufficient levels */}
          {(() => {
            const bidCount = bids.length;
            const askCount = asks.length;
            const totalLevels = bidCount + askCount;
            const criticallyLow = totalLevels < 8;
            const bothSidesWeak = bidCount < 5 && askCount < 5;
            const showWarning = criticallyLow || bothSidesWeak;

            if (showWarning) {
              return (
                <div className="mt-4">
                  <div className="h-0.5 bg-yellow-500/40 rounded mb-2"></div>
                  <div className="text-xs text-yellow-400 flex items-center gap-1">
                    ⚠️ Limited market depth available
                    <span className="muted ml-1">
                      ({bidCount} bids, {askCount} asks)
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </>
      )}
    </div>
  );
}
