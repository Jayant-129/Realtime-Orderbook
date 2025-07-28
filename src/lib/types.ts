/**
 * TODO:
 * - Define core domain types (SOLID: Stable abstractions).
 * - Keep this file pure; no imports from app layers.
 */

export type VenueKey = "OKX" | "Bybit" | "Deribit";
export type Side = "buy" | "sell";
export type L2 = [price: number, size: number];
export type OB = { bids: L2[]; asks: L2[]; ts: number };
