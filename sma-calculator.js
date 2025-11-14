// SMA Outfit Calculator
// Implements all SMA outfit configurations and signal detection

const SMA_OUTFITS = {
    '10/50/200': {
        name: 'S&P 500 System',
        periods: [10, 50, 200],
        description: 'The System - SPX 30M'
    },
    '20/100/250': {
        name: 'NASDAQ System',
        periods: [20, 100, 250],
        description: 'IXIC 20M/30M'
    },
    '30/60/90/300/600/900': {
        name: 'Dow Jones System',
        periods: [30, 60, 90, 300, 600, 900],
        description: 'DJI 15M/1H'
    },
    '33/66/99/333/666/999': {
        name: 'AN System',
        periods: [33, 66, 99, 333, 666, 999],
        description: 'AN Configuration'
    },
    '11/44/88/111/444/888': {
        name: 'AN System',
        periods: [11, 44, 88, 111, 444, 888],
        description: 'AN Configuration'
    },
    '22/55/77/222/555/777': {
        name: 'AN System',
        periods: [22, 55, 77, 222, 555, 777],
        description: 'AN Configuration'
    },
    '19/37/73/143/279/548': {
        name: "Waring's Problem",
        periods: [19, 37, 73, 143, 279, 548],
        description: "Waring's Problem Configuration"
    },
    '16/32/64/128/256/512': {
        name: 'Base 2/NVDA',
        periods: [16, 32, 64, 128, 256, 512],
        description: 'Base 2 Configuration'
    },
    '27/53/105/210/420/840': {
        name: 'TSLA System',
        periods: [27, 53, 105, 210, 420, 840],
        description: 'TSLA Configuration (420)'
    },
    '23/46/91/183/365/730': {
        name: 'Time System',
        periods: [23, 46, 91, 183, 365, 730],
        description: 'Time Configuration (365)'
    }
};

// Calculate Simple Moving Average
function calculateSMA(data, period) {
    if (data.length < period) {
        return null;
    }
    
    const closes = data.slice(-period).map(d => d.close);
    const sum = closes.reduce((a, b) => a + b, 0);
    return sum / period;
}

// Calculate all SMAs for an outfit
function calculateSMAOutfit(data, outfitKey) {
    const outfit = SMA_OUTFITS[outfitKey];
    if (!outfit) {
        return null;
    }

    const smas = {};
    for (const period of outfit.periods) {
        smas[period] = calculateSMA(data, period);
    }
    return smas;
}

