import { OB } from "../types";

export const DERIBIT_WS = "wss://www.deribit.com/ws/api/v2";

type OrderLevel = [number, number];
type OrderAction = "new" | "change" | "delete";
type OrderChange = [OrderAction, number, number] | OrderLevel;

interface OrderbookMaps {
  bids: Map<number, number>;
  asks: Map<number, number>;
  lastChangeId: number;
}

const orderbookMaps = new Map<string, OrderbookMaps>();

function getOrCreateMaps(instrument: string): OrderbookMaps {
  if (!orderbookMaps.has(instrument)) {
    orderbookMaps.set(instrument, {
      bids: new Map(),
      asks: new Map(),
      lastChangeId: 0,
    });
  }
  return orderbookMaps.get(instrument)!;
}

function materializeOrderbook(instrument: string): {
  bids: OrderLevel[];
  asks: OrderLevel[];
} {
  const maps = getOrCreateMaps(instrument);
  const bids = Array.from(maps.bids.entries())
    .filter(([, size]) => size > 0)
    .sort(([a], [b]) => b - a);
  const asks = Array.from(maps.asks.entries())
    .filter(([, size]) => size > 0)
    .sort(([a], [b]) => a - b);
  return { bids, asks };
}

function parseOrderLevel(
  level:
    | [string | number, string | number]
    | [OrderAction, string | number, string | number]
): OrderLevel {
  let price: string | number;
  let size: string | number;

  if (level.length === 3) {
    price = level[1];
    size = level[2];
  } else {
    price = level[0];
    size = level[1];
  }

  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  const numSize = typeof size === "string" ? parseFloat(size) : size;
  return [numPrice, numSize];
}

function applySnapshot(
  maps: OrderbookMaps,
  bids?: OrderLevel[],
  asks?: OrderLevel[]
) {
  maps.bids.clear();
  maps.asks.clear();
  bids?.forEach(([price, size]) => {
    if (!isNaN(price) && !isNaN(size) && price > 0) maps.bids.set(price, size);
  });
  asks?.forEach(([price, size]) => {
    if (!isNaN(price) && !isNaN(size) && price > 0) maps.asks.set(price, size);
  });
}

function applyChanges(
  maps: OrderbookMaps,
  changes: OrderChange[] | undefined,
  side: "bids" | "asks"
) {
  const map = side === "bids" ? maps.bids : maps.asks;
  changes?.forEach((update) => {
    if (!Array.isArray(update)) return;

    let action: string = "change";
    let price: number;
    let size: number;

    if (update.length >= 3 && typeof update[0] === "string") {
      action = update[0];
      const [price1, size1] = parseOrderLevel(update);
      price = price1;
      size = size1;
    } else if (update.length === 2) {
      const [price1, size1] = parseOrderLevel(
        update as [string | number, string | number]
      );
      price = price1;
      size = size1;
    } else {
      return;
    }

    if (isNaN(price) || price <= 0) return;

    if (action === "delete" || size === 0) {
      map.delete(price);
    } else {
      map.set(price, size);
    }
  });
}

export function deribitParse(msg: unknown): OB | undefined {
  try {
    const parsed = msg as {
      id?: number;
      jsonrpc?: string;
      result?: unknown;
      method?: string;
      params?: {
        channel?: string;
        data?: {
          instrument_name?: string;
          change_id?: number;
          prev_change_id?: number;
          bids?: OrderChange[];
          asks?: OrderChange[];
          timestamp?: number;
        };
      };
      error?: { message?: string; code?: number };
    };

    if (parsed.error) return undefined;
    if (parsed.id !== undefined && parsed.result !== undefined)
      return undefined;
    if (parsed.method !== "subscription" || !parsed.params?.data)
      return undefined;

    const { channel, data } = parsed.params;
    if (!channel) return undefined;

    const instrument =
      channel.match(/^book\.([^.]+)/)?.[1] || data.instrument_name;
    if (!instrument) return undefined;

    const maps = getOrCreateMaps(instrument);
    const isChange = !!data.prev_change_id;

    if (!isChange) {
      maps.bids.clear();
      maps.asks.clear();
      if (Array.isArray(data.bids)) {
        data.bids.forEach((item) => {
          const [price, size] = parseOrderLevel(item);
          if (!isNaN(price) && !isNaN(size) && price > 0) {
            maps.bids.set(price, size);
          }
        });
      }

      if (Array.isArray(data.asks)) {
        data.asks.forEach((item) => {
          const [price, size] = parseOrderLevel(item);
          if (!isNaN(price) && !isNaN(size) && price > 0) {
            maps.asks.set(price, size);
          }
        });
      }
    } else {
      applyChanges(maps, data.bids, "bids");
      applyChanges(maps, data.asks, "asks");
    }

    if (data.change_id !== undefined) maps.lastChangeId = data.change_id;
    const { bids, asks } = materializeOrderbook(instrument);
    if (bids.length === 0 && asks.length === 0) return undefined;

    return {
      bids,
      asks,
      ts: data.timestamp || Date.now(),
    };
  } catch {
    return undefined;
  }
}

export function deribitSubscribe(instrument: string) {
  let formattedInstrument = instrument;

  if (!instrument.includes("-") && !instrument.includes("_")) {
    if (instrument.toUpperCase().includes("PERPETUAL")) {
      const base = instrument.replace(/PERPETUAL/i, "");
      formattedInstrument = `${base.toUpperCase()}-PERPETUAL`;
    }
  }

  return {
    jsonrpc: "2.0",
    id: 1,
    method: "public/subscribe",
    params: {
      channels: [`book.${formattedInstrument}.none.20.100ms`],
    },
  };
}
