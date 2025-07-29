import { Venue } from "./types";

export const VENUE_CONFIG = {
  OKX: {
    ws: "wss://ws.okx.com:8443/ws/v5/public",
    symbols: ["BTC-USDT-SWAP", "ETH-USDT-SWAP", "SOL-USDT-SWAP"],
    placeholder: "BTC-USDT",
  },
  Bybit: {
    ws: "wss://stream.bybit.com/v5/public/spot",
    symbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
    placeholder: "BTCUSDT",
  },
  Deribit: {
    ws: "wss://www.deribit.com/ws/api/v2",
    symbols: ["BTC-PERPETUAL", "ETH-PERPETUAL", "SOL_USDC-PERPETUAL"],
    placeholder: "BTC-PERPETUAL",
  },
} as const;

export const getWSEndpoint = (venue: Venue): string => VENUE_CONFIG[venue].ws;
