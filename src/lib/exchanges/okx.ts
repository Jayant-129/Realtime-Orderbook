import { OB } from "../types";

export const OKX_WS = "wss://ws.okx.com:8443/ws/v5/public";

export function okxSubscribe(instId: string) {
  let formattedInstId = instId;
  if (!instId.includes("-") && instId.includes("USDT")) {
    const base = instId.replace("USDT", "");
    formattedInstId = `${base}-USDT`;
  }

  console.log(`OKX: Subscribing to instrument ${formattedInstId}`);

  return {
    op: "subscribe",
    args: [
      {
        channel: "books",
        instId: formattedInstId,
      },
    ],
  };
}

const orderbookMaps = new Map<
  string,
  {
    bids: Map<number, number>;
    asks: Map<number, number>;
  }
>();

function getOrCreateMaps(symbol: string) {
  if (!orderbookMaps.has(symbol)) {
    orderbookMaps.set(symbol, {
      bids: new Map(),
      asks: new Map(),
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
  orders: [string, string, string, string][],
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

export function okxParse(msg: unknown): OB | undefined {
  try {
    const parsed = msg as {
      event?: string;
      code?: string;
      msg?: string;
      arg?: {
        channel: string;
        instId: string;
      };
      action?: string;
      data?: Array<{
        asks: [string, string, string, string][];
        bids: [string, string, string, string][];
        ts: string;
        checksum?: number;
      }>;
    };

    // Handle subscription confirmation
    if (parsed.event === "subscribe") {
      console.info("OKX subscription confirmed:", parsed);
      return undefined;
    }

    // Handle errors
    if (parsed.event === "error") {
      console.error("OKX subscription error:", parsed);
      return undefined;
    }

    // Validate message has data
    if (!parsed.data || !parsed.data[0]) {
      return undefined;
    }

    // Extract symbol from message
    const symbol = parsed.arg?.instId;
    if (!symbol) {
      console.warn("OKX: Missing symbol in message");
      return undefined;
    }

    const data = parsed.data[0];
    const { bids: b, asks: a } = data;

    // Get action (snapshot or update)
    const action = parsed.action;
    if (!action) {
      console.warn("OKX: Missing action in message");
      return undefined;
    }

    const maps = getOrCreateMaps(symbol);

    if (action === "snapshot") {
      // Clear existing data for a fresh snapshot
      maps.bids.clear();
      maps.asks.clear();

      // Process the snapshot data
      if (b) processOrderData(b, maps.bids);
      if (a) processOrderData(a, maps.asks);
    } else if (action === "update") {
      // Apply incremental updates
      if (b) processOrderData(b, maps.bids);
      if (a) processOrderData(a, maps.asks);
    } else {
      console.warn("OKX: Unknown action type:", action);
      return undefined;
    }

    // Create the final orderbook object
    const { bids, asks } = materializeOrderbook(symbol);

    // Verify we have data
    if (bids.length === 0 && asks.length === 0) {
      console.warn("OKX: Empty orderbook for", symbol);
      return undefined;
    }

    return {
      bids,
      asks,
      ts: parseInt(data.ts) || Date.now(),
    };
  } catch (error) {
    console.error("OKX: Parse error:", error);
    return undefined;
  }
}
