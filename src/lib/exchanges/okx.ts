import { OB } from "../types";
import { logger } from "../logger";

export const OKX_WS = "wss://ws.okx.com:8443/ws/v5/public";

export function okxSubscribe(instId: string) {
  let formattedInstId = instId;
  if (!instId.includes("-") && instId.includes("USDT")) {
    const base = instId.replace("USDT", "");
    formattedInstId = `${base}-USDT`;
  }

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

    if (parsed.event === "subscribe") {
      const subscriptionSymbol = parsed.arg?.instId || "unknown";
      logger.exchangeSubscription("OKX", subscriptionSymbol, true);
      return undefined;
    }
    if (parsed.event === "error") {
      const subscriptionSymbol = parsed.arg?.instId || "unknown";
      logger.exchangeSubscription("OKX", subscriptionSymbol, false);
      logger.error("OKX subscription error", {
        exchange: "OKX",
        symbol: subscriptionSymbol,
        code: parsed.code,
        message: parsed.msg,
      });
      return undefined;
    }
    if (!parsed.data || !parsed.data[0]) {
      return undefined;
    }

    const symbol = parsed.arg?.instId;
    if (!symbol) {
      logger.warn("Missing symbol in message", {
        exchange: "OKX",
        action: "parse_message",
      });
      return undefined;
    }

    const data = parsed.data[0];
    const { bids: b, asks: a } = data;

    const action = parsed.action;
    if (!action) {
      logger.warn("Missing action in message", {
        exchange: "OKX",
        symbol,
        action: "parse_message",
      });
      return undefined;
    }

    const maps = getOrCreateMaps(symbol);

    if (action === "snapshot") {
      maps.bids.clear();
      maps.asks.clear();
      if (b) processOrderData(b, maps.bids);
      if (a) processOrderData(a, maps.asks);
    } else if (action === "update") {
      if (b) processOrderData(b, maps.bids);
      if (a) processOrderData(a, maps.asks);
    } else {
      logger.warn("Unknown action type", {
        exchange: "OKX",
        symbol,
        action,
        receivedAction: action,
      });
      return undefined;
    }

    const { bids, asks } = materializeOrderbook(symbol);

    if (bids.length === 0 && asks.length === 0) {
      logger.warn("Empty orderbook received", {
        exchange: "OKX",
        symbol,
        action: "validate_orderbook",
      });
      return undefined;
    }

    return {
      bids,
      asks,
      ts: parseInt(data.ts) || Date.now(),
    };
  } catch (error) {
    logger.exchangeError("OKX", "unknown", error as Error, "parse_message");
    return undefined;
  }
}
