export const TIMEFRAMES = [
  { id: '1m', label: '1 Minute', description: 'Ultra short-term view for scalping and volatility bursts.' },
  { id: '5m', label: '5 Minutes', description: 'Intraday baseline used by most institutional desks.' },
  { id: '15m', label: '15 Minutes', description: 'Captures micro-trends without overwhelming API quotas.' },
  { id: '30m', label: '30 Minutes', description: 'Primary frame for SPX outfits.' },
  { id: '1h', label: '1 Hour', description: 'Bridges intraday and swing programs.' },
  { id: '4h', label: '4 Hours', description: 'Expresses extended-session intent.' },
  { id: '1d', label: '1 Day', description: 'Tracks macro shifts and quarterly outfits.' }
];

export const DEFAULT_TICKERS = [
  'SPX','SPY','IXIC','QQQ','DJI','DIA','UPRO','TQQQ','SQQQ','WEBS','UDOW','SDOW','VIX','VXX','SVIX','UVXY','SVXY','SOXS','SOXL','UWM','IWM','AAPL','MSFT','AMZN','GOOG','NVDA','META','TSLA','AMD','NFLX','INTC','COIN','QCOM','PYPL','UPST','RBLX','AI','ARM','BRK-B','GM','JPM','V','UNH','ENPH','BTCUSD','ETHUSD','BITO','HSI','DAX','BABA','TSM','AAPD','AAPU','TSLT','TSLQ','ERX','LABU','GUSH','DRIP','BOIL','DRN','REK','GLD','XAUUSD','DXY','USO','TLT','TBT','TNX'
];

export const SMA_OUTFITS = {
  'SPX System 10/50/200': [10, 50, 200],
  'NASDAQ System 20/100/250': [20, 100, 250],
  'Dow System 30/60/90/300/600/900': [30, 60, 90, 300, 600, 900],
  'AN 33/66/99/333/666/999': [33, 66, 99, 333, 666, 999],
  'AN 11/44/88/111/444/888': [11, 44, 88, 111, 444, 888],
  'AN 22/55/77/222/555/777': [22, 55, 77, 222, 555, 777],
  "Waring's Problem 19/37/73/143/279/548": [19, 37, 73, 143, 279, 548],
  'Base-2 NVDA 16/32/64/128/256/512': [16, 32, 64, 128, 256, 512],
  'TSLA Outfit 27/53/105/210/420/840': [27, 53, 105, 210, 420, 840],
  'Time Cycle 23/46/91/183/365/730': [23, 46, 91, 183, 365, 730],
  'Time Cycle 23/46/92/183/366/732': [23, 46, 92, 183, 366, 732],
  'Time Cycle 18/36/72/144/288/576': [18, 36, 72, 144, 288, 576],
  'Resource Gap 25/51/101/202/404/808': [25, 51, 101, 202, 404, 808],
  'US Presidential 29/57/114/227/455/911': [29, 57, 114, 227, 455, 911],
  'US Presidential 23/46/92/184/368/736': [23, 46, 92, 184, 368, 736],
  'US Presidential 24/47/94/188/376/752': [24, 47, 94, 188, 376, 752],
  'Speaker Seat 28/56/112/224/448/896': [28, 56, 112, 224, 448, 896],
  'WTC Homage 28/57/114/228/456/911': [28, 57, 114, 228, 456, 911],
  'Russia Seat 16/31/63/125/250/500': [16, 31, 63, 125, 250, 500],
  'China Chair 28/56/112/224/448/976': [28, 56, 112, 224, 448, 976],
  'France Seat 25/50/100/200/400/600': [25, 50, 100, 200, 400, 600],
  'SVIX Outfit 26/52/106/211/422/844': [26, 52, 106, 211, 422, 844],
  'Türkiye Seat 24/48/96/192/384/768': [24, 48, 96, 192, 384, 768],
  'Alphabet Stack 25/50/100/200/400/800': [25, 50, 100, 200, 400, 800],
  'Regression 27/54/108/216/432/864': [27, 54, 108, 216, 432, 864]
};

export const MAX_WORKLOAD = 200; // practical guardrail for API quotas
