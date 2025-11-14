const toAscendingSeries = (rows) => rows.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

const fmpIntervalMap = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '30m': '30min',
  '1h': '1hour',
  '4h': '4hour',
  '1d': '1day'
};

const alphaIntervalMap = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '30m': '30min',
  '1h': '60min'
};

const twelveIntervalMap = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '30m': '30min',
  '1h': '1h',
  '4h': '4h',
  '1d': '1day'
};

const polygonIntervalMap = {
  '1m': { multiplier: 1, span: 'minute', lookbackDays: 5 },
  '5m': { multiplier: 5, span: 'minute', lookbackDays: 10 },
  '15m': { multiplier: 15, span: 'minute', lookbackDays: 30 },
  '30m': { multiplier: 30, span: 'minute', lookbackDays: 60 },
  '1h': { multiplier: 60, span: 'minute', lookbackDays: 90 },
  '4h': { multiplier: 4, span: 'hour', lookbackDays: 180 },
  '1d': { multiplier: 1, span: 'day', lookbackDays: 365 }
};

const yahooIntervalMap = {
  '1m': { interval: '1m', range: '5d' },
  '5m': { interval: '5m', range: '1mo' },
  '15m': { interval: '15m', range: '1mo' },
  '30m': { interval: '30m', range: '6mo' },
  '1h': { interval: '1h', range: '1y' },
  '4h': { interval: '1h', range: '2y', group: 4 },
  '1d': { interval: '1d', range: '10y' }
};

