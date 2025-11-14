// API Handlers for different stock market data providers

class APIHandler {
    constructor(provider, apiKey = null) {
        this.provider = provider;
        this.apiKey = apiKey;
    }

    async getStockData(ticker, timeframe = '1d', interval = '1d') {
        switch (this.provider) {
            case 'alphavantage':
                return this.alphaVantage(ticker, interval);
            case 'finnhub':
                return this.finnhub(ticker, timeframe);
            case 'polygon':
                return this.polygon(ticker, timeframe);
            case 'twelvedata':
                return this.twelveData(ticker, interval);
            case 'yahoo':
                return this.yahooFinance(ticker, timeframe);
            case 'custom':
                // For custom, we'll use Alpha Vantage format as default
                return this.alphaVantage(ticker, interval);
            default:
                throw new Error(`Unknown API provider: ${this.provider}`);
        }
    }

    // Alpha Vantage API (Free tier: 5 calls/minute, 500 calls/day)
    async alphaVantage(ticker, interval) {
        if (!this.apiKey) {
            throw new Error('Alpha Vantage requires an API key. Get one free at https://www.alphavantage.co/support/#api-key');
        }

        const functionName = interval === '1d' ? 'TIME_SERIES_DAILY' : 'TIME_SERIES_INTRADAY';
        const url = interval === '1d' 
            ? `https://www.alphavantage.co/query?function=${functionName}&symbol=${ticker}&apikey=${this.apiKey}`
            : `https://www.alphavantage.co/query?function=${functionName}&symbol=${ticker}&interval=${interval}&apikey=${this.apiKey}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data['Error Message']) {
                throw new Error(data['Error Message']);
            }
            if (data['Note']) {
                throw new Error('API call frequency limit reached. Please wait a moment.');
            }

            const timeSeries = data[interval === '1d' ? 'Time Series (Daily)' : `Time Series (${this.formatInterval(interval)})`];
            if (!timeSeries) {
                throw new Error('No data returned from API');
            }

            return this.parseAlphaVantageData(timeSeries);
        } catch (error) {
            console.error('Alpha Vantage API error:', error);
            throw error;
        }
    }

    // Finnhub API (Free tier: 60 calls/minute)
    async finnhub(ticker, timeframe) {
        if (!this.apiKey) {
            throw new Error('Finnhub requires an API key. Get one free at https://finnhub.io/register');
        }

        const resolution = this.timeframeToResolution(timeframe);
        const to = Math.floor(Date.now() / 1000);
        const from = to - (this.getTimeframeSeconds(timeframe) * 200); // Get enough data for SMA calculations

        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=${resolution}&from=${from}&to=${to}&token=${this.apiKey}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.s === 'no_data') {
                throw new Error('No data available for this ticker');
            }
            if (data.s === 'error') {
                throw new Error(data.error || 'Finnhub API error');
            }

            return this.parseFinnhubData(data);
        } catch (error) {
            console.error('Finnhub API error:', error);
            throw error;
        }
    }

    // Polygon.io API (Free tier available)
    async polygon(ticker, timeframe) {
        if (!this.apiKey) {
            throw new Error('Polygon.io requires an API key. Get one free at https://polygon.io/');
        }

        const timespan = this.timeframeToPolygonTimespan(timeframe);
        const multiplier = this.getPolygonMultiplier(timeframe);
        const to = new Date().toISOString().split('T')[0];
        const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=5000&apiKey=${this.apiKey}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'ERROR') {
                throw new Error(data.error || 'Polygon API error');
            }
            if (!data.results || data.results.length === 0) {
                throw new Error('No data available for this ticker');
            }

            return this.parsePolygonData(data.results);
        } catch (error) {
            console.error('Polygon API error:', error);
            throw error;
        }
    }

    // Twelve Data API (Free tier: 800 calls/day)
    async twelveData(ticker, interval) {
        if (!this.apiKey) {
            throw new Error('Twelve Data requires an API key. Get one free at https://twelvedata.com/');
        }

        const url = `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=${interval}&outputsize=200&apikey=${this.apiKey}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.status === 'error') {
                throw new Error(data.message || 'Twelve Data API error');
            }
            if (!data.values || data.values.length === 0) {
                throw new Error('No data available for this ticker');
            }

