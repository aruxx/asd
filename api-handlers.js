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
        const avInterval = this.timeframeToAlphaVantageInterval(interval);
        const url = interval === '1d' 
            ? `https://www.alphavantage.co/query?function=${functionName}&symbol=${ticker}&outputsize=full&apikey=${this.apiKey}`
            : `https://www.alphavantage.co/query?function=${functionName}&symbol=${ticker}&interval=${avInterval}&outputsize=full&apikey=${this.apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data['Error Message']) {
                throw new Error(data['Error Message']);
            }
            if (data['Note']) {
                throw new Error('API call frequency limit reached. Please wait a moment.');
            }

            const timeSeriesKey = interval === '1d' 
                ? 'Time Series (Daily)' 
                : `Time Series (${this.formatInterval(avInterval)})`;
            
            const timeSeries = data[timeSeriesKey];
            if (!timeSeries) {
                throw new Error('No data returned from API. Check ticker symbol and interval.');
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
        // Get enough data for largest SMA (999 periods) - calculate days needed
        const daysNeeded = Math.ceil((999 * this.getTimeframeSeconds(timeframe)) / 86400);
        const from = to - (daysNeeded * 86400); // Convert days to seconds

        const url = `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=${resolution}&from=${from}&to=${to}&token=${this.apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.s === 'no_data') {
                throw new Error('No data available for this ticker');
            }
            if (data.s === 'error') {
                throw new Error(data.error || 'Finnhub API error');
            }
            if (!data.t || !data.t.length) {
                throw new Error('No timestamp data in response');
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
        
        // Calculate date range - need enough data for largest SMA (999 periods)
        const daysNeeded = Math.ceil((999 * this.getTimeframeSeconds(timeframe)) / 86400);
        const maxDays = 730; // Polygon free tier limit
        const daysToFetch = Math.min(daysNeeded, maxDays);
        
        const to = new Date();
        const from = new Date(to.getTime() - (daysToFetch * 24 * 60 * 60 * 1000));
        const toStr = to.toISOString().split('T')[0];
        const fromStr = from.toISOString().split('T')[0];

        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${fromStr}/${toStr}?adjusted=true&sort=asc&limit=5000&apiKey=${this.apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'ERROR') {
                throw new Error(data.error || data.message || 'Polygon API error');
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

        const tdInterval = this.timeframeToTwelveDataInterval(interval);
        // Get enough data for largest SMA (999 periods)
        const outputsize = Math.min(5000, Math.max(999, 200)); // Max 5000, min 999

        const url = `https://api.twelvedata.com/time_series?symbol=${ticker}&interval=${tdInterval}&outputsize=${outputsize}&apikey=${this.apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.status === 'error') {
                throw new Error(data.message || 'Twelve Data API error');
            }
            if (!data.values || !Array.isArray(data.values) || data.values.length === 0) {
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
        const interval = this.timeframeToYahooInterval(timeframe);
        const range = this.timeframeToYahooRange(timeframe);
        
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.chart && data.chart.error) {
                throw new Error(data.chart.error.description || 'Yahoo Finance API error');
            }
            
            if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
                throw new Error('No data available for this ticker');
            }

            const result = data.chart.result[0];
            if (!result || !result.timestamp || !result.indicators || !result.indicators.quote || !result.indicators.quote[0]) {
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
        
        for (const timestamp of timestamps) {
            const data = timeSeries[timestamp];
            const close = parseFloat(data['4. close']);
            
            if (!isNaN(close) && close > 0) {
                prices.push({
                    timestamp: new Date(timestamp).getTime(),
                    open: !isNaN(parseFloat(data['1. open'])) ? parseFloat(data['1. open']) : close,
                    high: !isNaN(parseFloat(data['2. high'])) ? parseFloat(data['2. high']) : close,
                    low: !isNaN(parseFloat(data['3. low'])) ? parseFloat(data['3. low']) : close,
                    close: close,
                    volume: !isNaN(parseFloat(data['5. volume'])) ? parseFloat(data['5. volume']) : 0
                });
            }
        }
        
        if (prices.length === 0) {
            throw new Error('No valid price data found in Alpha Vantage response');
        }

        return prices.reverse(); // Oldest to newest
    }

    parseFinnhubData(data) {
        const prices = [];
        if (!data.t || !data.t.length) {
            throw new Error('No timestamp data in Finnhub response');
        }
        
        for (let i = 0; i < data.t.length; i++) {
            const close = data.c && data.c[i];
            if (close !== null && close !== undefined && !isNaN(close)) {
                prices.push({
                    timestamp: data.t[i] * 1000, // Convert to milliseconds
                    open: (data.o && data.o[i] !== null && data.o[i] !== undefined) ? data.o[i] : close,
                    high: (data.h && data.h[i] !== null && data.h[i] !== undefined) ? data.h[i] : close,
                    low: (data.l && data.l[i] !== null && data.l[i] !== undefined) ? data.l[i] : close,
                    close: close,
                    volume: (data.v && data.v[i] !== null && data.v[i] !== undefined) ? data.v[i] : 0
                });
            }
        }
        
        if (prices.length === 0) {
            throw new Error('No valid price data found in Finnhub response');
        }
        
        return prices;
    }

    parsePolygonData(results) {
        const prices = [];
        for (const item of results) {
            if (item.c !== null && item.c !== undefined && !isNaN(item.c)) {
                prices.push({
                    timestamp: item.t, // Already in milliseconds
                    open: (item.o !== null && item.o !== undefined) ? item.o : item.c,
                    high: (item.h !== null && item.h !== undefined) ? item.h : item.c,
                    low: (item.l !== null && item.l !== undefined) ? item.l : item.c,
                    close: item.c,
                    volume: (item.v !== null && item.v !== undefined) ? item.v : 0
                });
            }
        }
        
        if (prices.length === 0) {
            throw new Error('No valid price data found in Polygon response');
        }
        
        return prices;
    }

    parseTwelveData(values) {
        const prices = [];
        for (const item of values) {
            const close = parseFloat(item.close);
            if (!isNaN(close) && close > 0) {
                prices.push({
                    timestamp: new Date(item.datetime).getTime(),
                    open: !isNaN(parseFloat(item.open)) ? parseFloat(item.open) : close,
                    high: !isNaN(parseFloat(item.high)) ? parseFloat(item.high) : close,
                    low: !isNaN(parseFloat(item.low)) ? parseFloat(item.low) : close,
                    close: close,
                    volume: !isNaN(parseFloat(item.volume)) ? parseFloat(item.volume) : 0
                });
            }
        }
        
        if (prices.length === 0) {
            throw new Error('No valid price data found in Twelve Data response');
        }
        
        return prices.reverse(); // Oldest to newest
    }

    parseYahooData(result) {
        const prices = [];
        const timestamps = result.timestamp || [];
        const quote = result.indicators.quote[0];
        
        if (!quote || !timestamps.length) {
            throw new Error('No valid price data in response');
        }
        
        for (let i = 0; i < timestamps.length; i++) {
            // Check if we have valid data for this timestamp
            const close = quote.close && quote.close[i];
            const open = quote.open && quote.open[i];
            const high = quote.high && quote.high[i];
            const low = quote.low && quote.low[i];
            const volume = quote.volume && quote.volume[i];
            
            // Only include if we have at least close price
            if (close !== null && close !== undefined && !isNaN(close)) {
                prices.push({
                    timestamp: timestamps[i] * 1000, // Convert to milliseconds
                    open: open !== null && open !== undefined ? open : close,
                    high: high !== null && high !== undefined ? high : close,
                    low: low !== null && low !== undefined ? low : close,
                    close: close,
                    volume: volume !== null && volume !== undefined ? volume : 0
                });
            }
        }
        
        if (prices.length === 0) {
            throw new Error('No valid price data found after parsing');
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
            '1m': '1m', 
            '5m': '5m', 
            '15m': '15m', 
            '30m': '30m',
            '1h': '1h', 
            '2h': '1h', // Yahoo doesn't support 2h, use 1h
            '4h': '1h', // Yahoo doesn't support 4h, use 1h
            '1d': '1d', 
            '1W': '1wk', 
            '1M': '1mo'
        };
        return map[timeframe] || '1d';
    }

    timeframeToYahooRange(timeframe) {
        // Select appropriate range to get enough historical data for SMA calculations
        // Need at least 999 periods for the largest SMA outfit
        const map = {
            '1m': '1d',    // 1 day for 1-minute data
            '5m': '5d',    // 5 days for 5-minute data
            '15m': '1mo',  // 1 month for 15-minute data
            '30m': '3mo',  // 3 months for 30-minute data
            '1h': '1y',    // 1 year for hourly data
            '2h': '1y',    // 1 year for 2-hour data
            '4h': '1y',    // 1 year for 4-hour data
            '1d': '2y',    // 2 years for daily data
            '1W': '5y',    // 5 years for weekly data
            '1M': '10y'    // 10 years for monthly data
        };
        return map[timeframe] || '1y';
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

    timeframeToAlphaVantageInterval(timeframe) {
        const map = {
            '1m': '1min',
            '5m': '5min',
            '15m': '15min',
            '30m': '30min',
            '1h': '60min',
            '1d': 'daily'
        };
        return map[timeframe] || 'daily';
    }

    timeframeToTwelveDataInterval(timeframe) {
        const map = {
            '1m': '1min',
            '5m': '5min',
            '15m': '15min',
            '30m': '30min',
            '1h': '1hour',
            '1d': '1day',
            '1W': '1week',
            '1M': '1month'
        };
        return map[timeframe] || '1day';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIHandler;
}
