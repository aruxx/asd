import { formatNumber } from './utils.js';

function rollingSMA(values, period) {
  if (!Array.isArray(values) || values.length < period) {
    return { latest: null, previous: null, series: [] };
  }
  const series = [];
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i >= period - 1) {
      series.push({ index: i, value: sum / period });
    }
  }
  const latest = series[series.length - 1] ?? null;
  const previous = series[series.length - 2] ?? null;
  return { latest, previous, series };
}

function detectCrossover(shortSMA, longSMA) {
  if (!shortSMA.latest || !longSMA.latest || !shortSMA.previous || !longSMA.previous) {
    return { type: 'insufficient', detail: 'Need more data to confirm crossover.' };
  }
  const prevDiff = shortSMA.previous.value - longSMA.previous.value;
  const currDiff = shortSMA.latest.value - longSMA.latest.value;
  if (prevDiff <= 0 && currDiff > 0) {
    return { type: 'bullish', detail: 'Short SMA crossed above long SMA.' };
  }
  if (prevDiff >= 0 && currDiff < 0) {
    return { type: 'bearish', detail: 'Short SMA crossed below long SMA.' };
  }
  return { type: 'neutral', detail: 'No crossover detected.' };
}

function describeStack(snapshots) {
  const ordered = [...snapshots].sort((a, b) => a.period - b.period);
  const aligned = ordered.every((entry, idx, arr) => {
    if (idx === 0 || !entry.snapshot.latest || !arr[idx - 1].snapshot.latest) return true;
    return entry.snapshot.latest.value >= arr[idx - 1].snapshot.latest.value;
  });
  return aligned ? 'Stacked (ascending)' : 'Compression / overlap detected';
}

export function analyzeOutfit({ ticker, timeframe, outfitName, outfitPeriods, candles }) {
  const orderedCandles = [...candles].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const closes = orderedCandles.map((candle) => Number(candle.close));
  const timestamps = orderedCandles.map((candle) => candle.timestamp);
  const snapshots = outfitPeriods.map((period) => ({
    period,
    snapshot: rollingSMA(closes, period)
  }));
  const latestPrice = closes[closes.length - 1] ?? null;
  const latestTime = timestamps[timestamps.length - 1] ?? null;
  const short = snapshots[0]?.snapshot;
  const long = snapshots[snapshots.length - 1]?.snapshot;
  const crossover = short && long ? detectCrossover(short, long) : { type: 'insufficient', detail: 'Missing SMA data.' };
  const stackDescription = describeStack(snapshots);

  return {
    ticker,
    timeframe,
    outfitName,
    latestPrice,
    latestTime,
    stacks: snapshots.map(({ period, snapshot }) => ({
      period,
      latest: snapshot.latest?.value ?? null,
      previous: snapshot.previous?.value ?? null
    })),
    signal: crossover,
    alignment: stackDescription,
    diagnostics: buildDiagnostics(closes, snapshots)
  };
}

function buildDiagnostics(closes, snapshots) {
  const volatility = calcVolatility(closes);
  const density = snapshots.reduce((acc, entry) => {
    if (entry.snapshot.series.length) {
      acc.push(`${entry.period}: ${formatNumber(entry.snapshot.latest?.value)}`);
    }
    return acc;
  }, []);
  return {
    volatility,
    density
  };
}

function calcVolatility(closes) {
  if (!closes.length) return { stdev: null };
  const mean = closes.reduce((sum, value) => sum + value, 0) / closes.length;
  const variance = closes.reduce((sum, value) => sum + (value - mean) ** 2, 0) / closes.length;
  const stdev = Math.sqrt(variance);
  return { stdev };
}
