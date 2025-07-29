# Real-Time Orderbook Viewer with Order Simulation

**Author:** Jayant Agrawal

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

## Technical Stack

- **Framework**: Next.js 14 with App Router
- **State Management**: Redux Toolkit (RTK) with RTK Query
- **Real-Time Data**: WebSocket connections with automatic reconnection
- **Charts**: Recharts for market depth visualization and orderbook charts
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

### Build for Production

To create a production build:

```bash
npm run build
# or
yarn build
# or
pnpm build
# or
bun run build
```

To start the production server:

```bash
npm start
# or
yarn start
# or
pnpm start
# or
bun start
```

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
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout

## Production Optimizations

This application has been optimized for production deployment with the following enhancements:

- **Production-Safe Logging**: All console statements replaced with environment-aware structured logging
- **Performance Optimizations**: React components optimized with `React.memo` and efficient re-rendering
- **Error Handling**: Comprehensive error handling with context for monitoring
- **Memory Management**: Efficient WebSocket connection management and cleanup
- **Security**: Production-ready configuration with environment separation

See [PRODUCTION_OPTIMIZATION.md](./PRODUCTION_OPTIMIZATION.md) for detailed information. component
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   └── orderbook/           # Orderbook-specific pages
│       └── page.tsx         # Main orderbook interface
├── components/               # Reusable React components
│   ├── BannerDisplay.tsx    # Banner/notification component
│   ├── DepthChart.tsx       # Market depth visualization charts
│   ├── LoadingState.tsx     # Loading indicators and states
│   ├── MarketStats.tsx      # Market statistics display
│   ├── OrderBookTable.tsx   # Real-time orderbook table
│   ├── OrderFormSingle.tsx  # Order simulation form
│   ├── RechartsChart.tsx    # Chart components using Recharts
│   ├── ScenarioTable.tsx    # Scenario comparison table
│   └── SearchableDropdown.tsx # Dropdown with search functionality
├── lib/                      # Utility functions and configurations
│   ├── backoff.ts           # Exponential backoff implementation
│   ├── chartUtils.ts        # Chart utility functions
│   ├── formatUtils.ts       # Data formatting utilities
│   ├── normalize.ts         # Data normalization functions
│   ├── schemas.ts           # Zod validation schemas
│   ├── simulator.ts         # Order simulation logic
│   ├── types.ts             # TypeScript type definitions
│   ├── venueConfig.ts       # Exchange configuration
│   └── exchanges/           # Exchange-specific integrations
│       ├── bybit.ts         # Bybit API integration
│       ├── deribit.ts       # Deribit API integration
│       └── okx.ts           # OKX API integration
└── store/                    # Redux Toolkit store management
    ├── index.ts             # Store configuration
    ├── orderbooksSlice.ts   # Orderbook state management
    ├── selectors.ts         # Redux selectors
    ├── simulationsSlice.ts  # Simulation state management
    ├── uiSlice.ts           # UI state management
    └── wsMiddleware.ts      # WebSocket middleware
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
