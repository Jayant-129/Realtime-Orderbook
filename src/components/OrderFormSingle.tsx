"use client";

import React, { useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { selectBook, selectWarningThresholds } from "@/store/selectors";
import {
  scheduleSim,
  setHighlight,
  simCompleted,
} from "@/store/simulationsSlice";
import { simulate } from "@/lib/simulator";
import { VenueSymbolProps } from "@/lib/types";
import { OrderFormSchema, OrderFormType } from "@/lib/schemas";
import { ZodError } from "zod";

interface SimulationResult {
  estFillPct: number;
  estAvgPx: number;
  estSlippageBps: number;
  impactQtyLevels: number;
}

type FormType = "market" | "limit";
type FormSide = "buy" | "sell";

export default function OrderFormSingle({ venue, symbol }: VenueSymbolProps) {
  const dispatch = useAppDispatch();
  const orderbook = useAppSelector(selectBook(venue, symbol));
  const thresholds = useAppSelector(selectWarningThresholds);

  const [form, setForm] = useState({
    type: "limit" as FormType,
    side: "buy" as FormSide,
    price: orderbook?.asks[0]?.[0] || 0,
    qty: 0.01,
    delayMs: 0,
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const hasLiveData =
    !!orderbook && (orderbook.bids.length > 0 || orderbook.asks.length > 0);

  const runSimulation = (validated: OrderFormType) => {
    if (!orderbook) {
      setErrors(["No live orderbook data available"]);
      return;
    }

    try {
      const result = simulate(orderbook, venue, validated);
      setLastResult(result);

      dispatch(
        simCompleted({
          id: `${Date.now()}`,
          input: validated,
          results: [result],
        })
      );
    } catch {
      setErrors(["Simulation failed"]);
    }
  };

  const handleSubmit = () => {
    setErrors([]);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    try {
      const validated = OrderFormSchema.parse({
        ...form,
        price: form.type === "limit" ? form.price : undefined,
      });

      if (validated.delayMs === 0) {
        if (!hasLiveData) {
          setErrors([
            "Waiting for live data - cannot simulate without orderbook",
          ]);
          return;
        }
        runSimulation(validated);

        if (validated.type === "limit" && validated.price) {
          dispatch(
            setHighlight({
              key: `${venue}:${symbol}:${validated.side}`,
              price: validated.price,
              qty: validated.qty,
            })
          );
        }
      } else {
        const dueTs = Date.now() + validated.delayMs;

        dispatch(
          scheduleSim({
            id: `${Date.now()}`,
            input: validated,
            dueTs,
          })
        );

        timerRef.current = setTimeout(() => {
          const currentOrderbook = orderbook;
          if (
            currentOrderbook &&
            (currentOrderbook.bids.length > 0 ||
              currentOrderbook.asks.length > 0)
          ) {
            runSimulation(validated);

            if (validated.type === "limit" && validated.price) {
              dispatch(
                setHighlight({
                  key: `${venue}:${symbol}:${validated.side}`,
                  price: validated.price,
                  qty: validated.qty,
                })
              );
            }
          } else {
            setErrors([
              "Delayed simulation failed - no live data at execution time",
            ]);
          }
        }, validated.delayMs);

        setLastResult(null);
      }
    } catch (error) {
      if (error instanceof ZodError) {
        setErrors(error.issues.map((e) => `${e.path.join(".")}: ${e.message}`));
      } else {
        setErrors(["Validation failed"]);
      }
    }
  };

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Order Simulation</h2>
        <div className="text-xs muted">
          {venue} • {symbol}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs muted font-medium">Type</label>
          <select
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.target.value as FormType }))
            }
            className="text-sm"
          >
            <option value="limit">Limit</option>
            <option value="market">Market</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs muted font-medium">Side</label>
          <div className="flex rounded-lg border border-gray-600 overflow-hidden">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, side: "buy" }))}
              className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                form.side === "buy"
                  ? "bg-green-600/20 text-green-400 border-green-600"
                  : "bg-black text-gray-400 hover:bg-gray-900"
              }`}
              style={form.side === "buy" ? { borderColor: "var(--bid)" } : {}}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, side: "sell" }))}
              className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                form.side === "sell"
                  ? "bg-red-600/20 text-red-400 border-red-600"
                  : "bg-black text-gray-400 hover:bg-gray-900"
              }`}
              style={form.side === "sell" ? { borderColor: "var(--ask)" } : {}}
            >
              Sell
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs muted font-medium">Price</label>
          <input
            type="number"
            disabled={form.type === "market"}
            value={form.price || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))
            }
            placeholder={form.type === "market" ? "Market" : "Limit price"}
            step="0.01"
            className="text-sm font-mono disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs muted font-medium">Quantity</label>
          <input
            type="number"
            step="0.0001"
            value={form.qty || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, qty: Number(e.target.value) || 0 }))
            }
            placeholder="Qty"
            className="text-sm font-mono"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs muted font-medium">Delay</label>
          <select
            value={form.delayMs}
            onChange={(e) =>
              setForm((f) => ({ ...f, delayMs: Number(e.target.value) }))
            }
            className="text-sm"
          >
            <option value={0}>Now</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs muted font-medium">&nbsp;</label>
          <button
            onClick={handleSubmit}
            disabled={!hasLiveData && form.delayMs === 0}
            className={`text-sm font-medium transition-colors ${
              !hasLiveData && form.delayMs === 0
                ? "bg-gray-600 cursor-not-allowed opacity-50"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            title={
              !hasLiveData && form.delayMs === 0 ? "Waiting for live data" : ""
            }
          >
            Simulate
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div
          className="text-xs rounded p-3 border"
          style={{
            backgroundColor: "var(--warning)/10",
            color: "var(--warning)",
            borderColor: "var(--warning)/20",
          }}
        >
          {errors.map((error, i) => (
            <div key={i}>⚠️ {error}</div>
          ))}
        </div>
      )}

      {lastResult && (
        <div className="border-t border-gray-700 pt-4">
          <div className="text-sm font-medium mb-3 text-gray-300">
            Simulation Results
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
            <div className="flex flex-col bg-black rounded p-3">
              <span className="muted font-medium">Fill %</span>
              <span
                className={`text-lg font-mono ${
                  lastResult.estFillPct < 100
                    ? "text-yellow-400"
                    : "text-green-400"
                }`}
              >
                {lastResult.estFillPct.toFixed(1)}%
              </span>
            </div>
            <div className="flex flex-col bg-black rounded p-3">
              <span className="muted font-medium">Avg Price</span>
              <span className="text-lg font-mono text-gray-200">
                {lastResult.estAvgPx.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col bg-black rounded p-3">
              <span className="muted font-medium">Slippage</span>
              <span
                className={`text-lg font-mono ${
                  Math.abs(lastResult.estSlippageBps) > thresholds.slippageBps
                    ? "text-yellow-400"
                    : "text-gray-200"
                }`}
              >
                {lastResult.estSlippageBps.toFixed(1)} bps
              </span>
            </div>
            <div className="flex flex-col bg-black rounded p-3">
              <span className="muted font-medium">Impact</span>
              <span
                className={`text-lg font-mono ${
                  lastResult.impactQtyLevels > thresholds.impactLevels
                    ? "text-yellow-400"
                    : "text-gray-200"
                }`}
              >
                {lastResult.impactQtyLevels} levels
              </span>
            </div>
            <div className="flex flex-col bg-black rounded p-3">
              <span className="muted font-medium">Time to Fill</span>
              <span className="text-lg font-mono text-gray-200">
                {form.delayMs > 0 ? `${form.delayMs}ms` : "Instant"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