async function safeFetch(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${url}`);
  }
  const type = response.headers.get('content-type');
  if (type && type.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

function ensureArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.historical)) return payload.historical;
  if (payload && Array.isArray(payload.data)) return payload.data;
  return [];
}

function normalizeQuoteRows(rows, dateField = 'date', closeField = 'close') {
  return rows
    .map((row) => ({
      timestamp: row[dateField] ?? row.datetime ?? row.t ?? row.timestamp,
      close: Number(row[closeField] ?? row.close ?? row.c ?? row.price)
    }))
    .filter((row) => row.timestamp && Number.isFinite(row.close));
}

function aggregateRows(rows, group = 1) {
  if (!group || group <= 1) return rows;
  const aggregated = [];
  for (let i = 0; i < rows.length; i += group) {
    const slice = rows.slice(i, i + group);
    const last = slice[slice.length - 1];
    if (last) aggregated.push(last);
  }
  return aggregated;
}

export const API_PROVIDERS = [
  {
    id: 'yahoo',
    name: 'Yahoo Finance',
    description: 'No-key chart endpoint with generous historical depth.',
    docsUrl: 'https://query1.finance.yahoo.com',
    requiresKey: false,
    intervals: Object.keys(yahooIntervalMap),
    notes: '4h data is derived from hourly bars client-side to preserve continuity.',
    async fetchSeries({ ticker, timeframe }) {
      const config = yahooIntervalMap[timeframe];
      if (!config) {
        throw new Error(`Yahoo Finance does not support the ${timeframe} timeframe.`);
      }
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${config.interval}&range=${config.range}&includePrePost=false`;
      const payload = await safeFetch(url);
      const result = payload?.chart?.result?.[0];
      if (!result) {
        throw new Error(payload?.chart?.error?.description || 'Yahoo Finance error');
      }
      const timestamps = result.timestamp ?? [];
      const closes = result.indicators?.quote?.[0]?.close ?? [];
      const rows = timestamps
        .map((ts, idx) => ({
          timestamp: new Date(ts * 1000).toISOString(),
          close: Number(closes[idx])
        }))
        .filter((row) => row.timestamp && Number.isFinite(row.close));
      return aggregateRows(toAscendingSeries(rows), config.group);
    }
  },
  {
    id: 'fmp',
    name: 'Financial Modeling Prep',
    description: 'REST endpoint with generous free tier; bring your own key.',
    docsUrl: 'https://financialmodelingprep.com/developer/docs/',
    requiresKey: true,
    intervals: Object.keys(fmpIntervalMap),
    notes: 'Supports intraday and daily historical-chart endpoints.',
    async fetchSeries({ ticker, timeframe, apiKey }) {
      const interval = fmpIntervalMap[timeframe];
      if (!interval) {
        throw new Error(`FMP does not support ${timeframe} data.`);
      }
      const key = apiKey;
      const baseUrl = interval === '1day'
        ? `https://financialmodelingprep.com/api/v3/historical-price-full/${encodeURIComponent(ticker)}?timeseries=500&apikey=${key}`
        : `https://financialmodelingprep.com/api/v3/historical-chart/${interval}/${encodeURIComponent(ticker)}?apikey=${key}`;
      const payload = await safeFetch(baseUrl);
      const rows = ensureArray(payload);
      return toAscendingSeries(
        normalizeQuoteRows(rows, 'date', 'close')
      );
    }
  },
  {
    id: 'alpha',
    name: 'Alpha Vantage',
    description: 'Popular free API with rich technical indicators.',
    docsUrl: 'https://www.alphavantage.co/documentation/',
    requiresKey: true,
    intervals: [...Object.keys(alphaIntervalMap), '1d'],
    notes: '5 calls/minute free tier. Intraday intervals limited to 1–60 minutes.',
    async fetchSeries({ ticker, timeframe, apiKey }) {
      const key = apiKey;
      let url;
      let dataKey;
      if (timeframe === '1d') {
        url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY_ADJUSTED&symbol=${encodeURIComponent(ticker)}&outputsize=compact&apikey=${key}`;
        dataKey = 'Time Series (Daily)';
      } else {
        const interval = alphaIntervalMap[timeframe];
        if (!interval) throw new Error(`Alpha Vantage does not support ${timeframe}`);
        url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(ticker)}&interval=${interval}&outputsize=compact&apikey=${key}`;
        dataKey = `Time Series (${interval})`;
      }
      const json = await safeFetch(url);
      if (json['Error Message']) {
        throw new Error(json['Error Message']);
      }
      if (json.Note) {
        throw new Error(json.Note);
      }
      const series = json[dataKey];
      if (!series) {
        throw new Error('Unexpected Alpha Vantage payload.');
      }
      const rows = Object.entries(series).map(([timestamp, values]) => ({
        timestamp,
        close: Number(values['4. close'])
      }));
      return toAscendingSeries(rows);
    }
  },
  {
    id: 'twelve',
    name: 'Twelve Data',
    description: 'Global coverage with flexible intervals; requires personal key.',
    docsUrl: 'https://twelvedata.com/docs',
    requiresKey: true,
    intervals: Object.keys(twelveIntervalMap),
    notes: 'Supports JSON responses with ascending order via order=ASC.',
    async fetchSeries({ ticker, timeframe, apiKey }) {
      const interval = twelveIntervalMap[timeframe];
      if (!interval) throw new Error(`Twelve Data does not support ${timeframe}`);
      const key = apiKey;
      const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(ticker)}&interval=${interval}&outputsize=5000&order=ASC&apikey=${key}`;
      const payload = await safeFetch(url);
      if (payload.status === 'error') {
        throw new Error(payload.message || 'Twelve Data error');
      }
      const rows = payload.values ?? [];
      return toAscendingSeries(
        normalizeQuoteRows(rows, 'datetime', 'close')
      );
    }
  },
  {
    id: 'polygon',
    name: 'Polygon.io',
    description: 'High fidelity aggregates with tick-level history.',
    docsUrl: 'https://polygon.io/docs/stocks/get_v2_aggs_ticker__stocksTicker__range__multiplier____timespan___from___to',
    requiresKey: true,
    intervals: Object.keys(polygonIntervalMap),
    notes: 'Free tier provides 5 calls/minute via community key.',
    async fetchSeries({ ticker, timeframe, apiKey }) {
      const interval = polygonIntervalMap[timeframe];
      if (!interval) throw new Error(`Polygon.io does not support ${timeframe}`);
      const key = apiKey;
      if (!key) throw new Error('Polygon.io requires an API key.');
      const now = new Date();
      const from = new Date(now.getTime() - interval.lookbackDays * 24 * 60 * 60 * 1000);
      const fromDate = from.toISOString().split('T')[0];
      const toDate = now.toISOString().split('T')[0];
      const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/${interval.multiplier}/${interval.span}/${fromDate}/${toDate}?adjusted=true&sort=asc&limit=5000&apiKey=${key}`;
      const payload = await safeFetch(url);
      if (payload.status !== 'OK') {
        throw new Error(payload.error || 'Polygon.io error');
      }
      const rows = payload.results ?? [];
      return toAscendingSeries(
        rows.map((row) => ({ timestamp: new Date(row.t).toISOString(), close: Number(row.c) }))
      );
    }
  }
];

export function getProviderById(id) {
  return API_PROVIDERS.find((provider) => provider.id === id);
}
