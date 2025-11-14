// SMA Outfits Real-Time Market Analysis Application
// Main Application Logic

class SMAAnalyzer {
    constructor() {
        this.apiProvider = 'alphavantage';
        this.apiKey = '';
        this.scannerActive = false;
        this.activeScans = [];
        this.results = [];
        this.scanInterval = null;
        this.apiRequestCount = 0;
        this.lastRequestTime = Date.now();
        
        // API Configurations
        this.apiConfigs = {
            alphavantage: {
                name: 'Alpha Vantage',
                baseUrl: 'https://www.alphavantage.co/query',
                rateLimit: 5, // requests per minute
                getApiKey: 'https://www.alphavantage.co/support/#api-key',
                useFreeKey: null,
                needsCORS: false
            },
            finnhub: {
                name: 'Finnhub',
                baseUrl: 'https://finnhub.io/api/v1',
                rateLimit: 60,
                getApiKey: 'https://finnhub.io/register',
                useFreeKey: null,
                needsCORS: false
            },
            twelvedata: {
                name: 'Twelve Data',
                baseUrl: 'https://api.twelvedata.com',
                rateLimit: 8,
                getApiKey: 'https://twelvedata.com/register',
                useFreeKey: null,
                needsCORS: false
            },
            polygon: {
                name: 'Polygon.io',
                baseUrl: 'https://api.polygon.io',
                rateLimit: 5,
                getApiKey: 'https://polygon.io/dashboard/signup',
                useFreeKey: null,
                needsCORS: false
            },
            fmp: {
                name: 'Financial Modeling Prep',
                baseUrl: 'https://financialmodelingprep.com/api/v3',
                rateLimit: 250,
                getApiKey: 'https://financialmodelingprep.com/developer/docs/',
                useFreeKey: null,
                needsCORS: false
            }
        };
        
        // Use CORS proxy if needed (can be toggled)
        this.useCORSProxy = false;
        this.corsProxy = 'https://corsproxy.io/?';

        // Default stocks from the documentation
        this.defaultStocks = [
            'SPY', 'QQQ', 'DIA', 'IWM', 'VIX', 'VXX', 'UVXY', 'SVXY',
            'TQQQ', 'SQQQ', 'UPRO', 'SPXU', 'SOXL', 'SOXS',
            'AAPL', 'MSFT', 'AMZN', 'GOOG', 'NVDA', 'META', 'TSLA',
            'AMD', 'NFLX', 'INTC', 'COIN', 'QCOM', 'PYPL',
            'JPM', 'BAC', 'GS', 'V', 'MA',
            'XLE', 'XLF', 'XLK', 'XLV', 'XLI'
        ];

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSavedConfig();
        this.updateAPIInfo();
    }

    setupEventListeners() {
        // API Provider Selection
        document.getElementById('api-provider').addEventListener('change', (e) => {
            this.apiProvider = e.target.value;
            this.updateAPIInfo();
            this.toggleAPIKeySection();
        });

        // API Key Save
        document.getElementById('save-api-key').addEventListener('click', () => {
            this.saveAPIKey();
        });

        // Scanner Controls
        document.getElementById('start-scanner').addEventListener('click', () => {
            this.startScanner();
        });

        document.getElementById('stop-scanner').addEventListener('click', () => {
            this.stopScanner();
        });

        document.getElementById('clear-results').addEventListener('click', () => {
            this.clearResults();
        });

        // Load Default Stocks
        document.getElementById('load-default-stocks').addEventListener('click', () => {
            this.loadDefaultStocks();
        });

        // Results Filters
        document.getElementById('filter-signal-type').addEventListener('change', () => {
            this.filterResults();
        });

        document.getElementById('filter-stock').addEventListener('change', () => {
            this.filterResults();
        });
    }

    toggleAPIKeySection() {
        const keySection = document.getElementById('api-key-section');
        
        // Always show API key section - all providers need a key
        keySection.style.display = 'block';
        
        // Try to load saved key for this provider
        const savedKey = localStorage.getItem(`apiKey_${this.apiProvider}`);
        if (savedKey) {
            document.getElementById('api-key').value = savedKey;
            this.apiKey = savedKey;
        } else {
            document.getElementById('api-key').value = '';
            this.apiKey = '';
        }
    }

