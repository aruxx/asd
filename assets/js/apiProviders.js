import { PROVIDER_METADATA } from './constants.js';
import { resampleSeries, sortByTimestamp } from './smaEngine.js';
import {
  baseIntervalFor,
  computeAggregationFactor,
  getTimeframeConfig,
  timeframeDurationSeconds
} from './timeframeUtils.js';

const fetchJSON = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

const responseCache = new Map();
const makeCacheKey = ({ providerId, symbol, timeframeId, apiKey }) =>
  `${providerId}:${symbol}:${timeframeId}:${apiKey || 'anon'}`;

export const clearProviderCache = () => responseCache.clear();

const alphaDirectConfig = {
  '1m': { functionName: 'TIME_SERIES_INTRADAY', interval: '1min', dataKey: 'Time Series (1min)', durationSeconds: 60 },
  '5m': { functionName: 'TIME_SERIES_INTRADAY', interval: '5min', dataKey: 'Time Series (5min)', durationSeconds: 300 },
  '15m': { functionName: 'TIME_SERIES_INTRADAY', interval: '15min', dataKey: 'Time Series (15min)', durationSeconds: 900 },
  '30m': { functionName: 'TIME_SERIES_INTRADAY', interval: '30min', dataKey: 'Time Series (30min)', durationSeconds: 1800 },
  '1h': { functionName: 'TIME_SERIES_INTRADAY', interval: '60min', dataKey: 'Time Series (60min)', durationSeconds: 3600 },
  '1d': { functionName: 'TIME_SERIES_DAILY_ADJUSTED', dataKey: 'Time Series (Daily)', durationSeconds: 86400 },
  '1w': { functionName: 'TIME_SERIES_WEEKLY_ADJUSTED', dataKey: 'Weekly Adjusted Time Series', durationSeconds: 604800 },
  '1M': { functionName: 'TIME_SERIES_MONTHLY_ADJUSTED', dataKey: 'Monthly Adjusted Time Series', durationSeconds: 2628000 }
};

const mapAlphaCandles = (payload = {}) => {
  return Object.entries(payload).map(([timestamp, values]) => ({
    timestamp: new Date(timestamp).getTime(),
    open: Number(values['1. open']),
    high: Number(values['2. high']),
    low: Number(values['3. low']),
    close: Number(values['4. close']),
    volume: Number(values['5. volume'] ?? 0)
  }));
};

const requestAlphaSeries = async ({ symbol, timeframeId, apiKey, depth = 0 }) => {
  if (depth > 5) throw new Error('Alpha Vantage recursion depth exceeded');
  const apiConfig = alphaDirectConfig[timeframeId];
  const key = apiKey || 'demo';
  if (apiConfig) {
    const params = new URLSearchParams({ function: apiConfig.functionName, symbol, apikey: key, outputsize: 'compact' });
    if (apiConfig.interval) params.set('interval', apiConfig.interval);
    const url = `https://www.alphavantage.co/query?${params.toString()}`;
    const data = await fetchJSON(url);
    if (data['Error Message']) throw new Error(data['Error Message']);
    if (data['Note']) throw new Error(data['Note']);
    const candles = mapAlphaCandles(data[apiConfig.dataKey]);
    if (!candles.length) throw new Error('Alpha Vantage returned no candles');
    return {
      providerId: 'alphaVantage',
      symbol,
      timeframe: timeframeId,
      sourceIntervalSeconds: apiConfig.durationSeconds,
      derivedFrom: timeframeId,
      candles: sortByTimestamp(candles)
    };
  }
  const base = baseIntervalFor(timeframeId) || '1m';
  const baseResponse = await requestAlphaSeries({ symbol, timeframeId: base, apiKey, depth: depth + 1 });
  const factor = computeAggregationFactor(timeframeId, base);
  if (!factor || factor <= 1) {
    return { ...baseResponse, timeframe: timeframeId, derivedFrom: baseResponse.timeframe };
  }
  const candles = resampleSeries(baseResponse.candles, factor);
  return {
    ...baseResponse,
    timeframe: timeframeId,
    derivedFrom: baseResponse.timeframe,
    candles
  };
};

const fmpIntervalMap = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '30m': '30min',
  '1h': '1hour',
  '4h': '4hour'
};

