"use client";

import React, { useMemo } from "react";
import { useAppSelector } from "@/store";
import { selectCumulative, selectBook } from "@/store/selectors";
import dynamic from "next/dynamic";

/**
 * Depth chart with cumulative step areas and proper clipping at mid-price
 * Features: no visual overlap, dark theme, throttled rendering, performance optimized
 */

// Dynamic import Recharts with SSR disabled
const RechartsChart = dynamic(() => import("./RechartsChart"), {
  ssr: false,
  loading: () => (
    <div className="h-48 flex items-center justify-center text-sm muted">
      Loading chart...
    </div>
  ),
});

type Props = { venue: "OKX" | "Bybit" | "Deribit"; symbol: string };
export default function DepthChart({ venue, symbol }: Props) {
  const { bidCum, askCum } = useAppSelector(selectCumulative(venue, symbol));
  const book = useAppSelector(selectBook(venue, symbol));

  // Calculate mid-price
  const midPrice = useMemo(() => {
    if (!book || !book.bids[0] || !book.asks[0]) return null;
    return (book.bids[0][0] + book.asks[0][0]) / 2;
  }, [book]);

  // Prepare chart data with proper separation at mid-price
  const chartData = useMemo(() => {
    if ((!bidCum.length && !askCum.length) || !midPrice) return [];

    // Create combined data points ensuring proper separation
    const allPoints = new Map<
      number,
      { price: number; bidCum?: number; askCum?: number }
    >();

    // Add bid cumulative data (only for prices <= midPrice)
    bidCum.forEach(({ price, cum }) => {
      if (price <= midPrice) {
        allPoints.set(price, { price, bidCum: cum });
      }
    });

    // Add ask cumulative data (only for prices >= midPrice)
    askCum.forEach(({ price, cum }) => {
      if (price >= midPrice) {
        const existing = allPoints.get(price);
        if (existing) {
          existing.askCum = cum;
        } else {
          allPoints.set(price, { price, askCum: cum });
        }
      }
    });

    // Add mid-price point to ensure clean separation
    if (!allPoints.has(midPrice)) {
      allPoints.set(midPrice, { price: midPrice });
    }

    // Convert to array and sort by price
    return Array.from(allPoints.values()).sort((a, b) => a.price - b.price);
  }, [bidCum, askCum, midPrice]);

  // Calculate domains with memoization
  const domains = useMemo((): {
    xDomain: [number, number];
    yDomain: [number, number];
  } => {
    if (!chartData.length || !midPrice) {
      return { xDomain: [0, 100], yDomain: [0, 100] };
    }

    const maxBidCum =
      bidCum.length > 0 ? Math.max(...bidCum.map((d) => d.cum)) : 0;
    const maxAskCum =
      askCum.length > 0 ? Math.max(...askCum.map((d) => d.cum)) : 0;
    const maxCum = Math.max(maxBidCum, maxAskCum);

    // Center x-domain around mid-price with adaptive spread
    const dataSpread =
      chartData.length > 0
        ? Math.max(...chartData.map((d) => d.price)) -
          Math.min(...chartData.map((d) => d.price))
        : midPrice * 0.02;
    const midSpread = Math.max(midPrice * 0.01, dataSpread / 4);

    const minPrice = Math.min(...chartData.map((d) => d.price));
    const maxPrice = Math.max(...chartData.map((d) => d.price));

    const xMin = Math.min(midPrice - midSpread, minPrice);
    const xMax = Math.max(midPrice + midSpread, maxPrice);

    return {
      xDomain: [xMin, xMax],
      yDomain: [0, maxCum * 1.1], // Add 10% padding
    };
  }, [chartData, midPrice, bidCum, askCum]);

  const hasData = chartData.length > 0 && midPrice !== null;

  // Debug logging
  React.useEffect(() => {
    console.log("DepthChart debug:", {
      venue,
      symbol,
      bidCumLength: bidCum.length,
      askCumLength: askCum.length,
      midPrice,
      chartDataLength: chartData.length,
      hasData,
    });
  }, [
    venue,
    symbol,
    bidCum.length,
    askCum.length,
    midPrice,
    chartData.length,
    hasData,
  ]);

  if (!hasData) {
    return (
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Market Depth</h3>
        </div>
        <div className="h-48 flex items-center justify-center text-sm muted border border-dashed border-gray-800 rounded">
          No depth data available
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Market Depth</h3>
        <div className="text-xs muted">
          Mid: <span className="font-mono">{midPrice?.toFixed(2)}</span>
        </div>
      </div>

      <div className="h-48">
        <RechartsChart
          data={chartData}
          xDomain={domains.xDomain}
          yDomain={domains.yDomain}
          midPrice={midPrice!}
        />
      </div>
    </div>
  );
}
