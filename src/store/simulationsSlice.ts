import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SimInput, SimResult } from "@/lib/simulator";

type State = {
  pending: Array<{ id: string; input: SimInput; dueTs: number }>;
  history: Array<{ id: string; input: SimInput; results: SimResult[] }>;
  lastHighlights: Record<string, { price: number; qty: number } | undefined>;
};

const initial: State = { pending: [], history: [], lastHighlights: {} };

const slice = createSlice({
  name: "sims",
  initialState: initial,
  reducers: {
    scheduleSim: (
      s,
      a: PayloadAction<{ id: string; input: SimInput; dueTs: number }>
    ) => {
      s.pending.push(a.payload);
    },
    simCompleted: (
      s,
      a: PayloadAction<{ id: string; input: SimInput; results: SimResult[] }>
    ) => {
      s.pending = s.pending.filter((p) => p.id !== a.payload.id);
      s.history.unshift(a.payload);
      if (s.history.length > 50) {
        s.history = s.history.slice(0, 50);
      }
    },
    setHighlight: (
      s,
      a: PayloadAction<{ key: string; price?: number; qty?: number }>
    ) => {
      if (a.payload.price !== undefined && a.payload.qty !== undefined) {
        s.lastHighlights[a.payload.key] = {
          price: a.payload.price,
          qty: a.payload.qty,
        };
      } else {
        delete s.lastHighlights[a.payload.key];
      }
    },
    clearPending: (s, a: PayloadAction<{ id: string }>) => {
      s.pending = s.pending.filter((p) => p.id !== a.payload.id);
    },
  },
});

export const { scheduleSim, simCompleted, setHighlight, clearPending } =
  slice.actions;
export default slice.reducer;