const fetchFromFMP = async ({ symbol, timeframeId, apiKey }) => {
  const key = apiKey || 'demo';
  const interval = fmpIntervalMap[timeframeId];
  if (interval) {
    const url = `https://financialmodelingprep.com/api/v3/historical-chart/${interval}/${symbol}?apikey=${key}`;
    const data = await fetchJSON(url);
    const candles = data.map((row) => ({
      timestamp: new Date(row.date).getTime(),
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume || 0)
    }));
    return {
      providerId: 'financialModelingPrep',
      symbol,
      timeframe: timeframeId,
      derivedFrom: timeframeId,
      sourceIntervalSeconds: timeframeDurationSeconds(timeframeId),
      candles: sortByTimestamp(candles)
    };
  }
  const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?serietype=line&apikey=${key}`;
  const data = await fetchJSON(url);
  const candles = (data.historical || []).map((row) => ({
    timestamp: new Date(row.date).getTime(),
    open: Number(row.open ?? row.close),
    high: Number(row.high ?? row.close),
    low: Number(row.low ?? row.close),
    close: Number(row.close),
    volume: Number(row.volume || 0)
  }));
  return {
    providerId: 'financialModelingPrep',
    symbol,
    timeframe: timeframeId,
    derivedFrom: timeframeId,
    sourceIntervalSeconds: timeframeDurationSeconds(timeframeId) || 86400,
    candles: sortByTimestamp(candles)
  };
};

const yahooMap = {
  '1d': { interval: '1d', range: '1mo' },
  '1w': { interval: '1wk', range: '3mo' },
  '1M': { interval: '1mo', range: '1y' }
};

const fetchFromYahoo = async ({ symbol, timeframeId }) => {
  const mapping = yahooMap[timeframeId] || yahooMap['1d'];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${mapping.interval}&range=${mapping.range}`;
  const data = await fetchJSON(url);
  const result = data.chart?.result?.[0];
  if (!result) throw new Error('Yahoo Finance returned no data');
  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0] || {};
  const candles = timestamps.map((epoch, idx) => ({
    timestamp: epoch * 1000,
    open: Number(quotes.open?.[idx] ?? quotes.close?.[idx]),
    high: Number(quotes.high?.[idx] ?? quotes.close?.[idx]),
    low: Number(quotes.low?.[idx] ?? quotes.close?.[idx]),
    close: Number(quotes.close?.[idx]),
    volume: Number(quotes.volume?.[idx] ?? 0)
  }));
  return {
    providerId: 'yahooFinance',
    symbol,
    timeframe: timeframeId,
    derivedFrom: timeframeId,
    sourceIntervalSeconds: timeframeDurationSeconds(timeframeId) || 86400,
    candles: sortByTimestamp(candles)
  };
};

const polygonSpanMap = {
  '1m': { multiplier: 1, timespan: 'minute' },
  '5m': { multiplier: 5, timespan: 'minute' },
  '15m': { multiplier: 15, timespan: 'minute' },
  '30m': { multiplier: 30, timespan: 'minute' },
  '1h': { multiplier: 1, timespan: 'hour' },
  '1d': { multiplier: 1, timespan: 'day' }
};

const fetchFromPolygon = async ({ symbol, timeframeId, apiKey }) => {
  if (!apiKey) throw new Error('Polygon.io requires an API key');
  const mapping = polygonSpanMap[timeframeId] || polygonSpanMap['1d'];
  const now = new Date();
  const past = new Date(now.getTime() - (timeframeDurationSeconds(timeframeId) || 86400) * 1000 * 250);
  const from = past.toISOString().split('T')[0];
  const to = now.toISOString().split('T')[0];
  const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${mapping.multiplier}/${mapping.timespan}/${from}/${to}?adjusted=true&sort=asc&limit=1200&apiKey=${apiKey}`;
  const data = await fetchJSON(url);
  const candles = (data.results || []).map((row) => ({
    timestamp: row.t,
    open: row.o,
    high: row.h,
    low: row.l,
    close: row.c,
    volume: row.v
  }));
  if (!candles.length) throw new Error('Polygon.io returned no candles');
  return {
    providerId: 'polygon',
    symbol,
    timeframe: timeframeId,
    derivedFrom: timeframeId,
    sourceIntervalSeconds: timeframeDurationSeconds(timeframeId),
    candles
  };
};

const finnhubResolutionMap = {
  '1m': { code: '1', window: 60 * 60 * 4 },
  '5m': { code: '5', window: 60 * 60 * 24 },
  '15m': { code: '15', window: 60 * 60 * 24 * 3 },
  '30m': { code: '30', window: 60 * 60 * 24 * 5 },
  '1h': { code: '60', window: 60 * 60 * 24 * 10 },
  '1d': { code: 'D', window: 60 * 60 * 24 * 200 },
  '1w': { code: 'W', window: 60 * 60 * 24 * 7 * 200 },
  '1M': { code: 'M', window: 60 * 60 * 24 * 30 * 200 }
};

const fetchFromFinnhub = async ({ symbol, timeframeId, apiKey }) => {
  if (!apiKey) throw new Error('Finnhub requires an API key');
  const mapping = finnhubResolutionMap[timeframeId] || finnhubResolutionMap['1d'];
  const to = Math.floor(Date.now() / 1000);
  const from = to - mapping.window;
  const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${mapping.code}&from=${from}&to=${to}&token=${apiKey}`;
  const data = await fetchJSON(url);
  if (data.s !== 'ok') throw new Error('Finnhub returned no data');
  const candles = data.t.map((timestamp, idx) => ({
    timestamp: timestamp * 1000,
    open: data.o[idx],
    high: data.h[idx],
    low: data.l[idx],
    close: data.c[idx],
    volume: data.v[idx]
  }));
  return {
    providerId: 'finnhub',
    symbol,
    timeframe: timeframeId,
    derivedFrom: timeframeId,
    sourceIntervalSeconds: timeframeDurationSeconds(timeframeId),
    candles: sortByTimestamp(candles)
  };
};

