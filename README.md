# Real-Time Orderbook Viewer with Order Simulation

**Author:** Jayant Agrawal  
**Assignment:** GoQuant Technical Assessment

## Overview

A Next.js application that displays real-time orderbook data from multiple cryptocurrency exchanges (OKX, Bybit, and Deribit) with order simulation capabilities. Users can simulate order placement across different venues and visualize market impact, helping them understand optimal timing and execution strategies.

## Features

### Core Functionality

- **Multi-Venue Orderbook Display**: Real-time orderbooks from OKX, Bybit, and Deribit
- **Real-Time Updates**: WebSocket connections for live data streaming
- **Order Simulation**: Interactive form to simulate order placement with various parameters
- **Market Impact Visualization**: Shows where orders would sit in the orderbook with impact metrics
- **Responsive Design**: Optimized for both desktop and mobile trading scenarios

### Advanced Features

- **Market Depth Visualization**: Interactive depth charts alongside orderbook tables
- **Order Impact Metrics**:
  - Estimated fill percentage
  - Market impact calculation
  - Slippage estimation
  - Time to fill analysis
- **Timing Simulation**: Test different execution timings (immediate, 5s, 10s, 30s delays)
- **Multi-Exchange Comparison**: Side-by-side venue analysis

## Technical Stack

- **Framework**: Next.js 14 with App Router
- **State Management**: Redux Toolkit with RTK Query
- **Real-Time Data**: WebSocket connections with automatic reconnection
- **Charts**: Recharts for market depth visualization
- **Styling**: Tailwind CSS for responsive design
- **TypeScript**: Full type safety throughout the application

## Getting Started

### Prerequisites

```bash
Node.js 18+
npm, yarn, pnpm, or bun
```

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Realtime-Orderbook-main
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## API Integration

### Supported Exchanges

- **OKX**: WebSocket and REST API integration
- **Bybit**: Real-time orderbook data via WebSocket
- **Deribit**: Options and futures orderbook data

### Rate Limiting & Error Handling

- Implements exponential backoff for API failures
- Graceful degradation when WebSocket connections fail
- Automatic reconnection with configurable retry logic
- Fallback to polling when WebSocket is unavailable

## Usage

### Order Simulation

1. Select a venue (OKX, Bybit, or Deribit)
2. Choose a trading symbol (e.g., BTC-USD, ETH-USD)
3. Configure order parameters:
   - Order type (Market/Limit)
   - Side (Buy/Sell)
   - Price (for limit orders)
   - Quantity
   - Timing delay
4. View the simulated order position and impact metrics

### Market Analysis

- Switch between different venues to compare liquidity
- Analyze market depth through interactive charts
- Monitor real-time orderbook changes
- Assess market impact before order execution

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/             # React components
│   ├── OrderBookTable.tsx  # Orderbook display component
│   ├── DepthChart.tsx      # Market depth visualization
│   ├── OrderFormSingle.tsx # Order simulation form
│   └── MarketStats.tsx     # Market statistics display
├── lib/                    # Utility functions and configurations
│   ├── exchanges/          # Exchange-specific API integrations
│   ├── simulator.ts        # Order simulation logic
│   └── types.ts           # TypeScript type definitions
└── store/                  # Redux store and slices
    ├── orderbooksSlice.ts  # Orderbook state management
    └── wsMiddleware.ts     # WebSocket middleware
```

## Libraries Used

- **@reduxjs/toolkit**: State management and data fetching
- **recharts**: Chart visualizations for market depth
- **tailwindcss**: Utility-first CSS framework
- **ws**: WebSocket client implementation
- **zod**: Runtime type validation for API responses

## API Documentation References

- [OKX API Documentation](https://www.okx.com/docs-v5/)
- [Bybit API Documentation](https://bybit-exchange.github.io/docs/v5/intro)
- [Deribit API Documentation](https://docs.deribit.com/)

## Assumptions Made

1. **Demo Environment**: All API integrations use free/public endpoints suitable for demonstration
2. **Symbol Standardization**: Unified symbol format across different exchanges for comparison
3. **Simulation Accuracy**: Order simulations are based on current orderbook state and may not reflect actual execution conditions
4. **Rate Limiting**: Conservative rate limiting to ensure stable operation across all venues

## Performance Considerations

- Efficient WebSocket connection management
- Optimized re-rendering with React.memo and useMemo
- Debounced user inputs to prevent excessive API calls
- Background data cleanup to prevent memory leaks

## Future Enhancements

- [ ] Portfolio simulation across multiple assets
- [ ] Historical data analysis and backtesting
- [ ] Advanced order types (Stop-loss, Take-profit)
- [ ] Real-time P&L tracking for simulated positions
- [ ] Integration with additional exchanges

---

**Note**: This application is developed as part of a technical assessment and is intended for demonstration purposes only. It should not be used for actual trading decisions.
