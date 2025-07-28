import { OB } from "../types";

export const BYBIT_WS = "wss://stream.bybit.com/v5/public/linear";

export function bybitTopic(symbol: string): string {
  return `orderbook.200.${symbol}`;
}

const orderbookMaps = new Map<
  string,
  {
    bids: Map<number, number>;
    asks: Map<number, number>;
    lastUpdateId: number;
  }
>();

function getOrCreateMaps(symbol: string) {
  if (!orderbookMaps.has(symbol)) {
    orderbookMaps.set(symbol, {
      bids: new Map(),
      asks: new Map(),
      lastUpdateId: 0,
    });
  }
  return orderbookMaps.get(symbol)!;
}

function materializeOrderbook(symbol: string): {
  bids: [number, number][];
  asks: [number, number][];
} {
  const maps = getOrCreateMaps(symbol);

  const bids = Array.from(maps.bids.entries())
    .filter(([, size]) => size > 0)
    .sort(([a], [b]) => b - a);

  const asks = Array.from(maps.asks.entries())
    .filter(([, size]) => size > 0)
    .sort(([a], [b]) => a - b);

  return { bids, asks };
}

function processOrderData(
  orders: [string, string][],
  map: Map<number, number>
) {
  for (const [price, size] of orders) {
    const numPrice = parseFloat(price);
    const numSize = parseFloat(size);
    if (!isNaN(numPrice) && !isNaN(numSize)) {
      if (numSize === 0) {
        map.delete(numPrice);
      } else {
        map.set(numPrice, numSize);
      }
    }
  }
}

export function bybitParse(msg: unknown): OB | undefined {
  try {
    const parsed = msg as {
      op?: string;
      success?: boolean;
      topic?: string;
      type?: string;
      data?: {
        s?: string; // symbol
        b?: [string, string][]; // bids
        a?: [string, string][]; // asks
        u?: number; // update id
        seq?: number; // sequence
      };
      ts?: number;
    };

    if (parsed.op === "subscribe" && parsed.success !== undefined) {
      console.info("Bybit subscription response:", parsed);
      return undefined;
    }

    if (!parsed.topic || !parsed.data || !parsed.type) {
      return undefined;
    }

    const topicMatch = parsed.topic.match(/^orderbook\.\d+\.(.+)$/);
    if (!topicMatch) {
      console.warn("Bybit: Unrecognized topic format:", parsed.topic);
      return undefined;
    }

    const symbol = topicMatch[1];
    const { b, a, u } = parsed.data;
    const type = parsed.type;

    const maps = getOrCreateMaps(symbol);

    if (u !== undefined && u <= maps.lastUpdateId && maps.lastUpdateId > 0) {
      console.info(
        `Bybit: Skipping old update ${u} (current: ${maps.lastUpdateId})`
      );
      return undefined;
    }

    if (type === "snapshot") {
      maps.bids.clear();
      maps.asks.clear();

      if (b) processOrderData(b, maps.bids);
      if (a) processOrderData(a, maps.asks);
      if (u !== undefined) {
        maps.lastUpdateId = u;
      }
    } else if (type === "delta") {
      // Apply incremental updates
      if (b) processOrderData(b, maps.bids);
      if (a) processOrderData(a, maps.asks);
      if (u !== undefined) {
        maps.lastUpdateId = u;
      }
    } else {
      console.warn("Bybit: Unknown data type:", type);
      return undefined;
    }

    const { bids, asks } = materializeOrderbook(symbol);

    if (bids.length === 0 && asks.length === 0) {
      console.warn("Bybit: Empty orderbook for", symbol);
      return undefined;
    }

    return {
      bids,
      asks,
      ts: parsed.ts || Date.now(),
    };
  } catch (error) {
    console.error("Bybit: Parse error:", error);
    return undefined;
  }
}
