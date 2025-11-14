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
                useFreeKey: 'demo' // Alpha Vantage provides a demo key
            },
            finnhub: {
                name: 'Finnhub',
                baseUrl: 'https://finnhub.io/api/v1',
                rateLimit: 60,
                getApiKey: 'https://finnhub.io/register',
                useFreeKey: null
            },
            twelvedata: {
                name: 'Twelve Data',
                baseUrl: 'https://api.twelvedata.com',
                rateLimit: 8,
                getApiKey: 'https://twelvedata.com/register',
                useFreeKey: null
            },
            polygon: {
                name: 'Polygon.io',
                baseUrl: 'https://api.polygon.io',
                rateLimit: 5,
                getApiKey: 'https://polygon.io/dashboard/signup',
                useFreeKey: null
            },
            fmp: {
                name: 'Financial Modeling Prep',
                baseUrl: 'https://financialmodelingprep.com/api/v3',
                rateLimit: 250,
                getApiKey: 'https://financialmodelingprep.com/developer/docs/',
                useFreeKey: 'demo'
            }
        };

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
        const config = this.apiConfigs[this.apiProvider];
        
        if (this.apiProvider === 'custom' || !config.useFreeKey) {
            keySection.style.display = 'block';
        } else {
            keySection.style.display = 'none';
            // Use the free demo key if available
            if (config.useFreeKey) {
                this.apiKey = config.useFreeKey;
            }
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

        if (!this.apiKey && !this.apiConfigs[this.apiProvider]?.useFreeKey) {
            this.showNotification('error', 'No API Key', 'Please enter your API key first.');
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
            const signals = this.detectSignals(smaValues, scan);
            
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
        // Simulate fetching data - In production, this would call the actual API
        // For demo purposes, we'll generate mock data with realistic patterns
        
        try {
            // Map timeframe to appropriate interval
            const interval = this.mapTimeframeToInterval(timeframe);
            
            // For the demo, generate mock OHLC data
            const data = this.generateMockOHLC(symbol, 200); // Generate 200 periods
            
            return data;
            
        } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            return null;
        }
    }

    mapTimeframeToInterval(timeframe) {
        const mapping = {
            '1min': '1min',
            '5min': '5min',
            '15min': '15min',
            '30min': '30min',
            '60min': '60min',
            'daily': '1day',
            'weekly': '1week'
        };
        return mapping[timeframe] || '5min';
    }

    generateMockOHLC(symbol, periods) {
        const data = [];
        let price = 100 + Math.random() * 400; // Starting price between 100-500
        
        for (let i = 0; i < periods; i++) {
            const change = (Math.random() - 0.48) * 5; // Slight upward bias
            const open = price;
            const close = price + change;
            const high = Math.max(open, close) + Math.random() * 2;
            const low = Math.min(open, close) - Math.random() * 2;
            const volume = Math.floor(1000000 + Math.random() * 5000000);
            
            data.push({
                timestamp: new Date(Date.now() - (periods - i) * 300000), // 5 min intervals
                open,
                high,
                low,
                close,
                volume
            });
            
            price = close;
        }
        
        return data;
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

    detectSignals(smaValues, scan) {
        const signals = [];
        const outfit = scan.outfit;
        
        // Check for crossovers between different SMAs
        if (outfit.length >= 2) {
            const shortSMA = smaValues[outfit[0]];
            const longSMA = smaValues[outfit[outfit.length - 1]];
            
            if (shortSMA && longSMA) {
                // Golden Cross (bullish)
                if (shortSMA > longSMA * 1.001) { // Small threshold to avoid noise
                    signals.push({
                        timestamp: new Date(),
                        symbol: scan.symbol,
                        type: 'buy',
                        outfit: outfit.join('/'),
                        timeframe: scan.timeframe,
                        price: shortSMA,
                        details: `Short SMA (${outfit[0]}) crossed above Long SMA (${outfit[outfit.length - 1]})`
                    });
                }
                
                // Death Cross (bearish)
                if (shortSMA < longSMA * 0.999) {
                    signals.push({
                        timestamp: new Date(),
                        symbol: scan.symbol,
                        type: 'sell',
                        outfit: outfit.join('/'),
                        timeframe: scan.timeframe,
                        price: shortSMA,
                        details: `Short SMA (${outfit[0]}) crossed below Long SMA (${outfit[outfit.length - 1]})`
                    });
                }
            }
        }
        
        // Check for price relative to SMAs (support/resistance)
        for (let i = 0; i < outfit.length; i++) {
            const sma = smaValues[outfit[i]];
            if (sma) {
                // Random chance to generate signals for demo purposes
                if (Math.random() > 0.95) { // 5% chance per scan
                    const signalType = Math.random() > 0.5 ? 'buy' : 'sell';
                    signals.push({
                        timestamp: new Date(),
                        symbol: scan.symbol,
                        type: signalType,
                        outfit: outfit.join('/'),
                        timeframe: scan.timeframe,
                        price: sma,
                        details: `Price interaction with SMA ${outfit[i]}`
                    });
                }
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
