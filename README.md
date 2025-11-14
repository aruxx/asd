# SMA Outfit Analysis - Real-Time Market Scanner

A comprehensive web application for analyzing Simple Moving Average (SMA) outfits in public equity markets. This tool scans stocks across multiple timeframes and SMA configurations to detect trading signals in real-time.

## 🌟 Features

- **Multi-API Support**: Choose from 5 free stock market APIs or use your own API key
  - Alpha Vantage (Free tier)
  - Finnhub (Free tier)
  - Polygon.io (Free tier)
  - Twelve Data (Free tier)
  - Yahoo Finance (No API key required)
  - Custom API support

- **Comprehensive SMA Analysis**: 
  - 25+ pre-configured SMA outfits including:
    - S&P 500 System (10/50/200)
    - NASDAQ System (20/100/250)
    - Dow Jones Industrial System (30/60/90/300/600/900)
    - Waring's Problem outfits
    - And many more specialized configurations

- **Multi-Timeframe Scanning**:
  - 1 minute to daily timeframes
  - Scans all selected timeframes simultaneously
  - Real-time signal detection

- **Active Program Monitoring**:
  - Real-time tracking of active trading signals
  - Visual notifications for buy/sell signals
  - Program runtime tracking

- **Modern UI**:
  - Dark theme optimized for extended use
  - Responsive design
  - Real-time updates
  - Filterable results

## 🚀 Quick Start

### Using GitHub Pages (Recommended)

The application is deployed and ready to use at:
**https://[your-username].github.io/[repo-name]/**

Simply open the link in your browser and start scanning!

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/sma-outfit-analysis.git
cd sma-outfit-analysis
```

2. Open `index.html` in a modern web browser

3. Configure your API:
   - Select an API provider from the dropdown
   - Enter your API key if required (Yahoo Finance doesn't need one)
   - Click "Save Configuration"

4. Start scanning:
   - Enter stock tickers (comma-separated) or use defaults
   - Select timeframes to scan
   - Click "Start Scanning"

## 📊 How It Works

### SMA Outfits

SMA outfits are sets of predetermined Simple Moving Averages used by institutional traders as triggers for executing trades. Each outfit consists of multiple SMAs with different time periods.

### Signal Detection

The scanner detects:
- **Golden Cross**: When a short-term SMA crosses above a long-term SMA (Buy signal)
- **Death Cross**: When a short-term SMA crosses below a long-term SMA (Sell signal)
- **Multi-SMA Alignment**: When all SMAs align in ascending (bullish) or descending (bearish) order

### Scanning Process

1. For each ticker, timeframe, and SMA outfit combination:
   - Fetches historical price data from the selected API
   - Calculates all SMAs in the outfit
   - Analyzes for trading signals
   - Records results and notifies on active signals

2. Active programs are tracked and displayed in real-time

3. Results are filterable by ticker and timeframe

## 🔧 API Configuration

### Free API Keys

Get free API keys from:

1. **Alpha Vantage**: https://www.alphavantage.co/support/#api-key
   - Free tier: 5 calls/minute, 500 calls/day

2. **Finnhub**: https://finnhub.io/register
   - Free tier: 60 calls/minute

3. **Polygon.io**: https://polygon.io/
   - Free tier available

4. **Twelve Data**: https://twelvedata.com/
   - Free tier: 800 calls/day

5. **Yahoo Finance**: No API key required (but rate-limited)

### Using Custom APIs

Select "Custom API" and enter your API key. The system will use Alpha Vantage format as default.

## 📈 Supported SMA Outfits

The application includes 25+ pre-configured SMA outfits:

- **10/50/200** - S&P 500 System
- **20/100/250** - NASDAQ System  
- **30/60/90/300/600/900** - Dow Jones Industrial System
- **19/37/73/143/279/548** - Waring's Problem
- **16/32/64/128/256/512** - Base 2 / NVDA
- **27/53/105/210/420/840** - TSLA System
- And many more...

See `sma-outfits.js` for the complete list.

## 🎯 Default Tickers

The scanner includes a comprehensive list of default tickers:
- Major indices: SPX, SPY, IXIC, QQQ, DJI, DIA
- Leveraged ETFs: UPRO, TQQQ, SQQQ, etc.
- Tech stocks: AAPL, MSFT, GOOGL, NVDA, TSLA, META
- And many more...

## 📱 Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Modern mobile browsers

## 🔒 Privacy & Security

- All API keys are stored locally in your browser (localStorage)
- No data is sent to external servers except the selected API provider
- All processing happens client-side

## 📝 License

See LICENSE.txt for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

This tool is for educational and research purposes only. It is not financial advice. Always do your own research and consult with a qualified financial advisor before making investment decisions. Past performance does not guarantee future results.

## 📚 Documentation

For detailed information about SMA outfits and their significance in market dynamics, refer to the comprehensive documentation in the repository.

## 🐛 Troubleshooting

### API Rate Limits
If you encounter rate limit errors:
- Wait a few minutes before retrying
- Consider using a different API provider
- Reduce the number of tickers or timeframes being scanned

### No Data Returned
- Verify your API key is correct
- Check that the ticker symbol is valid
- Some APIs may not support all tickers or timeframes

### Browser Console Errors
- Check browser console for detailed error messages
- Ensure JavaScript is enabled
- Try a different browser if issues persist

## 🔄 Updates

The application automatically updates active program displays every 5 seconds when scanning is active.

---

**Built with**: Vanilla JavaScript, HTML5, CSS3
**Deployed on**: GitHub Pages