            return this.parseTwelveData(data.values);
        } catch (error) {
            console.error('Twelve Data API error:', error);
            throw error;
        }
    }

    // Yahoo Finance (No API key required, but rate-limited)
    async yahooFinance(ticker, timeframe) {
        // Using a CORS proxy for Yahoo Finance
        // Note: In production, you'd want to use a backend proxy
        const period = timeframe === '1d' ? '1y' : '1mo';
        const interval = this.timeframeToYahooInterval(timeframe);
        
        // Using yfinance API proxy (free, no key required)
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${period}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
                throw new Error('No data available for this ticker');
            }

            const result = data.chart.result[0];
            if (!result.timestamp || !result.indicators || !result.indicators.quote) {
                throw new Error('Invalid data format from Yahoo Finance');
            }

            return this.parseYahooData(result);
        } catch (error) {
            console.error('Yahoo Finance API error:', error);
            throw error;
        }
    }

    // Data parsing helpers
    parseAlphaVantageData(timeSeries) {
        const prices = [];
        const timestamps = Object.keys(timeSeries).sort();
        
        timestamps.forEach(timestamp => {
            const data = timeSeries[timestamp];
            prices.push({
                timestamp: new Date(timestamp).getTime(),
                open: parseFloat(data['1. open']),
                high: parseFloat(data['2. high']),
                low: parseFloat(data['3. low']),
                close: parseFloat(data['4. close']),
                volume: parseFloat(data['5. volume'])
            });
        });

        return prices.reverse(); // Oldest to newest
    }

    parseFinnhubData(data) {
        const prices = [];
        for (let i = 0; i < data.t.length; i++) {
            prices.push({
                timestamp: data.t[i] * 1000,
                open: data.o[i],
                high: data.h[i],
                low: data.l[i],
                close: data.c[i],
                volume: data.v[i]
            });
        }
        return prices;
    }

    parsePolygonData(results) {
        return results.map(item => ({
            timestamp: item.t,
            open: item.o,
            high: item.h,
            low: item.l,
            close: item.c,
            volume: item.v
        }));
    }

    parseTwelveData(values) {
        return values.map(item => ({
            timestamp: new Date(item.datetime).getTime(),
            open: parseFloat(item.open),
            high: parseFloat(item.high),
            low: parseFloat(item.low),
            close: parseFloat(item.close),
            volume: parseFloat(item.volume)
        })).reverse();
    }

    parseYahooData(result) {
        const prices = [];
        const timestamps = result.timestamp;
        const quote = result.indicators.quote[0];
        
        for (let i = 0; i < timestamps.length; i++) {
            if (quote.close[i] !== null) {
                prices.push({
                    timestamp: timestamps[i] * 1000,
                    open: quote.open[i],
                    high: quote.high[i],
                    low: quote.low[i],
                    close: quote.close[i],
                    volume: quote.volume[i]
                });
            }
        }
        return prices;
    }

    // Helper functions
    timeframeToResolution(timeframe) {
        const map = {
            '1m': '1', '5m': '5', '15m': '15', '30m': '30',
            '1h': '60', '1d': 'D', '1W': 'W', '1M': 'M'
        };
        return map[timeframe] || 'D';
    }

    timeframeToPolygonTimespan(timeframe) {
        if (timeframe.includes('m')) return 'minute';
        if (timeframe.includes('h')) return 'hour';
        if (timeframe.includes('d')) return 'day';
        if (timeframe.includes('W')) return 'week';
        if (timeframe.includes('M')) return 'month';
        return 'day';
    }

    getPolygonMultiplier(timeframe) {
        const match = timeframe.match(/(\d+)/);
        return match ? parseInt(match[1]) : 1;
    }

    timeframeToYahooInterval(timeframe) {
        const map = {
            '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
            '1h': '1h', '1d': '1d', '1W': '1wk', '1M': '1mo'
        };
        return map[timeframe] || '1d';
    }

    getTimeframeSeconds(timeframe) {
        const match = timeframe.match(/(\d+)/);
        const num = match ? parseInt(match[1]) : 1;
        if (timeframe.includes('S')) return num;
        if (timeframe.includes('m')) return num * 60;
        if (timeframe.includes('h')) return num * 3600;
        if (timeframe.includes('d')) return num * 86400;
        if (timeframe.includes('W')) return num * 604800;
        if (timeframe.includes('M')) return num * 2592000;
        return 86400;
    }

    formatInterval(interval) {
        return interval.charAt(0).toUpperCase() + interval.slice(1);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIHandler;
}
