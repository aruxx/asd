export const SMA_OUTFITS = [
  { id: 'spx-core', label: '10/50/200 · S&P 500 System', periods: [10, 50, 200], tags: ['SPX', 'system'] },
  { id: 'nasdaq-core', label: '20/100/250 · NASDAQ System', periods: [20, 100, 250], tags: ['IXIC'] },
  { id: 'dji-stack', label: '30/60/90/300/600/900 · DJI Stack', periods: [30, 60, 90, 300, 600, 900], tags: ['DJI'] },
  { id: 'harmonic-three', label: '33/66/99/333/666/999 · Harmonic Three', periods: [33, 66, 99, 333, 666, 999], tags: ['AN'] },
  { id: 'waring', label: '19/37/73/143/279/548 · Waring Integers', periods: [19, 37, 73, 143, 279, 548], tags: ['Waring'] },
  { id: 'binary', label: '16/32/64/128/256/512 · Base-2 Lattice', periods: [16, 32, 64, 128, 256, 512], tags: ['NVDA'] },
  { id: 'tsla-resonance', label: '27/53/105/210/420/840 · TSLA Resonance', periods: [27, 53, 105, 210, 420, 840], tags: ['TSLA'] },
  { id: 'calendar-365', label: '23/46/91/183/365/730 · Calendar Year', periods: [23, 46, 91, 183, 365, 730], tags: ['Time'] },
  { id: 'calendar-366', label: '23/46/92/183/366/732 · Leap Year', periods: [23, 46, 92, 183, 366, 732], tags: ['Time'] },
  { id: 'time-144', label: '18/36/72/144/288/576 · Time 144', periods: [18, 36, 72, 144, 288, 576], tags: ['Time'] },
  { id: 'resilience', label: '25/51/101/202/404/808 · Resilience Stack', periods: [25, 51, 101, 202, 404, 808], tags: ['Recovery'] },
  { id: 'civic-29', label: '29/57/114/227/455/911 · Civic 29', periods: [29, 57, 114, 227, 455, 911], tags: ['Civic'] },
  { id: 'civic-24', label: '24/47/94/188/376/752 · Civic 24', periods: [24, 47, 94, 188, 376, 752], tags: ['Civic'] },
  { id: 'house-seat', label: '28/56/112/224/448/896 · House Seat', periods: [28, 56, 112, 224, 448, 896], tags: ['Civic'] },
  { id: 'wtc', label: '28/57/114/228/456/911 · WTC Homage', periods: [28, 57, 114, 228, 456, 911], tags: ['Homage'] },
  { id: 'russia-2000', label: '16/31/63/125/250/500 · Russia 2000', periods: [16, 31, 63, 125, 250, 500], tags: ['Geo'] },
  { id: 'prc-chair', label: '28/56/112/224/448/976 · PRC Chair', periods: [28, 56, 112, 224, 448, 976], tags: ['Geo'] },
  { id: 'france', label: '25/50/100/200/400/600 · France Presidency', periods: [25, 50, 100, 200, 400, 600], tags: ['Geo'] },
  { id: 'svix', label: '26/52/106/211/422/844 · SVIX Alignment', periods: [26, 52, 106, 211, 422, 844], tags: ['Volatility'] },
  { id: 'turkiye', label: '24/48/96/192/384/768 · Türkiye Seat', periods: [24, 48, 96, 192, 384, 768], tags: ['Geo'] },
  { id: 'alphabet', label: '25/50/100/200/400/800 · Alphabet Inc.', periods: [25, 50, 100, 200, 400, 800], tags: ['Mega Cap'] },
  { id: 'regression', label: '27/54/108/216/432/864 · Regression Core', periods: [27, 54, 108, 216, 432, 864], tags: ['Research'] }
];

