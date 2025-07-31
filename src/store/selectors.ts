import { createSelector } from "@reduxjs/toolkit";
import { RootState } from ".";
import { L2, OB, Side } from "@/lib/types";
import { cumulative } from "@/lib/normalize";

const selectOrderbooksState = (state: RootState) => state.orderbooks;
const selectSimsState = (state: RootState) => state.sims;
const selectUiState = (state: RootState) => state.ui;

export const selectBook = (venue: string, symbol: string) =>
  createSelector(
    [selectOrderbooksState],
    (orderbooks): OB | undefined => orderbooks.books[`${venue}:${symbol}`]
  );

export const selectBookStatus = (venue: string, symbol: string) =>
  createSelector(
    [selectOrderbooksState],
    (orderbooks): "idle" | "connecting" | "open" | "error" =>
      orderbooks.status[`${venue}:${symbol}`] || "idle"
  );

export const selectLastUpdateTs = (venue: string, symbol: string) =>
  createSelector(
    [selectOrderbooksState],
    (orderbooks): number | undefined =>
      orderbooks.lastUpdateTs[`${venue}:${symbol}`]
  );

export const selectTopN = (venue: string, symbol: string, n: number) =>
  createSelector(
    [selectBook(venue, symbol), selectSimsState],
    (book, sims): { bids: L2[]; asks: L2[] } => {
      if (!book) {
        return { bids: [], asks: [] };
      }

      let bids = book.bids.slice(0, n);
      let asks = book.asks.slice(0, n);

      const bidHighlight = sims.lastHighlights[`${venue}:${symbol}:buy`];
      const askHighlight = sims.lastHighlights[`${venue}:${symbol}:sell`];

      if (bidHighlight !== undefined) {
        const bidHighlightPrice = bidHighlight.price;
        const bidHighlightQty = bidHighlight.qty;
        const bidExistsInVisible = bids.findIndex(
          ([price]) => Math.abs(price - bidHighlightPrice) < 1e-8
        );

        if (bidExistsInVisible !== -1) {
          bids = bids.map(([price, size], index) =>
            index === bidExistsInVisible
              ? [price, size + bidHighlightQty]
              : [price, size]
          );
        } else {
          const bidIndexInBook = book.bids.findIndex(
            ([price]) => Math.abs(price - bidHighlightPrice) < 1e-8
          );
          if (bidIndexInBook !== -1) {
            bids = book.bids
              .slice(0, Math.max(n, bidIndexInBook + 1))
              .map(([price, size], index) =>
                index === bidIndexInBook
                  ? [price, size + bidHighlightQty]
                  : [price, size]
              );
          } else {
            const insertIndex = bids.findIndex(
              ([price]) => price < bidHighlightPrice
            );
            if (insertIndex === -1) {
              bids = [...bids, [bidHighlightPrice, bidHighlightQty]];
            } else {
              bids = [
                ...bids.slice(0, insertIndex),
                [bidHighlightPrice, bidHighlightQty],
                ...bids.slice(insertIndex),
              ];
            }
          }
        }
      }

      if (askHighlight !== undefined) {
        const askHighlightPrice = askHighlight.price;
        const askHighlightQty = askHighlight.qty;
        const askExistsInVisible = asks.findIndex(
          ([price]) => Math.abs(price - askHighlightPrice) < 1e-8
        );

        if (askExistsInVisible !== -1) {
          asks = asks.map(([price, size], index) =>
            index === askExistsInVisible
              ? [price, size + askHighlightQty]
              : [price, size]
          );
        } else {
          const askIndexInBook = book.asks.findIndex(
            ([price]) => Math.abs(price - askHighlightPrice) < 1e-8
          );
          if (askIndexInBook !== -1) {
            asks = book.asks
              .slice(0, Math.max(n, askIndexInBook + 1))
              .map(([price, size], index) =>
                index === askIndexInBook
                  ? [price, size + askHighlightQty]
                  : [price, size]
              );
          } else {
            const insertIndex = asks.findIndex(
              ([price]) => price > askHighlightPrice
            );
            if (insertIndex === -1) {
              asks = [...asks, [askHighlightPrice, askHighlightQty]];
            } else {
              asks = [
                ...asks.slice(0, insertIndex),
                [askHighlightPrice, askHighlightQty],
                ...asks.slice(insertIndex),
              ];
            }
          }
        }
      }

      return { bids, asks };
    }
  );

