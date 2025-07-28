export function nextDelay(attempt: number): number {
  const base = 500;
  const factor = 1.8;
  const cap = 10000;
  const jitterPercent = 0.3;

  const exponentialDelay = base * Math.pow(factor, attempt);
  const cappedDelay = Math.min(exponentialDelay, cap);
  const jitterRange = cappedDelay * jitterPercent;
  const jitter = (Math.random() * 2 - 1) * jitterRange;

  return Math.max(base, Math.round(cappedDelay + jitter));
}
