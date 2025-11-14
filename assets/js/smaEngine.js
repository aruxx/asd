export const sortByTimestamp = (candles) => {
  return [...candles].sort((a, b) => a.timestamp - b.timestamp);
};

export const resampleSeries = (candles, targetFactor) => {
  if (targetFactor <= 1) return sortByTimestamp(candles);
  const sorted = sortByTimestamp(candles);
  const buckets = [];
  for (let i = 0; i < sorted.length; i += targetFactor) {
    const slice = sorted.slice(i, i + targetFactor);
    if (!slice.length) continue;
    const bucket = slice.reduce(
      (acc, candle) => ({
        open: acc.open ?? candle.open,
        high: Math.max(acc.high ?? -Infinity, candle.high),
        low: Math.min(acc.low ?? Infinity, candle.low),
        close: candle.close,
        volume: (acc.volume || 0) + (candle.volume || 0),
        timestamp: slice[slice.length - 1].timestamp
      }),
      {}
    );
    buckets.push(bucket);
  }
  return buckets;
};

const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

const computeSMA = (closes, period) => {
  if (closes.length < period) return null;
  const window = closes.slice(-period);
  return average(window);
};

export const calculateOutfitSnapshot = (candles, outfit) => {
  const sorted = sortByTimestamp(candles);
  const closes = sorted.map((candle) => candle.close);
  const latest = sorted.at(-1);
  const smaMap = outfit.periods.reduce((acc, period) => {
    acc[period] = computeSMA(closes, period);
    return acc;
  }, {});
  const definedValues = outfit.periods.filter((period) => typeof smaMap[period] === 'number');
  const alignmentChecks = definedValues.slice(0, -1).map((period, index) => {
    const current = smaMap[definedValues[index]];
    const next = smaMap[definedValues[index + 1]];
    return current !== null && next !== null && current >= next ? 1 : 0;
  });
  const alignmentScore = alignmentChecks.length
    ? alignmentChecks.reduce((sum, val) => sum + val, 0) / alignmentChecks.length
    : 0;
  let signal = 'neutral';
  const shortest = smaMap[definedValues[0]];
  const longest = smaMap[definedValues.at(-1)];
  if (typeof shortest === 'number' && typeof longest === 'number') {
    if (shortest > longest * 1.002) signal = 'bullish';
    else if (shortest < longest * 0.998) signal = 'bearish';
  }
  return {
    outfitId: outfit.id,
    label: outfit.label,
    smaValues: outfit.periods.map((period) => ({ period, value: smaMap[period] })),
    latestClose: latest?.close ?? null,
    latestTimestamp: latest?.timestamp ?? null,
    signal,
    alignmentScore,
    sampleSize: closes.length
  };
};

export const evaluateOutfits = (candles, outfits) => {
  return outfits.map((outfit) => calculateOutfitSnapshot(candles, outfit));
};
