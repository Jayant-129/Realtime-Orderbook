import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Banner = {
  id: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  timestamp?: number;
};

type State = {
  activeVenue: "OKX" | "Bybit" | "Deribit";
  activeSymbol: string;
  warningThresholds: { slippageBps: number; impactLevels: number };
  banners: Banner[];
};

const initial: State = {
  activeVenue: "OKX",
  activeSymbol: "BTC-USDT",
  warningThresholds: { slippageBps: 12, impactLevels: 10 },
  banners: [],
};

const slice = createSlice({
  name: "ui",
  initialState: initial,
  reducers: {
    setActiveVenue: (s, a: PayloadAction<State["activeVenue"]>) => {
      s.activeVenue = a.payload;
    },
    setActiveSymbol: (s, a: PayloadAction<string>) => {
      s.activeSymbol = a.payload;
    },
    pushBanner: (s, a: PayloadAction<Banner>) => {
      const existingIndex = s.banners.findIndex((b) => b.id === a.payload.id);
      if (existingIndex >= 0) {
        s.banners[existingIndex] = { ...a.payload, timestamp: Date.now() };
      } else {
        s.banners.push({ ...a.payload, timestamp: Date.now() });
      }
    },
    clearBanner: (s, a: PayloadAction<string>) => {
      s.banners = s.banners.filter((banner) => banner.id !== a.payload);
    },
    clearAllBanners: (s) => {
      s.banners = [];
    },
  },
});

export const {
  setActiveVenue,
  setActiveSymbol,
  pushBanner,
  clearBanner,
  clearAllBanners,
} = slice.actions;
export default slice.reducer;
export type { Banner };