export const selectCumulative = (venue: string, symbol: string) =>
  createSelector(
    [selectBook(venue, symbol)],
    (
      book
    ): {
      bidCum: Array<{ price: number; size: number; cum: number }>;
      askCum: Array<{ price: number; size: number; cum: number }>;
    } => {
      if (!book) {
        return { bidCum: [], askCum: [] };
      }
      return {
        bidCum: cumulative(book, "bid"),
        askCum: cumulative(book, "ask"),
      };
    }
  );

export const selectHighlight = (venue: string, symbol: string, side?: Side) =>
  createSelector([selectSimsState], (sims): number | undefined => {
    if (side) {
      return sims.lastHighlights[`${venue}:${symbol}:${side}`]?.price;
    } else {
      return (
        sims.lastHighlights[`${venue}:${symbol}:buy`]?.price ||
        sims.lastHighlights[`${venue}:${symbol}:sell`]?.price ||
        sims.lastHighlights[`${venue}:${symbol}`]?.price
      );
    }
  });

export const selectHighlightQty = (
  venue: string,
  symbol: string,
  side?: Side
) =>
  createSelector([selectSimsState], (sims): number | undefined => {
    if (side) {
      return sims.lastHighlights[`${venue}:${symbol}:${side}`]?.qty;
    } else {
      return (
        sims.lastHighlights[`${venue}:${symbol}:buy`]?.qty ||
        sims.lastHighlights[`${venue}:${symbol}:sell`]?.qty ||
        sims.lastHighlights[`${venue}:${symbol}`]?.qty
      );
    }
  });

export const selectLatestScenario = createSelector(
  [selectSimsState],
  (sims) => {
    return sims.history.length > 0 ? sims.history[0] : undefined;
  }
);

export const selectActiveVenue = createSelector(
  [selectUiState],
  (ui) => ui.activeVenue
);
export const selectActiveSymbol = createSelector(
  [selectUiState],
  (ui) => ui.activeSymbol
);
export const selectWarningThresholds = createSelector(
  [selectUiState],
  (ui) => ui.warningThresholds
);
export const selectBanners = createSelector(
  [selectUiState],
  (ui) => ui.banners
);

export const selectSimHistory = createSelector(
  [selectSimsState],
  (sims) => sims.history
);
export const selectPendingSims = createSelector(
  [selectSimsState],
  (sims) => sims.pending
);

export const selectMarketStats = (venue: string, symbol: string) =>
  createSelector([selectBook(venue, symbol)], (book) => {
    if (!book || !book.bids.length || !book.asks.length) {
      return {
        bestBid: null,
        bestAsk: null,
        midPrice: null,
        spread: null,
        spreadPercent: null,
        bidVolume: null,
        askVolume: null,
      };
    }

    const bestBid = book.bids[0]?.[0] || null;
    const bestAsk = book.asks[0]?.[0] || null;

    if (!bestBid || !bestAsk) {
      return {
        bestBid,
        bestAsk,
        midPrice: null,
        spread: null,
        spreadPercent: null,
        bidVolume: null,
        askVolume: null,
      };
    }

    const spread = bestAsk - bestBid;
    const midPrice = (bestBid + bestAsk) / 2;
    const spreadPercent = (spread / midPrice) * 100;

    const bidVolume = book.bids
      .slice(0, 10)
      .reduce((sum, [, size]) => sum + size, 0);

    const askVolume = book.asks
      .slice(0, 10)
      .reduce((sum, [, size]) => sum + size, 0);

    return {
      bestBid,
      bestAsk,
      midPrice,
      spread,
      spreadPercent,
      bidVolume,
      askVolume,
    };
  });
