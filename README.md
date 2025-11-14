# SMA Outfits - Real-Time Market Analysis

A comprehensive web application for analyzing Simple Moving Average (SMA) outfits across multiple timeframes and equities in real-time. This tool provides transparency into market dynamics by detecting precision trading signals based on various SMA configurations.

![SMA Outfits Analysis](images/screenshot.png)

## 🚀 Live Demo

**[View Live Application](https://yourusername.github.io/sma-outfits/)** ← Replace with your actual GitHub Pages URL

## 📖 Overview

This application implements the SMA outfit analysis methodology detailed in the research documentation. It monitors stock prices across multiple timeframes and detects signals based on specific SMA configurations that have been identified as significant in institutional trading operations.

### Key Features

- **Multi-API Support**: Choose from 5 free market data APIs or use your own API key
  - Alpha Vantage (Free - 500 requests/day)
  - Finnhub (Free - 60 requests/minute)
  - Twelve Data (Free - 800 requests/day)
  - Polygon.io (Free tier available)
  - Financial Modeling Prep (Free - 250 requests/day)

- **Comprehensive SMA Outfits**: Pre-configured with all major SMA outfit patterns
  - S&P 500 System (10/50/200)
  - NASDAQ System (20/100/250)
  - DJI System (30/60/90/300/600/900)
  - Waring's Problem (19/37/73/143/279/548)
  - Base 2 / NVDA (16/32/64/128/256/512)
  - And many more...

- **Multiple Timeframes**: Monitor from 1-minute to weekly charts
  - Intraday: 1m, 5m, 15m, 30m, 1h
  - Daily, Weekly, and longer periods

- **Real-Time Monitoring**: Active scanning with live notifications
  - Detects bullish and bearish crossovers
  - Identifies precision buy/sell signals
  - Tracks all active monitoring programs

- **Advanced Filtering**: Filter results by signal type, stock, and timeframe

## 🛠️ Technology Stack

- **Frontend**: Pure HTML5, CSS3, and JavaScript (ES6+)
- **APIs**: Multiple free market data providers
- **Deployment**: GitHub Pages (static hosting)
- **No Backend Required**: Runs entirely in the browser

## 📦 Installation & Setup

### Option 1: Use GitHub Pages (Recommended)

Simply visit the live application URL. No installation required!

### Option 2: Run Locally

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sma-outfits.git
cd sma-outfits
```

2. Open `index.html` in your web browser:
```bash
# On macOS
open index.html

# On Linux
xdg-open index.html

# On Windows
start index.html
```

Or use a local web server:
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve
```

Then visit `http://localhost:8000` in your browser.

## 🔑 API Configuration

### Free API Keys

**IMPORTANT: You MUST get your own API key to use this application. All API calls now use real market data.**

Most providers offer free tiers. Here's how to get started:

1. **Alpha Vantage** (Recommended for beginners)
   - Visit: https://www.alphavantage.co/support/#api-key
   - ✅ No credit card required
   - Free tier: 500 requests/day, 5 requests/minute
   - Data: Intraday (1min-60min), Daily, Weekly
   - Best for: General stock market analysis

2. **Finnhub**
   - Visit: https://finnhub.io/register
   - ✅ No credit card required
   - Free tier: 60 requests/minute
   - Data: Real-time and historical candles
   - Best for: High-frequency scanning

3. **Twelve Data**
   - Visit: https://twelvedata.com/register
   - ✅ No credit card required
   - Free tier: 800 requests/day, 8 requests/minute
   - Data: Multiple timeframes, comprehensive
   - Best for: Balanced usage

4. **Polygon.io**
   - Visit: https://polygon.io/dashboard/signup
   - ⚠️ Credit card required (but free tier available)
   - Free tier: 5 requests/minute
   - Data: Professional-grade market data
   - Best for: Professional analysis

5. **Financial Modeling Prep**
   - Visit: https://financialmodelingprep.com/developer/docs/
   - ✅ No credit card required
   - Free tier: 250 requests/day
   - Data: Historical and intraday
   - Best for: Daily analysis

### Using the Application

1. Select your preferred API provider from the dropdown
2. Enter your API key (if required)
3. Click "Save API Key"
4. Configure your SMA outfits and timeframes
5. Enter stock symbols to monitor
6. Click "Start Scanner"

## 📊 Understanding SMA Outfits

### What are SMA Outfits?

SMA (Simple Moving Average) outfits are specific configurations of multiple SMAs that institutional traders use to identify market conditions and execute precision trades. This application monitors these configurations in real-time to detect:

- **Precision Buying Algorithms**: When price interacts with specific SMA levels
- **Crossover Events**: When shorter SMAs cross above/below longer SMAs
- **Support/Resistance**: When price tests key SMA levels

### Pre-configured Outfits

The application includes the following SMA outfit configurations:

| Configuration | Description | Origin |
|--------------|-------------|---------|
| 10/50/200 | S&P 500 System | Standard market indicator |
| 20/100/250 | NASDAQ System | Tech-focused configuration |
| 30/60/90/300/600/900 | DJI System | Industrial average tracking |
| 19/37/73/143/279/548 | Waring's Problem | Number theory based |
| 16/32/64/128/256/512 | Base 2 | Binary progression |
| 27/53/105/210/420/840 | TSLA Specific | Tesla tracking |
| 23/46/91/183/365/730 | Time Based | Calendar day progression |

## 🎯 Usage Examples

### Example 1: Monitor SPY with S&P System

1. Select API provider and enter key
2. Check "S&P 500 (10/50/200)" outfit
3. Select "15min", "30min", and "1hour" timeframes
4. Enter "SPY" in the stock symbols field
5. Click "Start Scanner"

The app will monitor SPY across these timeframes and alert you when:
- MA10 crosses MA50 (short-term trend change)
- MA50 crosses MA200 (major trend change)
- Price tests these moving averages

### Example 2: Scan Multiple Tech Stocks

1. Configure your API
2. Select multiple SMA outfits
3. Enter multiple stocks:
   ```
   AAPL
   MSFT
   NVDA
   TSLA
   AMD
   ```
4. Select desired timeframes
5. Start scanning

## 📈 Signal Interpretation

### Buy Signals
- Short-term SMA crosses above long-term SMA (Golden Cross)
- Price bounces off SMA support level
- Multiple SMAs aligning in bullish formation

### Sell Signals
- Short-term SMA crosses below long-term SMA (Death Cross)
- Price rejected at SMA resistance level
- Multiple SMAs aligning in bearish formation

### Crossover Events
- Significant changes in trend direction
- High-probability trading setups
- Key institutional decision points

## ⚠️ Important Notes

### Rate Limits
- Free API tiers have rate limits
- The scanner automatically respects these limits
- Scanning frequency: Every 60 seconds
- Batch processing to maximize efficiency

### Data Accuracy
- Real-time data depends on API provider
- Free tiers may have 15-minute delays
- Upgrade to paid tiers for real-time data

### Disclaimer
This tool is for **educational and research purposes only**. It is not financial advice. Always:
- Do your own research
- Understand the risks
- Never invest more than you can afford to lose
- Consult with a financial advisor

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the Unlicense License - see the [LICENSE.txt](LICENSE.txt) file for details.

## 🔗 Links

- **Documentation**: See the original research documentation for detailed explanations
- **Issues**: Report bugs or request features on GitHub
- **Discussions**: Join the community discussion

## 🙏 Acknowledgments

- Based on extensive research into SMA outfit analysis
- Inspired by the need for transparency in equity markets
- Built for the community, by the community

## 📧 Contact

For questions, suggestions, or collaboration:
- Open an issue on GitHub
- Join the discussion forum
- Follow updates on the project page

---

**Built with ❤️ for market transparency**

*Last Updated: January 2025*
