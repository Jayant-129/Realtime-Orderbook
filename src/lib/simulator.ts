import { OB, Side, VenueKey } from "./types";

/**
 * TODO:
 * - Pure simulation: sweep book for market/limit; compute fill %, avg, slippage bps, impact levels.
 * - No I/O; SOLID: Single Responsibility and Open-Closed.
 */

export type SimInput = {
  side: Side;
  type: "market" | "limit";
  price?: number;
  qty: number;
  delayMs: number;
};

export type SimResult = {
  venue: VenueKey;
  estFillPct: number;
  estAvgPx: number;
  estSlippageBps: number;
  impactQtyLevels: number;
  timeToFillMs?: number;
  highlightedPrice?: number;
  ts: number;
};

export function simulate(ob: OB, venue: VenueKey, input: SimInput): SimResult {
  const { side, type, price: limitPrice, qty } = input;

  // Initialize metrics
  let filled = 0;
  let notional = 0;
  let levelsTouched = 0;

  // Determine which side of book to sweep
  const levels = side === "buy" ? ob.asks : ob.bids;

  // Get best price for slippage calculation
  const bestPrice =
    side === "buy"
      ? ob.asks[0]?.[0] || 0 // Best ask (lowest)
      : ob.bids[0]?.[0] || 0; // Best bid (highest)

  // Sweep the book
  for (const [levelPrice, levelSize] of levels) {
    // Check limit price constraint
    if (type === "limit" && limitPrice !== undefined) {
      if (side === "buy" && levelPrice > limitPrice) break; // Buy: don't pay more than limit
      if (side === "sell" && levelPrice < limitPrice) break; // Sell: don't sell below limit
    }

    const remainingQty = qty - filled;
    if (remainingQty <= 0) break;

    // Take what we can from this level
    const takeQty = Math.min(remainingQty, levelSize);
    filled += takeQty;
    notional += takeQty * levelPrice;
    levelsTouched++;

    // If we filled completely at this level, we're done
    if (filled >= qty) break;
  }

  // Calculate metrics
  const estFillPct = qty > 0 ? (filled / qty) * 100 : 0;

  let estAvgPx = 0;
  if (filled > 0) {
    estAvgPx = notional / filled;
  } else {
    // Fallback for unfilled orders
    if (type === "limit" && limitPrice !== undefined) {
      estAvgPx = limitPrice;
    } else {
      estAvgPx = bestPrice;
    }
  }

  // Calculate slippage in basis points vs best price
  let estSlippageBps = 0;
  if (bestPrice > 0 && estAvgPx > 0) {
    if (side === "buy") {
      // Positive slippage = paying more than best ask
      estSlippageBps = ((estAvgPx - bestPrice) / bestPrice) * 10000;
    } else {
      // Positive slippage = receiving less than best bid
      estSlippageBps = ((bestPrice - estAvgPx) / bestPrice) * 10000;
    }
  }

  // Determine highlighted price and time to fill
  const highlightedPrice = type === "limit" ? limitPrice : undefined;
  const timeToFillMs = type === "market" ? 0 : undefined;

  return {
    venue,
    estFillPct,
    estAvgPx,
    estSlippageBps,
    impactQtyLevels: levelsTouched,
    timeToFillMs,
    highlightedPrice,
    ts: Date.now(),
  };
}
