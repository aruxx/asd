// API Configuration for multiple stock market data providers

const API_CONFIGS = {
    alphavantage: {
        name: 'Alpha Vantage',
        free: true,
        baseUrl: 'https://www.alphavantage.co/query',
        requiresKey: true,
        keyParam: 'apikey',
        info: 'Get free API key at alphavantage.co',
        getQuoteUrl: (symbol, apiKey) => 
            `${API_CONFIGS.alphavantage.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
        getTimeSeriesUrl: (symbol, interval, apiKey) => {
            const functionMap = {
                '1m': 'TIME_SERIES_INTRADAY',
                '5m': 'TIME_SERIES_INTRADAY',
                '15m': 'TIME_SERIES_INTRADAY',
                '30m': 'TIME_SERIES_INTRADAY',
                '1h': 'TIME_SERIES_INTRADAY',
                '1d': 'TIME_SERIES_DAILY'
            };
            const intervalMap = {
                '1m': '1min',
                '5m': '5min',
                '15m': '15min',
                '30m': '30min',
                '1h': '60min',
                '1d': 'daily'
            };
            const func = functionMap[interval] || 'TIME_SERIES_DAILY';
            const intervalParam = intervalMap[interval] || 'daily';
            return `${API_CONFIGS.alphavantage.baseUrl}?function=${func}&symbol=${symbol}&interval=${intervalParam}&apikey=${apiKey}&outputsize=full`;
        },
        parseData: (data, interval) => {
            if (data['Error Message'] || data['Note']) {
                throw new Error(data['Error Message'] || 'API call frequency limit exceeded');
            }
            const timeSeriesKey = interval === '1d' 
                ? 'Time Series (Daily)'
                : `Time Series (${interval === '1m' ? '1min' : interval === '5m' ? '5min' : interval === '15m' ? '15min' : interval === '30m' ? '30min' : '60min'})`;
            const series = data[timeSeriesKey];
            if (!series) return [];
            return Object.entries(series).map(([timestamp, values]) => ({
                timestamp: new Date(timestamp),
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseFloat(values['5. volume'])
            })).sort((a, b) => a.timestamp - b.timestamp);
        }
    },
    finnhub: {
        name: 'Finnhub',
        free: true,
        baseUrl: 'https://finnhub.io/api/v1',
        requiresKey: true,
        keyParam: 'token',
        info: 'Get free API key at finnhub.io',
        getQuoteUrl: (symbol, apiKey) => 
            `${API_CONFIGS.finnhub.baseUrl}/quote?symbol=${symbol}&token=${apiKey}`,
        getTimeSeriesUrl: (symbol, interval, apiKey) => {
            const resolutionMap = {
                '1m': '1',
                '5m': '5',
                '15m': '15',
                '30m': '30',
                '1h': '60',
                '1d': 'D'
            };
            const resolution = resolutionMap[interval] || 'D';
            const to = Math.floor(Date.now() / 1000);
            const from = to - (interval === '1d' ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60);
            return `${API_CONFIGS.finnhub.baseUrl}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;
        },
        parseData: (data) => {
            if (data.s === 'no_data' || !data.c) return [];
            return data.t.map((timestamp, i) => ({
                timestamp: new Date(timestamp * 1000),
                open: data.o[i],
                high: data.h[i],
                low: data.l[i],
                close: data.c[i],
                volume: data.v[i]
            }));
        }
    },
    polygon: {
        name: 'Polygon.io',
        free: true,
        baseUrl: 'https://api.polygon.io/v2',
        requiresKey: true,
        keyParam: 'apikey',
        info: 'Get free API key at polygon.io',
        getQuoteUrl: (symbol, apiKey) => 
            `https://api.polygon.io/v2/last/trade/${symbol}?apikey=${apiKey}`,
        getTimeSeriesUrl: (symbol, interval, apiKey) => {
            const multiplier = interval === '1m' ? 1 : interval === '5m' ? 5 : interval === '15m' ? 15 : interval === '30m' ? 30 : interval === '1h' ? 60 : 1;
            const timespan = interval === '1d' ? 'day' : 'minute';
            const from = new Date();
            from.setDate(from.getDate() - (interval === '1d' ? 365 : 30));
            const to = new Date();
            return `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from.toISOString().split('T')[0]}/${to.toISOString().split('T')[0]}?adjusted=true&sort=asc&apikey=${apiKey}`;
        },
        parseData: (data) => {
            if (!data.results || data.results.length === 0) return [];
            return data.results.map(item => ({
                timestamp: new Date(item.t),
                open: item.o,
                high: item.h,
                low: item.l,
                close: item.c,
                volume: item.v
            }));
        }
    },
    twelvedata: {
        name: 'Twelve Data',
        free: true,
        baseUrl: 'https://api.twelvedata.com',
        requiresKey: true,
        keyParam: 'apikey',
        info: 'Get free API key at twelvedata.com',
        getQuoteUrl: (symbol, apiKey) => 
            `${API_CONFIGS.twelvedata.baseUrl}/price?symbol=${symbol}&apikey=${apiKey}`,
        getTimeSeriesUrl: (symbol, interval, apiKey) => {
            const intervalMap = {
                '1m': '1min',
                '5m': '5min',
                '15m': '15min',
                '30m': '30min',
                '1h': '1hour',
                '1d': '1day'
            };
            const intervalParam = intervalMap[interval] || '1day';
            return `${API_CONFIGS.twelvedata.baseUrl}/time_series?symbol=${symbol}&interval=${intervalParam}&apikey=${apiKey}&outputsize=5000`;
        },
        parseData: (data) => {
            if (data.status === 'error') {
                throw new Error(data.message || 'API error');
            }
            if (!data.values) return [];
            return data.values.map(item => ({
                timestamp: new Date(item.datetime),
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close),
                volume: parseFloat(item.volume)
            })).sort((a, b) => a.timestamp - b.timestamp);
        }
    },
    yahoo: {
        name: 'Yahoo Finance',
        free: true,
        baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart',
        requiresKey: false,
        keyParam: null,
        info: 'No API key required - uses public Yahoo Finance API',
        getQuoteUrl: (symbol) => 
            `${API_CONFIGS.yahoo.baseUrl}/${symbol}`,
        getTimeSeriesUrl: (symbol, interval) => {
            const period1 = Math.floor((Date.now() - (365 * 24 * 60 * 60 * 1000)) / 1000);
            const period2 = Math.floor(Date.now() / 1000);
            const intervalMap = {
                '1m': '1m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1h',
                '1d': '1d'
            };
            const intervalParam = intervalMap[interval] || '1d';
            return `${API_CONFIGS.yahoo.baseUrl}/${symbol}?period1=${period1}&period2=${period2}&interval=${intervalParam}`;
        },
        parseData: (data) => {
            if (!data.chart || !data.chart.result || data.chart.result.length === 0) return [];
            const result = data.chart.result[0];
            if (!result.timestamp || !result.indicators || !result.indicators.quote) return [];
            const timestamps = result.timestamp;
            const quote = result.indicators.quote[0];
            return timestamps.map((timestamp, i) => ({
                timestamp: new Date(timestamp * 1000),
                open: quote.open[i],
                high: quote.high[i],
                low: quote.low[i],
                close: quote.close[i],
                volume: quote.volume[i]
            })).filter(item => item.close !== null);
        }
    },
    custom: {
        name: 'Custom API',
        free: false,
        baseUrl: '',
        requiresKey: true,
        keyParam: 'apikey',
        info: 'Enter your custom API endpoint and key',
        getQuoteUrl: null,
        getTimeSeriesUrl: null,
        parseData: null
    }
};

// Store current API configuration
let currentApiConfig = {
    provider: 'yahoo',
    apiKey: ''
};

// Load API configuration from localStorage
function loadApiConfig() {
    const saved = localStorage.getItem('smaApiConfig');
    if (saved) {
        try {
            currentApiConfig = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading API config:', e);
        }
    }
}

// Save API configuration to localStorage
function saveApiConfig() {
    localStorage.setItem('smaApiConfig', JSON.stringify(currentApiConfig));
}

// Get current API configuration
function getCurrentApiConfig() {
    return API_CONFIGS[currentApiConfig.provider];
}

// Fetch stock data using current API
async function fetchStockData(symbol, interval, apiKey = null) {
    const config = getCurrentApiConfig();
    if (!config) {
        throw new Error('Invalid API configuration');
    }

    const key = apiKey || currentApiConfig.apiKey;
    if (config.requiresKey && !key && config.name !== 'Yahoo Finance') {
        throw new Error(`${config.name} requires an API key`);
    }

    const url = config.getTimeSeriesUrl(symbol, interval, key);
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return config.parseData(data, interval);
    } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        throw error;
    }
}

// Initialize API config on load
loadApiConfig();
