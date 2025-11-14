// SMA Outfits Configuration
// Based on the comprehensive documentation provided

const SMA_OUTFITS = {
    '10/50/200': {
        name: 'S&P 500 System',
        description: 'Proprietary to SPX, applied to 30-minute chart',
        periods: [10, 50, 200],
        primaryIndex: 'SPX'
    },
    '20/100/250': {
        name: 'NASDAQ System',
        description: 'Proprietary to IXIC, applied to 20/30-minute charts',
        periods: [20, 100, 250],
        primaryIndex: 'IXIC'
    },
    '30/60/90/300/600/900': {
        name: 'Dow Jones Industrial System',
        description: 'Proprietary to DJI, applied to 15-minute and 1-hour charts',
        periods: [30, 60, 90, 300, 600, 900],
        primaryIndex: 'DJI'
    },
    '33/66/99/333/666/999': {
        name: 'AN System',
        description: 'Advanced numerical system',
        periods: [33, 66, 99, 333, 666, 999]
    },
    '11/44/88/111/444/888': {
        name: 'AN System 2',
        description: 'Advanced numerical system variant',
        periods: [11, 44, 88, 111, 444, 888]
    },
    '22/55/77/222/555/777': {
        name: 'AN System 3',
        description: 'Advanced numerical system variant',
        periods: [22, 55, 77, 222, 555, 777]
    },
    '19/37/73/143/279/548': {
        name: "Waring's Problem",
        description: 'Based on Waring\'s Problem integers',
        periods: [19, 37, 73, 143, 279, 548]
    },
    '16/32/64/128/256/512': {
        name: 'Base 2 / NVDA',
        description: 'Binary progression system',
        periods: [16, 32, 64, 128, 256, 512]
    },
    '27/53/105/210/420/840': {
        name: 'TSLA System (420)',
        description: 'Tesla-specific configuration',
        periods: [27, 53, 105, 210, 420, 840]
    },
    '23/46/91/183/365/730': {
        name: 'Time System (365)',
        description: 'Calendar-based system',
        periods: [23, 46, 91, 183, 365, 730]
    },
    '23/46/92/183/366/732': {
        name: 'Time System (366)',
        description: 'Leap year calendar system',
        periods: [23, 46, 92, 183, 366, 732]
    },
    '18/36/72/144/288/576': {
        name: 'Time System (144)',
        description: '144-based progression',
        periods: [18, 36, 72, 144, 288, 576]
    },
    '25/51/101/202/404/808': {
        name: 'Resource System (404)',
        description: '404-based progression',
        periods: [25, 51, 101, 202, 404, 808]
    },
    '29/57/114/227/455/911': {
        name: 'U.S. President Seat (45)',
        description: 'Presidential reference system',
        periods: [29, 57, 114, 227, 455, 911]
    },
    '23/46/92/184/368/736': {
        name: 'U.S. President Seat (46)',
        description: 'Presidential reference system',
        periods: [23, 46, 92, 184, 368, 736]
    },
    '24/47/94/188/376/752': {
        name: 'U.S. President Seat (47)',
        description: 'Presidential reference system',
        periods: [24, 47, 94, 188, 376, 752]
    },
    '28/56/112/224/448/896': {
        name: 'Speaker of the House (56)',
        description: 'Congressional reference system',
        periods: [28, 56, 112, 224, 448, 896]
    },
    '28/57/114/228/456/911': {
        name: 'World Trade Center Homage (911)',
        description: 'Memorial reference system',
        periods: [28, 57, 114, 228, 456, 911]
    },
    '16/31/63/125/250/500': {
        name: 'Russia President 2000',
        description: 'Year 2000 reference',
        periods: [16, 31, 63, 125, 250, 500]
    },
    '28/56/112/224/448/976': {
        name: 'China Chair (7)',
        description: 'Chinese reference system',
        periods: [28, 56, 112, 224, 448, 976]
    },
    '25/50/100/200/400/600': {
        name: 'France President (25)',
        description: 'French reference system',
        periods: [25, 50, 100, 200, 400, 600]
    },
    '26/52/106/211/422/844': {
        name: 'SVIX System',
        description: 'SVIX-specific configuration',
        periods: [26, 52, 106, 211, 422, 844]
    },
    '24/48/96/192/384/768': {
        name: 'Türkiye President (12)',
        description: 'Turkish reference system',
        periods: [24, 48, 96, 192, 384, 768]
    },
    '25/50/100/200/400/800': {
        name: 'Alphabet Inc (100)',
        description: 'Alphabet-specific system',
        periods: [25, 50, 100, 200, 400, 800]
    },
    '27/54/108/216/432/864': {
        name: 'Regression System (432)',
        description: 'Regression-based progression',
        periods: [27, 54, 108, 216, 432, 864]
    }
};

