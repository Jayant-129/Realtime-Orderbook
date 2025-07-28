// Quick test to debug Bybit WebSocket connection
const WebSocket = require("ws");

console.log("Testing Bybit WebSocket connection...");

// Test 1: Linear endpoint
const wsLinear = new WebSocket("wss://stream.bybit.com/v5/public/linear");

wsLinear.on("open", () => {
  console.log("✅ Linear WebSocket connected");

  // Subscribe to BTCUSDT orderbook
  const subscribeMsg = {
    op: "subscribe",
    args: ["orderbook.50.BTCUSDT"],
  };

  console.log("📤 Sending subscription:", JSON.stringify(subscribeMsg));
  wsLinear.send(JSON.stringify(subscribeMsg));
});

wsLinear.on("message", (data) => {
  try {
    const msg = JSON.parse(data.toString());
    console.log("📨 Linear message:", JSON.stringify(msg, null, 2));
  } catch (e) {
    console.log("📨 Linear raw:", data.toString());
  }
});

wsLinear.on("error", (error) => {
  console.error("❌ Linear WebSocket error:", error);
});

wsLinear.on("close", (code, reason) => {
  console.log(`🔴 Linear WebSocket closed: ${code} ${reason}`);
});

// Test 2: Spot endpoint
setTimeout(() => {
  console.log("\n--- Testing Spot endpoint ---");

  const wsSpot = new WebSocket("wss://stream.bybit.com/v5/public/spot");

  wsSpot.on("open", () => {
    console.log("✅ Spot WebSocket connected");

    const subscribeMsg = {
      op: "subscribe",
      args: ["orderbook.50.BTCUSDT"],
    };

    console.log("📤 Sending subscription:", JSON.stringify(subscribeMsg));
    wsSpot.send(JSON.stringify(subscribeMsg));
  });

  wsSpot.on("message", (data) => {
    try {
      const msg = JSON.parse(data.toString());
      console.log("📨 Spot message:", JSON.stringify(msg, null, 2));
    } catch (e) {
      console.log("📨 Spot raw:", data.toString());
    }
  });

  wsSpot.on("error", (error) => {
    console.error("❌ Spot WebSocket error:", error);
  });

  wsSpot.on("close", (code, reason) => {
    console.log(`🔴 Spot WebSocket closed: ${code} ${reason}`);
  });
}, 2000);

// Test 3: REST API
setTimeout(async () => {
  console.log("\n--- Testing REST API ---");

  try {
    const response = await fetch(
      "https://api.bybit.com/v5/market/orderbook?category=linear&symbol=BTCUSDT&limit=50"
    );
    const data = await response.json();
    console.log("✅ REST API response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ REST API error:", error);
  }
}, 4000);

// Keep script running for a bit
setTimeout(() => {
  console.log("🏁 Test complete");
  process.exit(0);
}, 10000);
