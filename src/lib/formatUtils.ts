export const formatNumber = (num: number | null, decimals = 2): string => {
  if (num === null) return "--";
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toFixed(decimals);
};

export const formatPrice = (price: number | null): string => {
  if (price === null) return "--";
  return price.toFixed(2);
};
