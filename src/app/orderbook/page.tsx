"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectBookStatus } from "@/store/selectors";
import OrderBookTable from "@/components/OrderBookTable";
import OrderFormSingle from "@/components/OrderFormSingle";
import DepthChart from "@/components/DepthChart";
import ScenarioTable from "@/components/ScenarioTable";
import BannerDisplay from "@/components/BannerDisplay";
import SearchableDropdown from "@/components/SearchableDropdown";
import MarketStats from "@/components/MarketStats";
import { connectBook, disconnectBook } from "@/store/wsMiddleware";

const VENUE_SYMBOL_PLACEHOLDERS = {
  OKX: "BTC-USDT",
  Bybit: "BTCUSDT",
  Deribit: "BTC-PERPETUAL",
} as const;

const VENUE_SYMBOLS = {
  OKX: ["BTC-USDT-SWAP", "ETH-USDT-SWAP", "SOL-USDT-SWAP"],
  Bybit: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
  Deribit: ["BTC-PERPETUAL", "ETH-PERPETUAL", "SOL_USDC-PERPETUAL"],
} as const;

export default function Page() {
  const dispatch = useAppDispatch();

  const [venue, setVenue] = useState<"OKX" | "Bybit" | "Deribit">("OKX");
  const [symbol, setSymbol] = useState<string>(VENUE_SYMBOLS.OKX[0]);

  const connectionStatus = useAppSelector(selectBookStatus(venue, symbol));

  const handleVenueChange = (newVenue: "OKX" | "Bybit" | "Deribit") => {
    setVenue(newVenue);
    setSymbol(VENUE_SYMBOLS[newVenue][0]);
  };

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
  };

  useEffect(() => {
    const key = `${venue}:${symbol}`;
    dispatch(connectBook({ venue, symbol }));
    return () => {
      dispatch(disconnectBook({ venue, symbol }));
    };
  }, [dispatch, venue, symbol]);

  useEffect(() => {
    return () => {
      dispatch(disconnectBook({ venue, symbol }));
    };
  }, []);

  return (
    <div className="min-h-screen p-4 lg:p-6 space-y-4 lg:space-y-6">
      <div className="text-center">
        <h1 className="text-2xl lg:text-3xl font-bold">
          Live Orderbook Trading
        </h1>
      </div>

      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="flex flex-col gap-1 min-w-0">
              <label className="text-xs muted font-medium">Venue</label>
              <select
                value={venue}
                onChange={(e) => handleVenueChange(e.target.value as any)}
                className="min-w-[120px] max-w-full"
              >
                <option value="OKX"> OKX</option>
                <option value="Bybit"> Bybit</option>
                <option value="Deribit"> Deribit</option>
              </select>
            </div>

            <SearchableDropdown
              value={symbol}
              options={VENUE_SYMBOLS[venue]}
              onChange={handleSymbolChange}
              label="Symbol"
              placeholder="Select trading pair..."
              className="min-w-[140px] flex-1"
            />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus === "open"
                  ? "bg-green-500"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500 animate-pulse"
                  : connectionStatus === "error"
                  ? "bg-red-500"
                  : "bg-gray-500"
              }`}
            />
            <span className="text-xs muted capitalize font-medium">
              {connectionStatus}
            </span>
          </div>
        </div>
      </div>

      <OrderFormSingle venue={venue} symbol={symbol} />

      <BannerDisplay />

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-3">
        {/* Left: Order Book and Simulation History */}
        <div className="xl:col-span-2">
          <OrderBookTable venue={venue} symbol={symbol} levels={50} />
        </div>

        {/* Right: Charts and Metrics */}
        <div className="flex flex-col gap-4" style={{ height: "372px" }}>
          <div className="h-60">
            <DepthChart venue={venue} symbol={symbol} />
          </div>
          <div className="h-24 mt-12">
            <MarketStats venue={venue} symbol={symbol} />
          </div>
        </div>
      </div>

      {/* Bottom: Simulation History */}
      <ScenarioTable />
    </div>
  );
}
