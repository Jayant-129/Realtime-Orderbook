export const calculateChartData = (
  bidCum: Array<{ price: number; cum: number }>,
  askCum: Array<{ price: number; cum: number }>,
  midPrice: number | null
) => {
  if ((!bidCum.length && !askCum.length) || !midPrice) return [];

  const allPoints = new Map<
    number,
    { price: number; bidCum?: number; askCum?: number }
  >();

  bidCum.forEach(({ price, cum }) => {
    if (price <= midPrice) {
      allPoints.set(price, { price, bidCum: cum });
    }
  });

  askCum.forEach(({ price, cum }) => {
    if (price >= midPrice) {
      const existing = allPoints.get(price);
      if (existing) {
        existing.askCum = cum;
      } else {
        allPoints.set(price, { price, askCum: cum });
      }
    }
  });

  if (!allPoints.has(midPrice)) {
    allPoints.set(midPrice, { price: midPrice });
  }

  return Array.from(allPoints.values()).sort((a, b) => a.price - b.price);
};

export const calculateChartDomains = (
  chartData: Array<{ price: number; bidCum?: number; askCum?: number }>,
  midPrice: number | null,
  bidCum: Array<{ cum: number }>,
  askCum: Array<{ cum: number }>
): { xDomain: [number, number]; yDomain: [number, number] } => {
  if (!chartData.length || !midPrice) {
    return { xDomain: [0, 100], yDomain: [0, 100] };
  }

  const maxBidCum =
    bidCum.length > 0 ? Math.max(...bidCum.map((d) => d.cum)) : 0;
  const maxAskCum =
    askCum.length > 0 ? Math.max(...askCum.map((d) => d.cum)) : 0;
  const maxCum = Math.max(maxBidCum, maxAskCum);

  const dataSpread =
    chartData.length > 0
      ? Math.max(...chartData.map((d) => d.price)) -
        Math.min(...chartData.map((d) => d.price))
      : midPrice * 0.02;
  const midSpread = Math.max(midPrice * 0.01, dataSpread / 4);

  const minPrice = Math.min(...chartData.map((d) => d.price));
  const maxPrice = Math.max(...chartData.map((d) => d.price));

  const xMin = Math.min(midPrice - midSpread, minPrice);
  const xMax = Math.max(midPrice + midSpread, maxPrice);

  return {
    xDomain: [xMin, xMax],
    yDomain: [0, maxCum * 1.1],
  };
};
