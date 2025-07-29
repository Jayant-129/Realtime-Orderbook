import { Middleware } from "@reduxjs/toolkit";
import {
  bookConnecting,
  bookOpen,
  bookUpdate,
  bookError,
} from "./orderbooksSlice";
import { pushBanner, clearBanner, type Banner } from "./uiSlice";
import { nextDelay } from "@/lib/backoff";
import { okxSubscribe, okxParse } from "@/lib/exchanges/okx";
import { bybitTopic, bybitParse } from "@/lib/exchanges/bybit";
import { deribitSubscribe, deribitParse } from "@/lib/exchanges/deribit";
import { Venue } from "@/lib/types";
import { getWSEndpoint } from "@/lib/venueConfig";
import { logger } from "@/lib/logger";

export const connectBook = (p: {
  venue: Venue;
  symbol: string;
  depth?: number;
}) => ({ type: "ws/connect", payload: p });

export const disconnectBook = (p: { venue: Venue; symbol: string }) => ({
  type: "ws/disconnect",
  payload: p,
});

export const wsMiddleware: Middleware = (store) => {
  const sockets = new Map<string, WebSocket>();
  const timers = new Map<string, NodeJS.Timeout>();
  const attempts = new Map<string, number>();
  const staleTimers = new Map<string, NodeJS.Timeout>();
  const connectionStates = new Map<
    string,
    "connecting" | "connected" | "error" | "disconnected"
  >();
  const connectionStartTimes = new Map<string, number>();
  const errorTimers = new Map<string, NodeJS.Timeout>();

  const ERROR_BANNER_GRACE_PERIOD = 5000;
  const INITIAL_RETRY_ATTEMPTS = 3;
  const STALE_CONNECTION_TIMEOUT = 30000;

  function clearAllBanners(key: string) {
    const bannerTypes = ["connecting", "error", "stale", "degraded"] as const;
    bannerTypes.forEach((type) => {
      store.dispatch(clearBanner(getBannerKey(type, key)));
    });
  }

  function cleanupTimers(key: string) {
    const timerMaps = [timers, staleTimers, errorTimers];
    timerMaps.forEach((map) => {
      const timer = map.get(key);
      if (timer) {
        clearTimeout(timer);
        map.delete(key);
      }
    });
  }

  function getKey(venue: string, symbol: string): string {
    return `${venue}:${symbol}`;
  }

  function getBannerKey(
    type: "connecting" | "error" | "stale" | "degraded",
    key: string
  ): string {
    return `${type}:${key}`;
  }

  function getSubscribePayload(venue: Venue, symbol: string): unknown {
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

  function parseMessage(venue: Venue, msg: unknown) {
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

      if (!lastUpdate || now - lastUpdate > STALE_CONNECTION_TIMEOUT) {
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
            connect(venue as Venue, symbol);
          }, 1000);
        }
      }
    }, STALE_CONNECTION_TIMEOUT);

    staleTimers.set(key, timer);
  }

  function checkDepthQuality(
    key: string,
    ob: { bids?: unknown[]; asks?: unknown[] }
  ) {
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
    if (!connectionStartTimes.has(key)) {
      connectionStartTimes.set(key, Date.now());
    }
    const currentAttempts = attempts.get(key) || 0;

    store.dispatch(bookConnecting({ key }));

    if (currentAttempts === 0) {
      store.dispatch(
        pushBanner({
          id: getBannerKey("connecting", key),
          type: "info",
          message: `Connecting to ${displayName}...`,
        })
      );
    }

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
        connectionStartTimes.delete(key);

        const errorTimer = errorTimers.get(key);
        if (errorTimer) {
          clearTimeout(errorTimer);
          errorTimers.delete(key);
        }

        const payload = getSubscribePayload(venue, symbol);
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
          logger.error(
            "Failed to parse WebSocket message",
            {
              exchange: key.split("-")[0],
              symbol: key.split("-")[1],
              action: "parse_message",
            },
            error as Error
          );
        }
      };

      ws.onerror = () => {
        connectionStates.set(key, "error");
        store.dispatch(bookError({ key, error: `Connection error` }));

        const currentAttempts = attempts.get(key) || 0;
        const connectionStartTime = connectionStartTimes.get(key) || Date.now();
        const timeSinceStart = Date.now() - connectionStartTime;
        if (
          timeSinceStart > ERROR_BANNER_GRACE_PERIOD &&
          currentAttempts >= INITIAL_RETRY_ATTEMPTS
        ) {
          const existingErrorTimer = errorTimers.get(key);
          if (existingErrorTimer) {
            clearTimeout(existingErrorTimer);
          }

          const errorTimer = setTimeout(() => {
            if (connectionStates.get(key) === "error") {
              store.dispatch(
                pushBanner({
                  id: getBannerKey("error", key),
                  type: "error",
                  message: `Connection unstable for ${displayName}. Retrying...`,
                })
              );
            }
          }, 1000);

          errorTimers.set(key, errorTimer);
        }
      };

      ws.onclose = (event) => {
        connectionStates.set(key, "disconnected");
        sockets.delete(key);
        const staleTimer = staleTimers.get(key);
        if (staleTimer) {
          clearTimeout(staleTimer);
          staleTimers.delete(key);
        }

        if (event.code !== 1000) {
          scheduleReconnect(venue, symbol, depth);
        } else {
          store.dispatch(clearBanner(getBannerKey("connecting", key)));
        }
      };
    } catch {
      store.dispatch(bookError({ key, error: `Failed to create connection` }));

      const currentAttempts = attempts.get(key) || 0;
      if (currentAttempts >= INITIAL_RETRY_ATTEMPTS) {
        store.dispatch(
          pushBanner({
            id: getBannerKey("error", key),
            type: "error",
            message: `Failed to connect to ${displayName}`,
          })
        );
      }

      scheduleReconnect(venue, symbol, depth);
    }
  }

  function disconnect(key: string) {
    const ws = sockets.get(key);
    if (ws) {
      ws.close(1000, "Normal closure");
      sockets.delete(key);
    }

    cleanupTimers(key);
    clearAllBanners(key);

    attempts.delete(key);
    connectionStates.delete(key);
    connectionStartTimes.delete(key);
  }

  function scheduleReconnect(
    venue: "OKX" | "Bybit" | "Deribit",
    symbol: string,
    depth?: number
  ) {
    const key = getKey(venue, symbol);

    const existingTimer = timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const currentAttempts = attempts.get(key) || 0;
    if (currentAttempts < INITIAL_RETRY_ATTEMPTS) {
      const delay = Math.min(1000 * (currentAttempts + 1), 3000);
      attempts.set(key, currentAttempts + 1);

      const timer = setTimeout(() => {
        if (connectionStates.get(key) === "disconnected") {
          connect(venue, symbol, depth);
        }
      }, delay);

      timers.set(key, timer);
    } else {
      const delay = nextDelay(currentAttempts);
      attempts.set(key, currentAttempts + 1);

      const timer = setTimeout(() => {
        connect(venue, symbol, depth);
      }, delay);

      timers.set(key, timer);
    }
  }
  return (next) => (action) => {
    const typedAction = action as { type: string; payload?: unknown };

    if (typedAction.type === "ws/connect") {
      const { venue, symbol, depth } = typedAction.payload as {
        venue: Venue;
        symbol: string;
        depth?: number;
      };
      connect(venue, symbol, depth);
    } else if (typedAction.type === "ws/disconnect") {
      const { venue, symbol } = typedAction.payload as {
        venue: Venue;
        symbol: string;
      };
      const key = getKey(venue, symbol);
      disconnect(key);
    }

    return next(action);
  };
};
