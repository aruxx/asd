// API Configuration for multiple stock market data providers

const API_CONFIGS = {
    alphavantage: {
        name: 'Alpha Vantage',
        free: true,
        baseUrl: 'https://www.alphavantage.co/query',
        requiresKey: true,
        keyParam: 'apikey',
        info: 'Get free API key at alphavantage.co (5 API calls/min, 500/day limit)',
        getQuoteUrl: (symbol, apiKey) => 
            `${API_CONFIGS.alphavantage.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
        getTimeSeriesUrl: (symbol, interval, apiKey) => {
            if (!apiKey) {
                throw new Error('Alpha Vantage requires an API key');
            }
            const functionMap = {
                '1m': 'TIME_SERIES_INTRADAY',
                '5m': 'TIME_SERIES_INTRADAY',
                '15m': 'TIME_SERIES_INTRADAY',
                '30m': 'TIME_SERIES_INTRADAY',
                '1h': 'TIME_SERIES_INTRADAY',
                '1d': 'TIME_SERIES_DAILY_ADJUSTED'
            };
            const intervalMap = {
                '1m': '1min',
                '5m': '5min',
                '15m': '15min',
                '30m': '30min',
                '1h': '60min',
                '1d': 'daily'
            };
            const func = functionMap[interval] || 'TIME_SERIES_DAILY_ADJUSTED';
            const intervalParam = intervalMap[interval] || 'daily';
            const outputsize = interval === '1d' ? 'full' : 'compact';
            return `${API_CONFIGS.alphavantage.baseUrl}?function=${func}&symbol=${symbol}&interval=${intervalParam}&apikey=${apiKey}&outputsize=${outputsize}`;
        },
        parseData: (data, interval) => {
            if (data['Error Message']) {
                throw new Error(data['Error Message']);
            }
            if (data['Note']) {
                throw new Error('API call frequency limit exceeded. Please wait a minute.');
            }
            const timeSeriesKey = interval === '1d' 
                ? 'Time Series (Daily)'
                : interval === '1m' ? 'Time Series (1min)'
                : interval === '5m' ? 'Time Series (5min)'
                : interval === '15m' ? 'Time Series (15min)'
                : interval === '30m' ? 'Time Series (30min)'
                : 'Time Series (60min)';
            const series = data[timeSeriesKey];
            if (!series) return [];
            return Object.entries(series).map(([timestamp, values]) => ({
                timestamp: new Date(timestamp + ' ' + (data['Meta Data']?.['5. Time Zone'] || 'UTC')),
                open: parseFloat(values['1. open'] || values['1. open']),
                high: parseFloat(values['2. high'] || values['2. high']),
                low: parseFloat(values['3. low'] || values['3. low']),
                close: parseFloat(values['4. close'] || values['5. adjusted close'] || values['4. close']),
                volume: parseFloat(values['5. volume'] || values['6. volume'] || 0)
            })).sort((a, b) => a.timestamp - b.timestamp);
        }
    },
    finnhub: {
        name: 'Finnhub',
        free: true,
        baseUrl: 'https://finnhub.io/api/v1',
        requiresKey: true,
        keyParam: 'token',
        info: 'Get free API key at finnhub.io (60 calls/min limit)',
        getQuoteUrl: (symbol, apiKey) => 
            `${API_CONFIGS.finnhub.baseUrl}/quote?symbol=${symbol}&token=${apiKey}`,
        getTimeSeriesUrl: (symbol, interval, apiKey) => {
            if (!apiKey) {
                throw new Error('Finnhub requires an API key');
            }
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
            // Free tier: max 1 year for daily, 30 days for intraday
            const from = to - (interval === '1d' ? 365 * 24 * 60 * 60 : 30 * 24 * 60 * 60);
            return `${API_CONFIGS.finnhub.baseUrl}/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;
        },
        parseData: (data) => {
            if (data.s === 'no_data' || data.s === 'error' || !data.c || !data.t) {
                return [];
            }
            if (!Array.isArray(data.t) || data.t.length === 0) {
                return [];
            }
            return data.t.map((timestamp, i) => ({
                timestamp: new Date(timestamp * 1000),
                open: data.o && data.o[i] !== undefined ? data.o[i] : null,
                high: data.h && data.h[i] !== undefined ? data.h[i] : null,
                low: data.l && data.l[i] !== undefined ? data.l[i] : null,
                close: data.c && data.c[i] !== undefined ? data.c[i] : null,
                volume: data.v && data.v[i] !== undefined ? data.v[i] : 0
            })).filter(item => item.close !== null && item.close !== undefined);
        }
    },
    polygon: {
        name: 'Polygon.io',
        free: true,
        baseUrl: 'https://api.polygon.io/v2',
        requiresKey: true,
        keyParam: 'apikey',
        info: 'Get free API key at polygon.io (5 calls/min limit)',
        getQuoteUrl: (symbol, apiKey) => 
            `https://api.polygon.io/v2/last/trade/${symbol}?apikey=${apiKey}`,
        getTimeSeriesUrl: (symbol, interval, apiKey) => {
            if (!apiKey) {
                throw new Error('Polygon.io requires an API key');
            }
            const multiplier = interval === '1m' ? 1 : interval === '5m' ? 5 : interval === '15m' ? 15 : interval === '30m' ? 30 : interval === '1h' ? 60 : 1;
            const timespan = interval === '1d' ? 'day' : 'minute';
            const to = new Date();
            const from = new Date();
            // Free tier: max 2 years for daily, 1 year for intraday
            from.setDate(from.getDate() - (interval === '1d' ? 730 : 365));
            const fromStr = from.toISOString().split('T')[0];
            const toStr = to.toISOString().split('T')[0];
            return `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${fromStr}/${toStr}?adjusted=true&sort=asc&limit=50000&apikey=${apiKey}`;
        },
        parseData: (data) => {
            if (data.status === 'ERROR' || data.error) {
                throw new Error(data.error || data.message || 'Polygon API error');
            }
            if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
                return [];
            }
            return data.results.map(item => ({
                timestamp: new Date(item.t),
                open: item.o !== undefined ? item.o : null,
                high: item.h !== undefined ? item.h : null,
                low: item.l !== undefined ? item.l : null,
                close: item.c !== undefined ? item.c : null,
                volume: item.v !== undefined ? item.v : 0
            })).filter(item => item.close !== null && item.close !== undefined);
        }
    },
    twelvedata: {
        name: 'Twelve Data',
        free: true,
        baseUrl: 'https://api.twelvedata.com',
        requiresKey: true,
        keyParam: 'apikey',
        info: 'Get free API key at twelvedata.com (800 calls/day limit)',
        getQuoteUrl: (symbol, apiKey) => 
            `${API_CONFIGS.twelvedata.baseUrl}/price?symbol=${symbol}&apikey=${apiKey}`,
        getTimeSeriesUrl: (symbol, interval, apiKey) => {
            if (!apiKey) {
                throw new Error('Twelve Data requires an API key');
            }
            const intervalMap = {
                '1m': '1min',
                '5m': '5min',
                '15m': '15min',
                '30m': '30min',
                '1h': '1hour',
                '1d': '1day'
            };
            const intervalParam = intervalMap[interval] || '1day';
            // Free tier: max 5000 data points
            const outputsize = interval === '1d' ? '5000' : '5000';
            return `${API_CONFIGS.twelvedata.baseUrl}/time_series?symbol=${symbol}&interval=${intervalParam}&apikey=${apiKey}&outputsize=${outputsize}&format=json`;
        },
        parseData: (data) => {
            if (data.status === 'error') {
                throw new Error(data.message || 'Twelve Data API error');
            }
            if (!data.values || !Array.isArray(data.values)) {
                return [];
            }
            return data.values.map(item => ({
                timestamp: new Date(item.datetime),
                open: parseFloat(item.open) || null,
                high: parseFloat(item.high) || null,
                low: parseFloat(item.low) || null,
                close: parseFloat(item.close) || null,
                volume: parseFloat(item.volume) || 0
            })).filter(item => item.close !== null && !isNaN(item.close)).sort((a, b) => a.timestamp - b.timestamp);
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
            `${API_CONFIGS.yahoo.baseUrl}/${symbol}?interval=1d&range=1d`,
        getTimeSeriesUrl: (symbol, interval) => {
            const intervalMap = {
                '1m': '1m',
                '5m': '5m',
                '15m': '15m',
                '30m': '30m',
                '1h': '1h',
                '1d': '1d'
            };
            const rangeMap = {
                '1m': '1d',
                '5m': '5d',
                '15m': '1mo',
                '30m': '1mo',
                '1h': '3mo',
                '1d': '1y'
            };
            const intervalParam = intervalMap[interval] || '1d';
            const rangeParam = rangeMap[interval] || '1y';
            return `${API_CONFIGS.yahoo.baseUrl}/${symbol}?interval=${intervalParam}&range=${rangeParam}`;
        },
        parseData: (data) => {
            if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
                return [];
            }
            const result = data.chart.result[0];
            if (!result.timestamp || !result.indicators || !result.indicators.quote || result.indicators.quote.length === 0) {
                return [];
            }
            const timestamps = result.timestamp;
            const quote = result.indicators.quote[0];
            const adjclose = result.indicators.adjclose && result.indicators.adjclose[0] ? result.indicators.adjclose[0].adjclose : null;
            
            return timestamps.map((timestamp, i) => {
                // Use adjusted close if available, otherwise use regular close
                const closePrice = adjclose && adjclose[i] !== null ? adjclose[i] : (quote.close[i] !== null ? quote.close[i] : null);
                
                return {
                    timestamp: new Date(timestamp * 1000),
                    open: quote.open[i] !== null ? quote.open[i] : null,
                    high: quote.high[i] !== null ? quote.high[i] : null,
                    low: quote.low[i] !== null ? quote.low[i] : null,
                    close: closePrice,
                    volume: quote.volume[i] !== null ? quote.volume[i] : 0
                };
            }).filter(item => item.close !== null && item.close !== undefined);
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
        throw new Error(`${config.name} requires an API key. Please enter your API key in the configuration.`);
    }

    const url = config.getTimeSeriesUrl(symbol, interval, key);
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText.substring(0, 100)}`);
        }
        const data = await response.json();
        
        // Check for API-specific error responses
        if (data.error && !data.chart) {
            throw new Error(data.error.message || data.error || 'API returned an error');
        }
        
        const parsedData = config.parseData(data, interval);
        
        if (!parsedData || parsedData.length === 0) {
            throw new Error(`No data returned for ${symbol} on ${interval} timeframe. The symbol may not be available or the API may not support this timeframe.`);
        }
        
        return parsedData;
    } catch (error) {
        console.error(`Error fetching data for ${symbol} on ${interval}:`, error);
        // Re-throw with more context
        if (error.message) {
            throw error;
        }
        throw new Error(`Failed to fetch data for ${symbol}: ${error.message || error}`);
    }
}

// Initialize API config on load
loadApiConfig();
