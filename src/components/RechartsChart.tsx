"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

type ChartData = {
  price: number;
  bidCum?: number;
  askCum?: number;
};

type Props = {
  data: ChartData[];
  xDomain: [number, number];
  yDomain: [number, number];
  midPrice: number;
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className="p-3 rounded border text-xs"
      style={{
        backgroundColor: "var(--tooltip)",
        borderColor: "var(--divider)",
        color: "var(--text)",
      }}
    >
      <div className="font-medium mb-1">Price: {Number(label).toFixed(2)}</div>
      {payload.map((entry: any, index: number) => (
        <div key={index} style={{ color: entry.color }}>
          {entry.dataKey === "bidCum" ? "Bid Depth" : "Ask Depth"}:{" "}
          {entry.value?.toFixed(4)}
        </div>
      ))}
    </div>
  );
};

export default function RechartsChart({
  data,
  xDomain,
  yDomain,
  midPrice,
}: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={data}
        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      >
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="bidFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--bid)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--bid)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="askFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ask)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--ask)" stopOpacity={0.1} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--grid)"
          opacity={0.3}
        />

        <XAxis
          dataKey="price"
          type="number"
          scale="linear"
          domain={xDomain}
          tick={{ fill: "var(--muted)", fontSize: 10 }}
          tickFormatter={(value) => Number(value).toFixed(1)}
        />

        <YAxis
          domain={yDomain}
          tick={{ fill: "var(--muted)", fontSize: 10 }}
          tickFormatter={(value) => Number(value).toFixed(2)}
        />

        <Tooltip content={<CustomTooltip />} />

        {/* Bid area (green) - no clipping for now to debug visibility */}
        <Area
          type="stepAfter"
          dataKey="bidCum"
          stroke="var(--bid)"
          strokeWidth={2}
          fill="url(#bidFill)"
          connectNulls={false}
        />

        {/* Ask area (red) - no clipping for now to debug visibility */}
        <Area
          type="stepAfter"
          dataKey="askCum"
          stroke="var(--ask)"
          strokeWidth={2}
          fill="url(#askFill)"
          connectNulls={false}
        />

        {/* Mid-price reference line */}
        <ReferenceLine
          x={midPrice}
          stroke="var(--muted)"
          strokeDasharray="2 2"
          opacity={0.8}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
