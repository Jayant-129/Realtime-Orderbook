// Quick test to verify our pure functions work correctly
import { nextDelay } from "./backoff.js";
import { mid, cumulative, imbalance } from "./normalize.js";
import { OB } from "./types.js";

// Test backoff
console.log("Backoff tests:");
for (let i = 0; i < 5; i++) {
  console.log(`Attempt ${i}:`, nextDelay(i));
}

// Test normalize functions
const testOB: OB = {
  bids: [
    [50000, 1.5],
    [49990, 2.0],
    [49980, 0.5],
  ], // Descending prices
  asks: [
    [50010, 1.0],
    [50020, 1.5],
    [50030, 2.0],
  ], // Ascending prices
  ts: Date.now(),
};

console.log("\nNormalize tests:");
console.log("Mid price:", mid(testOB)); // Should be (50000 + 50010) / 2 = 50005
console.log("Mid with undefined:", mid(undefined)); // Should be NaN

console.log(
  "Bid cumulative:",
  JSON.stringify(cumulative(testOB, "bid"), null, 2)
);
console.log(
  "Ask cumulative:",
  JSON.stringify(cumulative(testOB, "ask"), null, 2)
);

console.log("Imbalance (15 levels):", imbalance(testOB, 15));
console.log("Imbalance (2 levels):", imbalance(testOB, 2));
console.log("Imbalance with undefined:", imbalance(undefined)); // Should be 0