const generateSyntheticSeries = ({ symbol, timeframeId }) => {
  const duration = timeframeDurationSeconds(timeframeId) || 60;
  const points = 800;
  let price = 100 + Math.random() * 25;
  const candles = [];
  for (let i = points; i > 0; i -= 1) {
    const ts = Date.now() - i * duration * 1000;
    const drift = (Math.random() - 0.5) * 2;
    const open = price;
    price = Math.max(0.5, price + drift);
    const close = price;
    const high = Math.max(open, close) + Math.random();
    const low = Math.min(open, close) - Math.random();
    candles.push({ timestamp: ts, open, high, low, close, volume: 1_000 + Math.random() * 5_000 });
  }
  return {
    providerId: 'synthetic',
    symbol,
    timeframe: timeframeId,
    derivedFrom: 'synthetic',
    sourceIntervalSeconds: duration,
    candles: sortByTimestamp(candles)
  };
};

const HANDLERS = {
  alphaVantage: requestAlphaSeries,
  financialModelingPrep: fetchFromFMP,
  yahooFinance: fetchFromYahoo,
  polygon: fetchFromPolygon,
  finnhub: fetchFromFinnhub
};

export const getProviderMetadata = (id) => PROVIDER_METADATA.find((provider) => provider.id === id);

export const listProviders = () => PROVIDER_METADATA;

export const fetchTimeSeries = async ({ providerId, symbol, timeframeId, apiKey }) => {
  const key = makeCacheKey({ providerId, symbol, timeframeId, apiKey });
  if (responseCache.has(key)) {
    return responseCache.get(key);
  }
  const handler = HANDLERS[providerId] || HANDLERS.alphaVantage;
  try {
    const data = await handler({ symbol, timeframeId, apiKey });
    responseCache.set(key, data);
    return data;
  } catch (error) {
    console.warn(`[DataProvider] Falling back to synthetic data for ${symbol} ${timeframeId}`, error.message);
    const synthetic = generateSyntheticSeries({ symbol, timeframeId });
    responseCache.set(key, synthetic);
    return synthetic;
  }
};

export const deriveSeriesForTimeframe = async ({ providerId, symbol, timeframeId, apiKey }) => {
  try {
    const config = getTimeframeConfig(timeframeId);
    if (!config) throw new Error('Unknown timeframe');
    if (!config.synthetic) {
      return fetchTimeSeries({ providerId, symbol, timeframeId, apiKey });
    }
    const base = config.baseInterval || '1m';
    const baseSeries = await fetchTimeSeries({ providerId, symbol, timeframeId: base, apiKey });
    const factor = computeAggregationFactor(timeframeId, base);
    if (!factor || factor <= 1) return { ...baseSeries, timeframe: timeframeId };
    const candles = resampleSeries(baseSeries.candles, factor);
    return {
      ...baseSeries,
      timeframe: timeframeId,
      derivedFrom: base,
      candles
    };
  } catch (error) {
    return generateSyntheticSeries({ symbol, timeframeId });
  }
};