    updateAPIInfo() {
        const link = document.getElementById('get-api-link');
        const config = this.apiConfigs[this.apiProvider];
        
        if (config && config.getApiKey) {
            link.href = config.getApiKey;
            link.style.display = 'inline-block';
        } else {
            link.style.display = 'none';
        }
    }

    saveAPIKey() {
        const keyInput = document.getElementById('api-key');
        this.apiKey = keyInput.value.trim();
        
        if (this.apiKey) {
            localStorage.setItem(`apiKey_${this.apiProvider}`, this.apiKey);
            this.showNotification('success', 'API Key Saved', 'Your API key has been saved successfully.');
        } else {
            this.showNotification('error', 'Invalid Key', 'Please enter a valid API key.');
        }
    }

    loadSavedConfig() {
        const savedProvider = localStorage.getItem('apiProvider');
        if (savedProvider) {
            this.apiProvider = savedProvider;
            document.getElementById('api-provider').value = savedProvider;
        }

        const savedKey = localStorage.getItem(`apiKey_${this.apiProvider}`);
        if (savedKey) {
            this.apiKey = savedKey;
            document.getElementById('api-key').value = savedKey;
        }

        this.toggleAPIKeySection();
    }

    loadDefaultStocks() {
        document.getElementById('stock-symbols').value = this.defaultStocks.join('\n');
        this.showNotification('success', 'Stocks Loaded', `${this.defaultStocks.length} default stocks loaded.`);
    }

