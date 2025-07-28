import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { OB } from "@/lib/types";

/**
 * TODO:
 * - Hold orderbooks by key `${venue}:${symbol}` with status and lastUpdateTs.
 * - Reducers: bookConnecting, bookOpen, bookUpdate, bookError.
 */

type State = {
  books: Record<string, OB | undefined>;
  status: Record<string, "idle" | "connecting" | "open" | "error">;
  lastUpdateTs: Record<string, number | undefined>;
  defaultDepth: number;
  error?: string;
};

const initial: State = {
  books: {},
  status: {},
  lastUpdateTs: {},
  defaultDepth: 50,
};

const slice = createSlice({
  name: "orderbooks",
  initialState: initial,
  reducers: {
    bookConnecting: (s, a: PayloadAction<{ key: string }>) => {
      s.status[a.payload.key] = "connecting";
      s.error = undefined;
    },
    bookOpen: (s, a: PayloadAction<{ key: string }>) => {
      s.status[a.payload.key] = "open";
      s.error = undefined;
    },
    bookUpdate: (s, a: PayloadAction<{ key: string; ob: OB }>) => {
      s.books[a.payload.key] = a.payload.ob;
      s.status[a.payload.key] = "open";
      s.lastUpdateTs[a.payload.key] = a.payload.ob.ts;
      s.error = undefined;
    },
    bookError: (s, a: PayloadAction<{ key: string; error: string }>) => {
      s.status[a.payload.key] = "error";
      s.error = a.payload.error;
    },
  },
});

export const { bookConnecting, bookOpen, bookUpdate, bookError } =
  slice.actions;
export default slice.reducer;