// Detect SMA signals (crossover, position relative to price)
function detectSMASignals(data, outfitKey) {
    if (data.length < 2) {
        return null;
    }

    const outfit = SMA_OUTFITS[outfitKey];
    if (!outfit) {
        return null;
    }

    const currentPrice = data[data.length - 1].close;
    const previousPrice = data[data.length - 2].close;
    const smas = calculateSMAOutfit(data, outfitKey);
    
    if (!smas) {
        return null;
    }

    const signals = {
        outfit: outfitKey,
        outfitName: outfit.name,
        currentPrice: currentPrice,
        smas: smas,
        signals: []
    };

    // Detect crossovers and price position relative to SMAs
    const periods = outfit.periods.sort((a, b) => a - b);
    
    // Check for golden cross (short-term SMA crosses above long-term SMA)
    if (periods.length >= 2) {
        const shortSMA = smas[periods[0]];
        const longSMA = smas[periods[1]];
        
        if (shortSMA !== null && longSMA !== null) {
            // Calculate previous SMAs for crossover detection
            const prevShortSMA = calculateSMA(data.slice(0, -1), periods[0]);
            const prevLongSMA = calculateSMA(data.slice(0, -1), periods[1]);
            
            if (prevShortSMA !== null && prevLongSMA !== null) {
                // Golden Cross
                if (prevShortSMA <= prevLongSMA && shortSMA > longSMA) {
                    signals.signals.push({
                        type: 'GOLDEN_CROSS',
                        message: `Golden Cross: ${periods[0]}-period SMA crossed above ${periods[1]}-period SMA`,
                        strength: 'STRONG_BUY'
                    });
                }
                // Death Cross
                if (prevShortSMA >= prevLongSMA && shortSMA < longSMA) {
                    signals.signals.push({
                        type: 'DEATH_CROSS',
                        message: `Death Cross: ${periods[0]}-period SMA crossed below ${periods[1]}-period SMA`,
                        strength: 'STRONG_SELL'
                    });
                }
            }
        }
    }

    // Check price position relative to SMAs
    for (let i = 0; i < periods.length; i++) {
        const sma = smas[periods[i]];
        if (sma !== null) {
            const position = currentPrice > sma ? 'ABOVE' : 'BELOW';
            const distance = Math.abs((currentPrice - sma) / sma) * 100;
            
            if (distance > 0.1) { // Only signal if price is significantly away from SMA
                signals.signals.push({
                    type: 'PRICE_POSITION',
                    period: periods[i],
                    position: position,
                    distance: distance.toFixed(2),
                    message: `Price is ${position.toLowerCase()} ${periods[i]}-period SMA by ${distance.toFixed(2)}%`
                });
            }
        }
    }

    // Check for specific system signals (S&P, NASDAQ, DJI)
    if (outfitKey === '10/50/200') {
        const ma10 = smas[10];
        const ma50 = smas[50];
        if (ma10 !== null && ma50 !== null) {
            const isPositive = ma10 > ma50;
            signals.signals.push({
                type: 'SYSTEM_SIGNAL',
                system: 'S&P_500',
                signal: isPositive ? 'POSITIVE' : 'NEGATIVE',
                message: `S&P 500 System: ${isPositive ? 'POSITIVE' : 'NEGATIVE'} (MA10 ${isPositive ? '>' : '<'} MA50)`
            });
        }
    }

    if (outfitKey === '20/100/250') {
        const ma20 = smas[20];
        const ma100 = smas[100];
        if (ma20 !== null && ma100 !== null) {
            const isPositive = ma20 > ma100;
            signals.signals.push({
                type: 'SYSTEM_SIGNAL',
                system: 'NASDAQ',
                signal: isPositive ? 'POSITIVE' : 'NEGATIVE',
                message: `NASDAQ System: ${isPositive ? 'POSITIVE' : 'NEGATIVE'} (MA20 ${isPositive ? '>' : '<'} MA100)`
            });
        }
    }

    if (outfitKey === '30/60/90/300/600/900') {
        const ma90 = smas[90];
        const ma300 = smas[300];
        if (ma90 !== null && ma300 !== null) {
            const isPositive = ma90 > ma300;
            signals.signals.push({
                type: 'SYSTEM_SIGNAL',
                system: 'DOW_JONES',
                signal: isPositive ? 'POSITIVE' : 'NEGATIVE',
                message: `Dow Jones System: ${isPositive ? 'POSITIVE' : 'NEGATIVE'} (MA90 ${isPositive ? '>' : '<'} MA300)`
            });
        }
    }

    return signals;
}

// Analyze stock with all selected outfits and timeframes
// Note: fetchStockData is defined in api-config.js and must be loaded before this file
async function analyzeStock(symbol, timeframes, outfitKeys, apiKey = null) {
    const results = [];
    
    for (const timeframe of timeframes) {
        try {
            // Use fetchStockData from api-config.js
            if (typeof fetchStockData === 'undefined') {
                throw new Error('fetchStockData function not available. Make sure api-config.js is loaded.');
            }
            
            const data = await fetchStockData(symbol, timeframe, apiKey);
            if (data.length === 0) {
                continue;
            }

            for (const outfitKey of outfitKeys) {
                const signals = detectSMASignals(data, outfitKey);
                if (signals && signals.signals.length > 0) {
                    results.push({
                        symbol: symbol,
                        timeframe: timeframe,
                        signals: signals
                    });
                }
            }
        } catch (error) {
            console.error(`Error analyzing ${symbol} on ${timeframe}:`, error);
        }
    }
    
    return results;
}