    getSelectedSMAOutfits() {
        const checkboxes = document.querySelectorAll('#sma-outfits input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value.split(',').map(Number));
    }

    getSelectedTimeframes() {
        const checkboxes = document.querySelectorAll('#timeframes input[type="checkbox"]:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    getStockSymbols() {
        const textarea = document.getElementById('stock-symbols');
        return textarea.value
            .split('\n')
            .map(s => s.trim().toUpperCase())
            .filter(s => s.length > 0);
    }

    async startScanner() {
        const smaOutfits = this.getSelectedSMAOutfits();
        const timeframes = this.getSelectedTimeframes();
        const symbols = this.getStockSymbols();

        if (smaOutfits.length === 0) {
            this.showNotification('error', 'No SMA Outfits', 'Please select at least one SMA outfit.');
            return;
        }

        if (timeframes.length === 0) {
            this.showNotification('error', 'No Timeframes', 'Please select at least one timeframe.');
            return;
        }

        if (symbols.length === 0) {
            this.showNotification('error', 'No Symbols', 'Please enter at least one stock symbol.');
            return;
        }

        if (!this.apiKey) {
            this.showNotification('error', 'No API Key', 'Please enter your API key for ' + this.apiConfigs[this.apiProvider].name + ' first.');
            return;
        }

        this.scannerActive = true;
        this.updateScannerButtons();

        // Create active scan entries
        this.activeScans = [];
        for (const symbol of symbols) {
            for (const timeframe of timeframes) {
                for (const outfit of smaOutfits) {
                    this.activeScans.push({
                        symbol,
                        timeframe,
                        outfit,
                        status: 'active',
                        lastScan: null,
                        signals: 0
                    });
                }
            }
        }

        this.updateActiveScansDisplay();
        this.showNotification('success', 'Scanner Started', `Monitoring ${this.activeScans.length} configurations.`);

        // Start the scanning loop
        this.runScanningLoop();
    }

    stopScanner() {
        this.scannerActive = false;
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        this.updateScannerButtons();
        this.showNotification('info', 'Scanner Stopped', 'All scanning operations have been stopped.');
    }

    updateScannerButtons() {
        const startBtn = document.getElementById('start-scanner');
        const stopBtn = document.getElementById('stop-scanner');

        if (this.scannerActive) {
            startBtn.disabled = true;
            stopBtn.disabled = false;
        } else {
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    }

    async runScanningLoop() {
        // Run initial scan
        await this.performScan();

        // Set up interval for continuous scanning (every 60 seconds to respect rate limits)
        this.scanInterval = setInterval(async () => {
            if (this.scannerActive) {
                await this.performScan();
            }
        }, 60000); // 60 seconds
    }

    async performScan() {
        if (!this.scannerActive) return;

        const config = this.apiConfigs[this.apiProvider];
        const rateLimit = config.rateLimit || 5;
        
        // Process scans in batches to respect rate limits
        const batchSize = Math.floor(rateLimit / 2); // Conservative approach
        
        for (let i = 0; i < this.activeScans.length; i += batchSize) {
            if (!this.scannerActive) break;
            
            const batch = this.activeScans.slice(i, i + batchSize);
            const promises = batch.map(scan => this.scanConfiguration(scan));
            
            await Promise.all(promises);
            
            // Wait between batches to respect rate limits
            if (i + batchSize < this.activeScans.length) {
                await this.sleep(60000 / rateLimit * batchSize * 1000);
            }
        }

        this.updateActiveScansDisplay();
    }

    async scanConfiguration(scan) {
        try {
            // Fetch market data
            const data = await this.fetchMarketData(scan.symbol, scan.timeframe);
            
            if (!data || data.length === 0) {
                return;
            }

            // Calculate SMAs
            const smaValues = this.calculateSMAs(data, scan.outfit);
            
            // Detect signals
            const signals = this.detectSignals(smaValues, scan, data);
            
            if (signals.length > 0) {
                scan.signals += signals.length;
                this.results.push(...signals);
                this.updateResultsDisplay();
                
                // Show notification for new signals
                signals.forEach(signal => {
                    this.showNotification('success', 'New Signal Detected!', 
                        `${signal.type.toUpperCase()} signal for ${signal.symbol} on ${signal.timeframe}`);
                });
            }

            scan.lastScan = new Date();
            
        } catch (error) {
            console.error('Error scanning configuration:', error);
        }
    }

    async fetchMarketData(symbol, timeframe) {
        try {
            const apiKey = this.apiKey;
            
            if (!apiKey) {
                console.error('No API key available');
                this.showNotification('error', 'API Key Required', 'Please configure your API key before scanning.');
                return null;
            }

            // Route to appropriate API handler
            switch (this.apiProvider) {
                case 'alphavantage':
                    return await this.fetchAlphaVantage(symbol, timeframe, apiKey);
                case 'finnhub':
                    return await this.fetchFinnhub(symbol, timeframe, apiKey);
                case 'twelvedata':
                    return await this.fetchTwelveData(symbol, timeframe, apiKey);
                case 'polygon':
                    return await this.fetchPolygon(symbol, timeframe, apiKey);
                case 'fmp':
                    return await this.fetchFMP(symbol, timeframe, apiKey);
                default:
                    console.error('Unknown API provider');
                    return null;
            }
        } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            return null;
        }
    }

    // Alpha Vantage API
    async fetchAlphaVantage(symbol, timeframe, apiKey) {
        try {
            let func, interval, outputsize = 'compact';
            
            // Map timeframe to Alpha Vantage parameters
            if (timeframe === 'daily') {
                func = 'TIME_SERIES_DAILY';
                outputsize = 'full';
            } else if (timeframe === 'weekly') {
                func = 'TIME_SERIES_WEEKLY';
            } else {
                func = 'TIME_SERIES_INTRADAY';
                interval = this.mapAVInterval(timeframe);
                outputsize = 'full';
            }

            const baseUrl = 'https://www.alphavantage.co/query';
            let url = `${baseUrl}?function=${func}&symbol=${symbol}&apikey=${apiKey}&outputsize=${outputsize}`;
            
            if (interval) {
                url += `&interval=${interval}`;
            }

            const finalUrl = this.useCORSProxy ? this.corsProxy + encodeURIComponent(url) : url;
            const response = await fetch(finalUrl);
            const data = await response.json();

            // Check for API errors
            if (data['Error Message']) {
                console.error('Alpha Vantage error:', data['Error Message']);
                return null;
            }
            if (data['Note']) {
                console.warn('Alpha Vantage rate limit:', data['Note']);
                return null;
            }

            return this.parseAlphaVantageData(data, func);
        } catch (error) {
            console.error('Alpha Vantage fetch error:', error);
            return null;
        }
    }

    mapAVInterval(timeframe) {
        const mapping = {
            '1min': '1min',
            '5min': '5min',
            '15min': '15min',
            '30min': '30min',
            '60min': '60min'
        };
        return mapping[timeframe] || '5min';
    }

    parseAlphaVantageData(data, func) {
        let timeSeries;
        
        if (func === 'TIME_SERIES_DAILY') {
            timeSeries = data['Time Series (Daily)'];
        } else if (func === 'TIME_SERIES_WEEKLY') {
            timeSeries = data['Weekly Time Series'];
        } else {
            // Intraday data - find the time series key dynamically
            const keys = Object.keys(data);
            const timeSeriesKey = keys.find(k => k.includes('Time Series'));
            timeSeries = data[timeSeriesKey];
        }

        if (!timeSeries) return null;

        const result = [];
        for (const [timestamp, values] of Object.entries(timeSeries)) {
            result.push({
                timestamp: new Date(timestamp),
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                volume: parseInt(values['5. volume'])
            });
        }

        // Sort by timestamp (oldest first)
        return result.sort((a, b) => a.timestamp - b.timestamp);
    }

    // Finnhub API
    async fetchFinnhub(symbol, timeframe, apiKey) {
        try {
            const resolution = this.mapFinnhubResolution(timeframe);
            const to = Math.floor(Date.now() / 1000);
            const from = to - (this.getTimeframeSeconds(timeframe) * 1000); // Get last 1000 periods

            const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;

            const finalUrl = this.useCORSProxy ? this.corsProxy + encodeURIComponent(url) : url;
            const response = await fetch(finalUrl);
            const data = await response.json();

            if (data.s === 'no_data') {
                console.warn(`Finnhub: No data for ${symbol}`);
                return null;
            }

            return this.parseFinnhubData(data);
        } catch (error) {
            console.error('Finnhub fetch error:', error);
            return null;
        }
    }

    mapFinnhubResolution(timeframe) {
        const mapping = {
            '1min': '1',
            '5min': '5',
            '15min': '15',
            '30min': '30',
            '60min': '60',
            'daily': 'D',
            'weekly': 'W'
        };
        return mapping[timeframe] || '5';
    }

    getTimeframeSeconds(timeframe) {
        const mapping = {
            '1min': 60,
            '5min': 300,
            '15min': 900,
            '30min': 1800,
            '60min': 3600,
            'daily': 86400,
            'weekly': 604800
        };
        return mapping[timeframe] || 300;
    }

    parseFinnhubData(data) {
        const result = [];
        for (let i = 0; i < data.t.length; i++) {
            result.push({
                timestamp: new Date(data.t[i] * 1000),
                open: data.o[i],
                high: data.h[i],
                low: data.l[i],
                close: data.c[i],
                volume: data.v[i]
            });
        }
        return result;
    }

    // Twelve Data API
    async fetchTwelveData(symbol, timeframe, apiKey) {
        try {
            const interval = this.mapTwelveDataInterval(timeframe);
            const outputsize = 1000;

            const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`;

            const finalUrl = this.useCORSProxy ? this.corsProxy + encodeURIComponent(url) : url;
            const response = await fetch(finalUrl);
            const data = await response.json();

            if (data.status === 'error') {
                console.error('Twelve Data error:', data.message);
                return null;
            }

            return this.parseTwelveDataData(data);
        } catch (error) {
            console.error('Twelve Data fetch error:', error);
            return null;
        }
    }

    mapTwelveDataInterval(timeframe) {
        const mapping = {
            '1min': '1min',
            '5min': '5min',
            '15min': '15min',
            '30min': '30min',
            '60min': '1h',
            'daily': '1day',
            'weekly': '1week'
        };
        return mapping[timeframe] || '5min';
    }

    parseTwelveDataData(data) {
        if (!data.values) return null;

        const result = [];
        for (const bar of data.values) {
            result.push({
                timestamp: new Date(bar.datetime),
                open: parseFloat(bar.open),
                high: parseFloat(bar.high),
                low: parseFloat(bar.low),
                close: parseFloat(bar.close),
                volume: parseInt(bar.volume)
            });
        }

        // Sort by timestamp (oldest first)
        return result.sort((a, b) => a.timestamp - b.timestamp);
    }

    // Polygon.io API
    async fetchPolygon(symbol, timeframe, apiKey) {
        try {
            const { multiplier, timespan } = this.mapPolygonTimeframe(timeframe);
            const to = new Date().toISOString().split('T')[0];
            const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${apiKey}`;

            const finalUrl = this.useCORSProxy ? this.corsProxy + encodeURIComponent(url) : url;
            const response = await fetch(finalUrl);
            const data = await response.json();

            if (data.status !== 'OK' || !data.results) {
                console.warn(`Polygon: No data for ${symbol}`);
                return null;
            }

            return this.parsePolygonData(data);
        } catch (error) {
            console.error('Polygon fetch error:', error);
            return null;
        }
    }

    mapPolygonTimeframe(timeframe) {
        const mapping = {
            '1min': { multiplier: 1, timespan: 'minute' },
            '5min': { multiplier: 5, timespan: 'minute' },
            '15min': { multiplier: 15, timespan: 'minute' },
            '30min': { multiplier: 30, timespan: 'minute' },
            '60min': { multiplier: 1, timespan: 'hour' },
            'daily': { multiplier: 1, timespan: 'day' },
            'weekly': { multiplier: 1, timespan: 'week' }
        };
        return mapping[timeframe] || { multiplier: 5, timespan: 'minute' };
    }

    parsePolygonData(data) {
        const result = [];
        for (const bar of data.results) {
            result.push({
                timestamp: new Date(bar.t),
                open: bar.o,
                high: bar.h,
                low: bar.l,
                close: bar.c,
                volume: bar.v
            });
        }
        return result;
    }

    // Financial Modeling Prep API
    async fetchFMP(symbol, timeframe, apiKey) {
        try {
            let url;

            if (timeframe === 'daily') {
                url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${apiKey}`;
            } else if (timeframe === 'weekly') {
                // FMP doesn't have direct weekly, use daily and aggregate
                url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?apikey=${apiKey}`;
            } else {
                // Intraday data
                const interval = this.mapFMPInterval(timeframe);
                url = `https://financialmodelingprep.com/api/v3/historical-chart/${interval}/${symbol}?apikey=${apiKey}`;
            }

            const finalUrl = this.useCORSProxy ? this.corsProxy + encodeURIComponent(url) : url;
            const response = await fetch(finalUrl);
            const data = await response.json();

            if (data['Error Message'] || (Array.isArray(data) && data.length === 0)) {
                console.warn(`FMP: No data for ${symbol}`);
                return null;
            }

            return this.parseFMPData(data, timeframe);
        } catch (error) {
            console.error('FMP fetch error:', error);
            return null;
        }
    }

    mapFMPInterval(timeframe) {
        const mapping = {
            '1min': '1min',
            '5min': '5min',
            '15min': '15min',
            '30min': '30min',
            '60min': '1hour'
        };
        return mapping[timeframe] || '5min';
    }

    parseFMPData(data, timeframe) {
        const result = [];
        let dataArray;

        if (timeframe === 'daily' || timeframe === 'weekly') {
            dataArray = data.historical || [];
        } else {
            dataArray = Array.isArray(data) ? data : [];
        }

        for (const bar of dataArray) {
            result.push({
                timestamp: new Date(bar.date),
                open: parseFloat(bar.open),
                high: parseFloat(bar.high),
                low: parseFloat(bar.low),
                close: parseFloat(bar.close),
                volume: parseInt(bar.volume || 0)
            });
        }

        // Sort by timestamp (oldest first)
        return result.sort((a, b) => a.timestamp - b.timestamp);
    }

    calculateSMAs(data, periods) {
        const closes = data.map(d => d.close);
        const smas = {};
        
        for (const period of periods) {
            smas[period] = this.calculateSMA(closes, period);
        }
        
        return smas;
    }

    calculateSMA(prices, period) {
        if (prices.length < period) return null;
        
        const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }

    detectSignals(smaValues, scan, data) {
        const signals = [];
        const outfit = scan.outfit;
        
        if (!data || data.length < 2) return signals;
        
        const currentPrice = data[data.length - 1].close;
        const previousPrice = data[data.length - 2].close;
        
        // Check for crossovers between different SMAs
        if (outfit.length >= 2) {
            // Check short vs medium (if available)
            if (outfit.length >= 2) {
                const shortSMA = smaValues[outfit[0]];
                const mediumSMA = smaValues[outfit[1]];
                
                if (shortSMA && mediumSMA) {
                    // Golden Cross (bullish) - check if it just happened
                    const crossoverThreshold = 0.001; // 0.1% threshold
                    if (Math.abs(shortSMA - mediumSMA) / mediumSMA < crossoverThreshold) {
                        if (shortSMA > mediumSMA) {
                            signals.push({
                                timestamp: new Date(),
                                symbol: scan.symbol,
                                type: 'crossover',
                                outfit: outfit.join('/'),
                                timeframe: scan.timeframe,
                                price: currentPrice,
                                details: `Golden Cross: SMA ${outfit[0]} crossed above SMA ${outfit[1]}`
                            });
                        } else {
                            signals.push({
                                timestamp: new Date(),
                                symbol: scan.symbol,
                                type: 'crossover',
                                outfit: outfit.join('/'),
                                timeframe: scan.timeframe,
                                price: currentPrice,
                                details: `Death Cross: SMA ${outfit[0]} crossed below SMA ${outfit[1]}`
                            });
                        }
                    }
                }
            }
            
            // Check short vs long
            const shortSMA = smaValues[outfit[0]];
            const longSMA = smaValues[outfit[outfit.length - 1]];
            
            if (shortSMA && longSMA) {
                const divergence = (shortSMA - longSMA) / longSMA;
                
                // Strong bullish signal
                if (divergence > 0.05) { // 5% above
                    signals.push({
                        timestamp: new Date(),
                        symbol: scan.symbol,
                        type: 'buy',
                        outfit: outfit.join('/'),
                        timeframe: scan.timeframe,
                        price: currentPrice,
                        details: `Strong bullish: SMA ${outfit[0]} is ${(divergence * 100).toFixed(2)}% above SMA ${outfit[outfit.length - 1]}`
                    });
                }
                
                // Strong bearish signal
                if (divergence < -0.05) { // 5% below
                    signals.push({
                        timestamp: new Date(),
                        symbol: scan.symbol,
                        type: 'sell',
                        outfit: outfit.join('/'),
                        timeframe: scan.timeframe,
                        price: currentPrice,
                        details: `Strong bearish: SMA ${outfit[0]} is ${(Math.abs(divergence) * 100).toFixed(2)}% below SMA ${outfit[outfit.length - 1]}`
                    });
                }
            }
        }
        
        // Check price interaction with each SMA
        for (let i = 0; i < outfit.length; i++) {
            const sma = smaValues[outfit[i]];
            if (!sma) continue;
            
            const priceToSMA = (currentPrice - sma) / sma;
            const prevPriceToSMA = (previousPrice - sma) / sma;
            
            // Price just crossed above SMA (support bounce)
            if (prevPriceToSMA < 0 && priceToSMA > 0) {
                signals.push({
                    timestamp: new Date(),
                    symbol: scan.symbol,
                    type: 'buy',
                    outfit: outfit.join('/'),
                    timeframe: scan.timeframe,
                    price: currentPrice,
                    details: `Price bounced off SMA ${outfit[i]} support at $${sma.toFixed(2)}`
                });
            }
            
            // Price just crossed below SMA (resistance rejection)
            if (prevPriceToSMA > 0 && priceToSMA < 0) {
                signals.push({
                    timestamp: new Date(),
                    symbol: scan.symbol,
                    type: 'sell',
                    outfit: outfit.join('/'),
                    timeframe: scan.timeframe,
                    price: currentPrice,
                    details: `Price rejected at SMA ${outfit[i]} resistance at $${sma.toFixed(2)}`
                });
            }
            
            // Price very close to SMA (within 0.5%)
            if (Math.abs(priceToSMA) < 0.005) {
                signals.push({
                    timestamp: new Date(),
                    symbol: scan.symbol,
                    type: 'crossover',
                    outfit: outfit.join('/'),
                    timeframe: scan.timeframe,
                    price: currentPrice,
                    details: `Price testing SMA ${outfit[i]} level at $${sma.toFixed(2)}`
                });
            }
        }
        
        return signals;
    }

    updateActiveScansDisplay() {
        const container = document.getElementById('active-scans-list');
        
        if (this.activeScans.length === 0) {
            container.innerHTML = '<p class="empty-state">No active scans. Configure your settings and click "Start Scanner".</p>';
            return;
        }

        // Group scans by symbol
        const grouped = {};
        this.activeScans.forEach(scan => {
            if (!grouped[scan.symbol]) {
                grouped[scan.symbol] = [];
            }
            grouped[scan.symbol].push(scan);
        });

        let html = '';
        for (const [symbol, scans] of Object.entries(grouped)) {
            const totalSignals = scans.reduce((sum, s) => sum + s.signals, 0);
            const lastScan = scans[0].lastScan ? scans[0].lastScan.toLocaleTimeString() : 'Not yet scanned';
            
            html += `
                <div class="scan-item">
                    <h4>
                        ${symbol}
                        <span class="status-badge">ACTIVE</span>
                    </h4>
                    <div class="scan-details">
                        <div class="scan-detail-item">
                            <strong>Configurations</strong>
                            <span>${scans.length}</span>
                        </div>
                        <div class="scan-detail-item">
                            <strong>Signals Detected</strong>
                            <span>${totalSignals}</span>
                        </div>
                        <div class="scan-detail-item">
                            <strong>Last Scan</strong>
                            <span>${lastScan}</span>
                        </div>
                        <div class="scan-detail-item">
                            <strong>Timeframes</strong>
                            <span>${[...new Set(scans.map(s => s.timeframe))].join(', ')}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    updateResultsDisplay() {
        // Update statistics
        const totalSignals = this.results.length;
        const buySignals = this.results.filter(r => r.type === 'buy').length;
        const sellSignals = this.results.filter(r => r.type === 'sell').length;
        const crossoverSignals = this.results.filter(r => r.type === 'crossover').length;

        document.getElementById('total-signals').textContent = totalSignals;
        document.getElementById('buy-signals').textContent = buySignals;
        document.getElementById('sell-signals').textContent = sellSignals;
        document.getElementById('crossover-signals').textContent = crossoverSignals;

        // Update stock filter dropdown
        const uniqueSymbols = [...new Set(this.results.map(r => r.symbol))];
        const stockFilter = document.getElementById('filter-stock');
        const currentValue = stockFilter.value;
        
        stockFilter.innerHTML = '<option value="all">All Stocks</option>';
        uniqueSymbols.forEach(symbol => {
            stockFilter.innerHTML += `<option value="${symbol}">${symbol}</option>`;
        });
        stockFilter.value = currentValue;

        // Update table
        this.filterResults();
    }

    filterResults() {
        const signalTypeFilter = document.getElementById('filter-signal-type').value;
        const stockFilter = document.getElementById('filter-stock').value;

        let filtered = this.results;

        if (signalTypeFilter !== 'all') {
            filtered = filtered.filter(r => r.type === signalTypeFilter);
        }

        if (stockFilter !== 'all') {
            filtered = filtered.filter(r => r.symbol === stockFilter);
        }

        // Sort by timestamp (most recent first)
        filtered.sort((a, b) => b.timestamp - a.timestamp);

        // Render table
        const tbody = document.getElementById('results-tbody');
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No signals match the current filters.</td></tr>';
            return;
        }

        let html = '';
        filtered.forEach(result => {
            html += `
                <tr>
                    <td>${result.timestamp.toLocaleString()}</td>
                    <td><strong>${result.symbol}</strong></td>
                    <td><span class="signal-badge ${result.type}">${result.type.toUpperCase()}</span></td>
                    <td>${result.outfit}</td>
                    <td>${result.timeframe}</td>
                    <td>$${result.price.toFixed(2)}</td>
                    <td>${result.details}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    }

    clearResults() {
        if (confirm('Are you sure you want to clear all results?')) {
            this.results = [];
            this.updateResultsDisplay();
            this.showNotification('info', 'Results Cleared', 'All signal results have been cleared.');
        }
    }

    showNotification(type, title, message) {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-exclamation-circle' : 
                     'fa-info-circle';
        
        notification.innerHTML = `
            <h4><i class="fas ${icon}"></i> ${title}</h4>
            <p>${message}</p>
        `;
        
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                container.removeChild(notification);
            }, 300);
        }, 5000);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.smaAnalyzer = new SMAAnalyzer();
    console.log('SMA Outfits Analyzer initialized successfully.');
});