const TIMEFRAMES = {
    '1T': { label: '1 Tick', seconds: 0 },
    '1S': { label: '1 Second', seconds: 1 },
    '5S': { label: '5 Seconds', seconds: 5 },
    '15S': { label: '15 Seconds', seconds: 15 },
    '30S': { label: '30 Seconds', seconds: 30 },
    '1m': { label: '1 Minute', seconds: 60 },
    '2m': { label: '2 Minutes', seconds: 120 },
    '3m': { label: '3 Minutes', seconds: 180 },
    '5m': { label: '5 Minutes', seconds: 300 },
    '10m': { label: '10 Minutes', seconds: 600 },
    '15m': { label: '15 Minutes', seconds: 900 },
    '20m': { label: '20 Minutes', seconds: 1200 },
    '30m': { label: '30 Minutes', seconds: 1800 },
    '1h': { label: '1 Hour', seconds: 3600 },
    '2h': { label: '2 Hours', seconds: 7200 },
    '4h': { label: '4 Hours', seconds: 14400 },
    '1d': { label: 'Daily', seconds: 86400 },
    '1W': { label: 'Weekly', seconds: 604800 },
    '1M': { label: 'Monthly', seconds: 2592000 },
    '1Q': { label: 'Quarterly', seconds: 7776000 }
};

// Default ticker list from documentation
const DEFAULT_TICKERS = [
    'SPX', 'SPY', 'IXIC', 'QQQ', 'DJI', 'DIA', 'UPRO', 'TQQQ', 'SQQQ',
    'WEBS', 'UDOW', 'SDOW', 'VIX', 'VXX', 'SVIX', 'UVXY', 'SVXY',
    'SOXS', 'SOXL', 'UWM', 'IWM', 'AAPL', 'MSFT', 'AMZN', 'GOOG',
    'NVDA', 'META', 'TSLA', 'AMD', 'NFLX', 'INTC', 'COIN', 'QCOM',
    'PYPL', 'UPST', 'RBLX', 'AI', 'ARM', 'BRK-B', 'GM', 'JPM',
    'V', 'UNH', 'ENPH', 'BTCUSD', 'ETHUSD', 'BITO', 'HSI', 'DAX',
    'BABA', 'TSM'
];

// SMA Calculation Functions
function calculateSMA(prices, period) {
    if (prices.length < period) {
        return null;
    }
    const slice = prices.slice(-period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / period;
}

function calculateSMAsForOutfit(prices, outfit) {
    const smas = {};
    outfit.periods.forEach(period => {
        smas[period] = calculateSMA(prices, period);
    });
    return smas;
}

function detectSignal(smas, outfit) {
    if (!smas || Object.keys(smas).length < 2) {
        return { type: 'neutral', message: 'Insufficient data' };
    }

    const periods = outfit.periods.sort((a, b) => a - b);
    
    // Check for crossover signals
    if (periods.length >= 2) {
        const shortPeriod = periods[0];
        const longPeriod = periods[1];
        
        if (smas[shortPeriod] && smas[longPeriod]) {
            // Golden Cross: Short MA crosses above Long MA
            if (smas[shortPeriod] > smas[longPeriod]) {
                return { type: 'buy', message: `Golden Cross: MA${shortPeriod} > MA${longPeriod}` };
            }
            // Death Cross: Short MA crosses below Long MA
            else if (smas[shortPeriod] < smas[longPeriod]) {
                return { type: 'sell', message: `Death Cross: MA${shortPeriod} < MA${longPeriod}` };
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
                return { type: 'buy', message: 'All SMAs in ascending order (Bullish)' };
            }
            if (isDescending) {
                return { type: 'sell', message: 'All SMAs in descending order (Bearish)' };
            }
        }
    }

    return { type: 'neutral', message: 'No significant signal' };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SMA_OUTFITS,
        TIMEFRAMES,
        DEFAULT_TICKERS,
        calculateSMA,
        calculateSMAsForOutfit,
        detectSignal
    };
}
