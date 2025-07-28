import { OB } from "./types";

export function mid(ob?: OB): number {
  if (!ob || !ob.bids.length || !ob.asks.length) {
    return NaN;
  }

  const bestBid = ob.bids[0]?.[0];
  const bestAsk = ob.asks[0]?.[0];

  if (typeof bestBid !== "number" || typeof bestAsk !== "number") {
    return NaN;
  }

  return (bestBid + bestAsk) / 2;
}

export function cumulative(
  ob: OB,
  side: "bid" | "ask"
): Array<{ price: number; size: number; cum: number }> {
  const levels = side === "bid" ? ob.bids : ob.asks;
  const result: Array<{ price: number; size: number; cum: number }> = [];
  let cumSize = 0;

  for (const [price, size] of levels) {
    cumSize += size;
    result.push({
      price,
      size,
      cum: cumSize,
    });
  }

  return result;
}
