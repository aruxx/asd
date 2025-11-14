// Scanner Engine for SMA Outfit Analysis

class SMAScanner {
    constructor(apiHandler, smaOutfits, onSignalDetected, onError) {
        this.apiHandler = apiHandler;
        this.smaOutfits = smaOutfits;
        this.onSignalDetected = onSignalDetected;
        this.onError = onError;
        this.isScanning = false;
        this.activePrograms = new Map();
        this.scanResults = [];
        this.scanStats = {
            totalScans: 0,
            activeSignals: 0,
            lastUpdate: null
        };
    }

    async startScan(tickers, timeframes, enableNotifications = true) {
        if (this.isScanning) {
            console.warn('Scan already in progress');
            return;
        }

        this.isScanning = true;
        this.scanResults = [];
        this.scanStats.totalScans = 0;
        this.scanStats.activeSignals = 0;

        // Process each ticker
        for (const ticker of tickers) {
            if (!this.isScanning) break;

            // Process each timeframe
            for (const timeframe of timeframes) {
                if (!this.isScanning) break;

                // Process each SMA outfit
                for (const [outfitKey, outfit] of Object.entries(this.smaOutfits)) {
                    if (!this.isScanning) break;

                    const programId = `${ticker}-${timeframe}-${outfitKey}`;
                    
                    try {
                        await this.scanTickerOutfit(ticker, timeframe, outfitKey, outfit, programId, enableNotifications);
                        
                        // Rate limiting - be respectful to APIs
                        await this.delay(100); // 100ms delay between scans
                    } catch (error) {
                        console.error(`Error scanning ${programId}:`, error);
                        if (this.onError) {
                            this.onError(error, programId);
                        }
                    }
                }
            }
        }

        this.isScanning = false;
    }

    async scanTickerOutfit(ticker, timeframe, outfitKey, outfit, programId, enableNotifications) {
        try {
            // Get stock data
            const stockData = await this.apiHandler.getStockData(ticker, timeframe, this.timeframeToInterval(timeframe));
            
            if (!stockData || stockData.length === 0) {
                return;
            }

            // Extract closing prices
            const closes = stockData.map(d => d.close).filter(v => v !== null && !isNaN(v));
            
            if (closes.length < Math.max(...outfit.periods)) {
                // Not enough data for this outfit
                return;
            }

            // Calculate SMAs
            const smas = {};
            outfit.periods.forEach(period => {
                smas[period] = this.calculateSMA(closes, period);
            });

            // Detect signal
            const signal = this.detectSignal(smas, outfit);

            // Create result
            const result = {
                id: programId,
                ticker: ticker,
                timeframe: timeframe,
                outfit: outfitKey,
                outfitName: outfit.name,
                smas: smas,
                signal: signal,
                timestamp: Date.now(),
                price: closes[closes.length - 1],
                status: signal.type !== 'neutral' ? 'active' : 'inactive'
            };

            // Update active programs
            if (signal.type !== 'neutral') {
                this.activePrograms.set(programId, {
                    ...result,
                    startTime: Date.now(),
                    notificationsEnabled: enableNotifications
                });

                // Notify if enabled
                if (enableNotifications && this.onSignalDetected) {
                    this.onSignalDetected(result);
                }
            } else {
                this.activePrograms.delete(programId);
            }

            // Store result
            this.scanResults.push(result);
            this.scanStats.totalScans++;
            if (signal.type !== 'neutral') {
                this.scanStats.activeSignals++;
            }
            this.scanStats.lastUpdate = new Date().toISOString();

        } catch (error) {
            console.error(`Error in scanTickerOutfit for ${programId}:`, error);
            throw error;
        }
    }

    calculateSMA(prices, period) {
        if (prices.length < period) {
            return null;
        }
        const slice = prices.slice(-period);
        const sum = slice.reduce((a, b) => a + b, 0);
        return sum / period;
    }

    detectSignal(smas, outfit) {
        if (!smas || Object.keys(smas).length < 2) {
            return { type: 'neutral', message: 'Insufficient data' };
        }

        const periods = outfit.periods.sort((a, b) => a - b);
        
        // Check for crossover signals
        if (periods.length >= 2) {
            const shortPeriod = periods[0];
            const longPeriod = periods[1];
            
            if (smas[shortPeriod] !== null && smas[longPeriod] !== null) {
                // Golden Cross: Short MA crosses above Long MA
                if (smas[shortPeriod] > smas[longPeriod]) {
                    return { 
                        type: 'buy', 
                        message: `Golden Cross: MA${shortPeriod} > MA${longPeriod}`,
                        strength: this.calculateSignalStrength(smas, periods, 'buy')
                    };
                }
                // Death Cross: Short MA crosses below Long MA
                else if (smas[shortPeriod] < smas[longPeriod]) {
                    return { 
                        type: 'sell', 
                        message: `Death Cross: MA${shortPeriod} < MA${longPeriod}`,
                        strength: this.calculateSignalStrength(smas, periods, 'sell')
                    };
                }
            }
        }

        // Check for multi-SMA alignment
        if (periods.length >= 3) {
            const sorted = periods.map(p => smas[p]).filter(v => v !== null);
            if (sorted.length === periods.length) {
                const isAscending = sorted.every((val, idx) => idx === 0 || val >= sorted[idx - 1]);
                const isDescending = sorted.every((val, idx) => idx === 0 || val <= sorted[idx - 1]);
                
                if (isAscending) {
                    return { 
                        type: 'buy', 
                        message: 'All SMAs in ascending order (Bullish)',
                        strength: 'strong'
                    };
                }
                if (isDescending) {
                    return { 
                        type: 'sell', 
                        message: 'All SMAs in descending order (Bearish)',
                        strength: 'strong'
                    };
                }
            }
        }

        return { type: 'neutral', message: 'No significant signal', strength: 'none' };
    }

    calculateSignalStrength(smas, periods, type) {
        if (periods.length < 2) return 'weak';
        
        const short = smas[periods[0]];
        const long = smas[periods[1]];
        
        if (!short || !long) return 'weak';
        
        const diff = Math.abs(short - long);
        const percentDiff = (diff / long) * 100;
        
        if (percentDiff > 5) return 'strong';
        if (percentDiff > 2) return 'medium';
        return 'weak';
    }

    timeframeToInterval(timeframe) {
        // Convert timeframe to API interval format
        if (timeframe === '1d') return '1d';
        return timeframe;
    }

    stopScan() {
        this.isScanning = false;
    }

    getActivePrograms() {
        return Array.from(this.activePrograms.values());
    }

    getResults() {
        return this.scanResults;
    }

    getStats() {
        return { ...this.scanStats };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clearResults() {
        this.scanResults = [];
        this.activePrograms.clear();
        this.scanStats = {
            totalScans: 0,
            activeSignals: 0,
            lastUpdate: null
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SMAScanner;
}
