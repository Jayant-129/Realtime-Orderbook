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
        s?: string;
        b?: [string, string][];
        a?: [string, string][];
        u?: number;
        seq?: number;
      };
      ts?: number;
    };

    if (parsed.op === "subscribe" && parsed.success !== undefined) {
      return undefined;
    }

    if (!parsed.topic || !parsed.data || !parsed.type) {
      return undefined;
    }

    const topicMatch = parsed.topic.match(/^orderbook\.\d+\.(.+)$/);
    if (!topicMatch) {
      return undefined;
    }

    const symbol = topicMatch[1];
    const { b, a, u } = parsed.data;
    const type = parsed.type;

    const maps = getOrCreateMaps(symbol);

    if (u !== undefined && u <= maps.lastUpdateId && maps.lastUpdateId > 0) {
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
      if (b) processOrderData(b, maps.bids);
      if (a) processOrderData(a, maps.asks);
      if (u !== undefined) {
        maps.lastUpdateId = u;
      }
    } else {
      return undefined;
    }

    const { bids, asks } = materializeOrderbook(symbol);

    if (bids.length === 0 && asks.length === 0) {
      return undefined;
    }

    return {
      bids,
      asks,
      ts: parsed.ts || Date.now(),
    };
  } catch {
    return undefined;
  }
}
