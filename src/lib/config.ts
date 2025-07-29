export const PRODUCTION_CONFIG = {
  WS_RECONNECT_ATTEMPTS: 5,
  WS_RECONNECT_DELAY_MS: 1000,
  WS_MAX_RECONNECT_DELAY_MS: 30000,
  WS_HEARTBEAT_INTERVAL_MS: 30000,
  MAX_ORDERBOOK_LEVELS: 200,
  CHART_UPDATE_THROTTLE_MS: 100,
  UI_UPDATE_DEBOUNCE_MS: 50,
  STALE_DATA_TIMEOUT_MS: 30000,
  ERROR_RETRY_ATTEMPTS: 3,
  ERROR_BANNER_GRACE_PERIOD_MS: 5000,
  CRITICAL_ERROR_THRESHOLD: 10,
  MAX_CACHED_ORDERBOOKS: 10,
  CLEANUP_INTERVAL_MS: 300000,
  MAX_LOG_ENTRIES: 1000,
  CORS_ENABLED: true,
  CSP_ENABLED: true,
  PERFORMANCE_MONITORING_ENABLED: false,
  ERROR_REPORTING_ENABLED: true,
  ANALYTICS_ENABLED: true,
} as const;

export const DEVELOPMENT_CONFIG = {
  ...PRODUCTION_CONFIG,
  PERFORMANCE_MONITORING_ENABLED: true,
  WS_RECONNECT_DELAY_MS: 500,
  CLEANUP_INTERVAL_MS: 60000,
  CORS_ENABLED: false,
  CSP_ENABLED: false,
} as const;

export const APP_CONFIG =
  process.env.NODE_ENV === "production"
    ? PRODUCTION_CONFIG
    : DEVELOPMENT_CONFIG;

export const isProduction = () => process.env.NODE_ENV === "production";
export const isDevelopment = () => process.env.NODE_ENV === "development";
export const isTest = () => process.env.NODE_ENV === "test";

export const shouldReportError = (error: Error): boolean => {
  if (!isProduction()) return false;
  return (
    error.name === "TypeError" ||
    error.name === "ReferenceError" ||
    error.message.includes("WebSocket") ||
    error.message.includes("network")
  );
};

export const shouldLogPerformance = (): boolean => {
  return APP_CONFIG.PERFORMANCE_MONITORING_ENABLED;
};
