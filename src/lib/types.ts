export type VenueKey = "OKX" | "Bybit" | "Deribit";
export type Venue = "OKX" | "Bybit" | "Deribit";
export type Symbol = string;
export type Side = "buy" | "sell";
export type L2 = [price: number, size: number];
export type OB = { bids: L2[]; asks: L2[]; ts: number };

export interface VenueSymbolProps {
  venue: Venue;
  symbol: Symbol;
}

export interface OrderBookEntry {
  price: number;
  size: number;
}

export interface CumulativeEntry {
  price: number;
  cum: number;
}
