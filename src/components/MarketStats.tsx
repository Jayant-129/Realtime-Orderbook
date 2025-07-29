"use client";

import React from "react";
import { useAppSelector } from "@/store";
import { selectMarketStats } from "@/store/selectors";

interface MarketStatsProps {
  venue: string;
  symbol: string;
}

export default function MarketStats({ venue, symbol }: MarketStatsProps) {
  const stats = useAppSelector(selectMarketStats(venue, symbol));

  const formatNumber = (num: number | null, decimals = 2) => {
    if (num === null) return "--";
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toFixed(decimals);
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return "--";
    return price.toFixed(2);
  };

  return (
    <div className="card bg-black border border-gray-800 p-3 h-full flex flex-col overflow-hidden">
      <h3 className="text-xs font-medium text-white text-center mb-2">
        Market Stats
      </h3>
      <div className="grid grid-cols-4 gap-2 flex-1 items-center text-center min-w-0">
        <div className="flex flex-col min-w-0">
          <div className="text-xs text-gray-400 mb-1 truncate">Mid Price</div>
          <div className="font-mono text-xs font-bold text-white truncate">
            {formatPrice(stats.midPrice)}
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="text-xs text-gray-400 mb-1 truncate">Spread</div>
          <div className="font-mono text-xs font-bold text-white truncate">
            {formatPrice(stats.spread)}
          </div>
          {stats.spreadPercent !== null && (
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              ({stats.spreadPercent.toFixed(2)}%)
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="text-xs text-gray-400 mb-1 truncate">Bid Vol</div>
          <div className="font-mono text-xs font-semibold text-green-400 truncate">
            {formatNumber(stats.bidVolume)}
          </div>
        </div>
        <div className="flex flex-col min-w-0">
          <div className="text-xs text-gray-400 mb-1 truncate">Ask Vol</div>
          <div className="font-mono text-xs font-semibold text-red-400 truncate">
            {formatNumber(stats.askVolume)}
          </div>
        </div>
      </div>
    </div>
  );
}
