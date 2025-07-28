import { Middleware } from "@reduxjs/toolkit";
import {
  bookConnecting,
  bookOpen,
  bookUpdate,
  bookError,
} from "./orderbooksSlice";
import { pushBanner, clearBanner, type Banner } from "./uiSlice";
import { nextDelay } from "@/lib/backoff";
import { OKX_WS, okxSubscribe, okxParse } from "@/lib/exchanges/okx";
import { BYBIT_WS, bybitTopic, bybitParse } from "@/lib/exchanges/bybit";
import {
  DERIBIT_WS,
  deribitSubscribe,
  deribitParse,
} from "@/lib/exchanges/deribit";

export const connectBook = (p: {
  venue: "OKX" | "Bybit" | "Deribit";
  symbol: string;
  depth?: number;
}) => ({ type: "ws/connect", payload: p });

export const disconnectBook = (p: {
  venue: "OKX" | "Bybit" | "Deribit";
  symbol: string;
}) => ({ type: "ws/disconnect", payload: p });

export const wsMiddleware: Middleware = (store) => {
  const sockets = new Map<string, WebSocket>();
  const timers = new Map<string, NodeJS.Timeout>();
  const attempts = new Map<string, number>();
  const staleTimers = new Map<string, NodeJS.Timeout>();
  const connectionStates = new Map<
    string,
    "connecting" | "connected" | "error" | "disconnected"
  >();

  function getKey(venue: string, symbol: string): string {
    return `${venue}:${symbol}`;
  }

  function getBannerKey(
    type: "connecting" | "error" | "stale" | "degraded",
    key: string
  ): string {
    return `${type}:${key}`;
  }

  function getWSEndpoint(venue: "OKX" | "Bybit" | "Deribit"): string {
    switch (venue) {
      case "OKX":
        return OKX_WS;
      case "Bybit":
        return BYBIT_WS;
      case "Deribit":
        return DERIBIT_WS;
      default:
        return "";
    }
  }

  function getSubscribePayload(
    venue: "OKX" | "Bybit" | "Deribit",
    symbol: string
  ): any {
    switch (venue) {
      case "OKX":
        return okxSubscribe(symbol);
      case "Bybit":
        return { op: "subscribe", args: [bybitTopic(symbol)] };
      case "Deribit":
        return deribitSubscribe(symbol);
      default:
        return null;
    }
  }

  function parseMessage(venue: "OKX" | "Bybit" | "Deribit", msg: unknown) {
    switch (venue) {
      case "OKX":
        return okxParse(msg);
      case "Bybit":
        return bybitParse(msg);
      case "Deribit":
        return deribitParse(msg);
      default:
        return undefined;
    }
  }

  function setupStaleProtection(key: string) {
    const existingTimer = staleTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(async () => {
      const state = store.getState();
      const lastUpdate = state.orderbooks.lastUpdateTs[key];
      const now = Date.now();

      if (!lastUpdate || now - lastUpdate > 30000) {
        const [venue, symbol] = key.split(":");
        const displayName = `${venue} ${symbol}`;

        store.dispatch(
          pushBanner({
            id: getBannerKey("stale", key),
            type: "warning",
            message: `Connection slow. Reconnecting ${displayName}...`,
          })
        );

        if (venue && symbol) {
          connectionStates.set(key, "error");
          disconnect(key);
          setTimeout(() => {
            connect(venue as any, symbol);
          }, 1000);
        }
      }
    }, 30000);

    staleTimers.set(key, timer);
  }

  function checkDepthQuality(key: string, ob: any) {
    const bidCount = ob.bids?.length || 0;
    const askCount = ob.asks?.length || 0;
    const totalLevels = bidCount + askCount;

    const criticallyLow = totalLevels < 8;
    const bothSidesWeak = bidCount < 5 && askCount < 5;

    if (criticallyLow || bothSidesWeak) {
      const [venue, symbol] = key.split(":");
      const displayName = `${venue} ${symbol}`;
      const state = store.getState();
      const existingBanner = state.ui.banners.find(
        (b: Banner) => b.id === getBannerKey("degraded", key)
      );

      if (!existingBanner) {
        store.dispatch(
          pushBanner({
            id: getBannerKey("degraded", key),
            type: "warning",
            message: `Limited depth for ${displayName} (${bidCount}b/${askCount}a)`,
          })
        );
      }
    } else if (totalLevels >= 12) {
      store.dispatch(clearBanner(getBannerKey("degraded", key)));
    }
  }

  function connect(
    venue: "OKX" | "Bybit" | "Deribit",
    symbol: string,
    depth?: number
  ) {
    const key = getKey(venue, symbol);
    const displayName = `${venue} ${symbol}`;

    disconnect(key);

    const endpoint = getWSEndpoint(venue);
    if (!endpoint) {
      store.dispatch(bookError({ key, error: `Unknown venue: ${venue}` }));
      store.dispatch(
        pushBanner({
          id: getBannerKey("error", key),
          type: "error",
          message: `Unknown venue: ${venue}`,
        })
      );
      return;
    }

    connectionStates.set(key, "connecting");
    store.dispatch(bookConnecting({ key }));
    store.dispatch(
      pushBanner({
        id: getBannerKey("connecting", key),
        type: "info",
        message: `Connecting to ${displayName}...`,
      })
    );

    try {
      const ws = new WebSocket(endpoint);
      sockets.set(key, ws);

      ws.onopen = () => {
        connectionStates.set(key, "connected");
        store.dispatch(bookOpen({ key }));
        store.dispatch(clearBanner(getBannerKey("connecting", key)));
        store.dispatch(clearBanner(getBannerKey("error", key)));
        store.dispatch(clearBanner(getBannerKey("stale", key)));
        attempts.set(key, 0);
        const payload = getSubscribePayload(venue, symbol);
        console.log(`Subscribing to ${displayName} with payload:`, payload);
        if (payload) {
          ws.send(JSON.stringify(payload));
        }
        setupStaleProtection(key);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const ob = parseMessage(venue, data);

          if (ob) {
            store.dispatch(bookUpdate({ key, ob }));
            setupStaleProtection(key);
            checkDepthQuality(key, ob);
          }
        } catch (error) {
          console.warn(`Failed to parse message for ${key}:`, error);
        }
      };

      ws.onerror = (error) => {
        connectionStates.set(key, "error");
        store.dispatch(bookError({ key, error: `Connection error` }));

        const [venueStr, symbolStr] = key.split(":");
        const displayName = `${venueStr} ${symbolStr}`;
        store.dispatch(
          pushBanner({
            id: getBannerKey("error", key),
            type: "error",
            message: `Connection error for ${displayName}`,
          })
        );
      };

      ws.onclose = (event) => {
        connectionStates.set(key, "disconnected");

        if (event.code !== 1000) {
          scheduleReconnect(venue, symbol, depth);
        } else {
          store.dispatch(clearBanner(getBannerKey("connecting", key)));
        }

        sockets.delete(key);

        const staleTimer = staleTimers.get(key);
        if (staleTimer) {
          clearTimeout(staleTimer);
          staleTimers.delete(key);
        }
      };
    } catch (error) {
      store.dispatch(bookError({ key, error: `Failed to create connection` }));
      const [venueStr, symbolStr] = key.split(":");
      const displayName = `${venueStr} ${symbolStr}`;
      store.dispatch(
        pushBanner({
          id: getBannerKey("error", key),
          type: "error",
          message: `Failed to connect to ${displayName}`,
        })
      );
      scheduleReconnect(venue, symbol, depth);
    }
  }

  function disconnect(key: string) {
    const ws = sockets.get(key);
    if (ws) {
      ws.close(1000, "Normal closure");
      sockets.delete(key);
    }

    const timer = timers.get(key);
    if (timer) {
      clearTimeout(timer);
      timers.delete(key);
    }

    const staleTimer = staleTimers.get(key);
    if (staleTimer) {
      clearTimeout(staleTimer);
      staleTimers.delete(key);
    }

    store.dispatch(clearBanner(getBannerKey("connecting", key)));
    store.dispatch(clearBanner(getBannerKey("error", key)));
    store.dispatch(clearBanner(getBannerKey("stale", key)));
    store.dispatch(clearBanner(getBannerKey("degraded", key)));

    attempts.delete(key);
    connectionStates.delete(key);
  }

  function scheduleReconnect(
    venue: "OKX" | "Bybit" | "Deribit",
    symbol: string,
    depth?: number
  ) {
    const key = getKey(venue, symbol);

    // Clear existing timer
    const existingTimer = timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const currentAttempts = attempts.get(key) || 0;
    const delay = nextDelay(currentAttempts);
    attempts.set(key, currentAttempts + 1);

    const timer = setTimeout(() => {
      connect(venue, symbol, depth);
    }, delay);

    timers.set(key, timer);
  }
  return (next) => (action) => {
    const typedAction = action as any;

    if (typedAction.type === "ws/connect") {
      const { venue, symbol, depth } = typedAction.payload;
      connect(venue, symbol, depth);
    } else if (typedAction.type === "ws/disconnect") {
      const { venue, symbol } = typedAction.payload;
      const key = getKey(venue, symbol);
      disconnect(key);
    }

    return next(action);
  };
};
