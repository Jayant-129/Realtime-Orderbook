import { createSelector } from "@reduxjs/toolkit";
import { RootState } from ".";
import { L2, OB, Side } from "@/lib/types";
import { cumulative } from "@/lib/normalize";

/**
 * TODO:
 * - Memoized selectors: selectBook, selectTopN, selectHighlight, selectCumulative, selectImbalance, selectLatestScenario.
 * - Keep derived computations here (Application), not in components.
 */

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
    [selectBook(venue, symbol)],
    (book): { bids: L2[]; asks: L2[] } => {
      if (!book) {
        return { bids: [], asks: [] };
      }
      return {
        bids: book.bids.slice(0, n),
        asks: book.asks.slice(0, n),
      };
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

// Highlight price for limit orders
export const selectHighlight = (venue: string, symbol: string, side?: Side) =>
  createSelector([selectSimsState], (sims): number | undefined => {
    if (side) {
      // If side is specified, look for side-specific highlight
      return sims.lastHighlights[`${venue}:${symbol}:${side}`];
    } else {
      // For backward compatibility, check both sides
      return (
        sims.lastHighlights[`${venue}:${symbol}:buy`] ||
        sims.lastHighlights[`${venue}:${symbol}:sell`] ||
        sims.lastHighlights[`${venue}:${symbol}`]
      ); // Legacy format
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