export const TIMEFRAMES = [
  { id: 'tick', label: '1 Tick', durationSeconds: 0.25, category: 'Ultra Short', synthetic: true, baseInterval: '1s' },
  { id: '1s', label: '1 Second', durationSeconds: 1, category: 'Ultra Short', synthetic: true, baseInterval: '1m' },
  { id: '5s', label: '5 Seconds', durationSeconds: 5, category: 'Ultra Short', synthetic: true, baseInterval: '1m' },
  { id: '15s', label: '15 Seconds', durationSeconds: 15, category: 'Ultra Short', synthetic: true, baseInterval: '1m' },
  { id: '30s', label: '30 Seconds', durationSeconds: 30, category: 'Ultra Short', synthetic: true, baseInterval: '1m' },
  { id: '1m', label: '1 Minute', durationSeconds: 60, category: 'Intraday' },
  { id: '2m', label: '2 Minutes', durationSeconds: 120, category: 'Intraday', synthetic: true, baseInterval: '1m' },
  { id: '3m', label: '3 Minutes', durationSeconds: 180, category: 'Intraday', synthetic: true, baseInterval: '1m' },
  { id: '5m', label: '5 Minutes', durationSeconds: 300, category: 'Intraday' },
  { id: '10m', label: '10 Minutes', durationSeconds: 600, category: 'Intraday', synthetic: true, baseInterval: '5m' },
  { id: '15m', label: '15 Minutes', durationSeconds: 900, category: 'Intraday' },
  { id: '20m', label: '20 Minutes', durationSeconds: 1200, category: 'Intraday', synthetic: true, baseInterval: '5m' },
  { id: '30m', label: '30 Minutes', durationSeconds: 1800, category: 'Intraday' },
  { id: '1h', label: '1 Hour', durationSeconds: 3600, category: 'Intraday' },
  { id: '2h', label: '2 Hours', durationSeconds: 7200, category: 'Intraday', synthetic: true, baseInterval: '1h' },
  { id: '4h', label: '4 Hours', durationSeconds: 14400, category: 'Intraday', synthetic: true, baseInterval: '1h' },
  { id: '1d', label: '1 Day', durationSeconds: 86400, category: 'Swing' },
  { id: '1w', label: '1 Week', durationSeconds: 604800, category: 'Swing', synthetic: true, baseInterval: '1d' },
  { id: '1M', label: '1 Month', durationSeconds: 2628000, category: 'Macro', synthetic: true, baseInterval: '1d' },
  { id: '1Q', label: '1 Quarter', durationSeconds: 7884000, category: 'Macro', synthetic: true, baseInterval: '1M' }
];

export const DEFAULT_TICKERS = [
  'SPX', 'SPY', 'IXIC', 'QQQ', 'DJI', 'DIA', 'VIX', 'SVIX', 'UVXY', 'SOXL', 'SOXS', 'IWM', 'AAPL', 'MSFT', 'AMZN', 'GOOG', 'META', 'NVDA', 'TSLA', 'AMD', 'JPM', 'V', 'UNH', 'GLD', 'USO', 'TLT', 'BTCUSD', 'ETHUSD'
];

export const PROVIDER_METADATA = [
  {
    id: 'alphaVantage',
    name: 'Alpha Vantage',
    type: 'free-tier',
    url: 'https://www.alphavantage.co',
    defaultKey: 'demo',
    notes: 'Free tier with demo key. 5 requests/min and 500/day.',
    supports: ['intraday', 'swing'],
    requiresKey: false
  },
  {
    id: 'financialModelingPrep',
    name: 'Financial Modeling Prep',
    type: 'free-tier',
    url: 'https://financialmodelingprep.com',
    defaultKey: 'demo',
    notes: 'Historical chart endpoints with generous demo quota.',
    supports: ['intraday', 'swing'],
    requiresKey: false
  },
  {
    id: 'twelveData',
    name: 'Twelve Data',
    type: 'free-key',
    url: 'https://twelvedata.com',
    defaultKey: 'demo',
    notes: 'High-quality equities/FX/crypto data with generous demo throughput.',
    supports: ['intraday', 'swing', 'macro'],
    requiresKey: false
  },
  {
    id: 'polygon',
    name: 'Polygon.io',
    type: 'free-key',
    url: 'https://polygon.io',
    notes: 'Requires user API key (free community tier).',
    supports: ['intraday', 'swing'],
    requiresKey: true
  },
  {
    id: 'finnhub',
    name: 'Finnhub',
    type: 'free-key',
    url: 'https://finnhub.io',
    notes: 'Free tier provides 60/minute w/ API key.',
    supports: ['intraday', 'swing'],
    requiresKey: true
  }
];

export const APP_ALERTS = {
  idle: 'Awaiting scan configuration.',
  queued: 'Program queued. We will notify you when processing begins.',
  running: 'Program in flight. Watch active programs for live status.',
  completed: 'Program completed. Review the SMA insights below.'
};
