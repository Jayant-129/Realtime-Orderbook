"use client";

import React, { useMemo } from "react";
import { useAppSelector } from "@/store";
import { selectCumulative, selectMarketStats } from "@/store/selectors";
import dynamic from "next/dynamic";
import { VenueSymbolProps } from "@/lib/types";
import { calculateChartData, calculateChartDomains } from "@/lib/chartUtils";
import LoadingState from "./LoadingState";

const RechartsChart = dynamic(() => import("./RechartsChart"), {
  ssr: false,
  loading: () => <LoadingState message="Loading chart..." />,
});

export default React.memo(function DepthChart({
  venue,
  symbol,
}: VenueSymbolProps) {
  const { bidCum, askCum } = useAppSelector(selectCumulative(venue, symbol));
  const stats = useAppSelector(selectMarketStats(venue, symbol));

  const midPrice = stats.midPrice;

  const chartData = useMemo(
    () => calculateChartData(bidCum, askCum, midPrice),
    [bidCum, askCum, midPrice]
  );

  const domains = useMemo(
    () => calculateChartDomains(chartData, midPrice, bidCum, askCum),
    [chartData, midPrice, bidCum, askCum]
  );

  const hasData = chartData.length > 0 && midPrice !== null;

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
});
