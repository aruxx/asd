# SMA Outfit Analysis - Stock Market Scanner

A real-time web application for analyzing Simple Moving Average (SMA) outfits across public equity markets. This tool scans stocks across multiple timeframes and SMA configurations to detect trading signals and market patterns.

## Features

- **Multiple API Support**: Choose from 5 free stock market APIs or use your own API key
  - Alpha Vantage (Free tier available)
  - Finnhub (Free tier available)
  - Polygon.io (Free tier available)
  - Twelve Data (Free tier available)
  - Yahoo Finance (No API key required)

- **Comprehensive SMA Analysis**: 
  - Scans multiple stocks simultaneously
  - Analyzes across multiple timeframes (1m, 5m, 15m, 30m, 1h, 1d)
  - Tests various SMA outfit configurations including:
    - 10/50/200 (S&P 500 System)
    - 20/100/250 (NASDAQ System)
    - 30/60/90/300/600/900 (Dow Jones System)
    - And many more configurations

- **Real-time Monitoring**:
  - Active scan tracking with live status updates
  - Notification system for scan progress
  - Detailed signal detection and display

- **Signal Detection**:
  - Golden Cross / Death Cross detection
  - Price position relative to SMAs
  - System-specific signals (S&P, NASDAQ, Dow Jones)
  - Buy/Sell signal strength indicators

## Getting Started

### Using the Web Application

1. **Access the Application**: Visit the GitHub Pages deployment (link will be provided after deployment)

2. **Configure API**:
   - Select your preferred API provider from the dropdown
   - For APIs requiring keys, enter your API key (or leave blank for Yahoo Finance)
   - Click "Save Configuration"

3. **Set Up Scanner**:
   - Enter stock symbols (comma-separated): e.g., `AAPL, MSFT, GOOGL, NVDA, TSLA`
   - Select timeframes to analyze
   - Choose SMA outfits to test
   - Click "Start Scan"

4. **View Results**:
   - Active scans appear in real-time
   - Results display detected signals with buy/sell indicators
   - Each result shows current price, SMA values, and detected patterns

### Getting Free API Keys

- **Alpha Vantage**: https://www.alphavantage.co/support/#api-key
- **Finnhub**: https://finnhub.io/register
- **Polygon.io**: https://polygon.io/
- **Twelve Data**: https://twelvedata.com/
- **Yahoo Finance**: No API key required

## SMA Outfits Explained

SMA outfits are specific combinations of Simple Moving Averages used by institutional traders to identify market trends and execute precision trading operations. This application implements several key outfits:

- **10/50/200 (S&P System)**: The primary SMA outfit for S&P 500 analysis
- **20/100/250 (NASDAQ System)**: Used for NASDAQ composite analysis
- **30/60/90/300/600/900 (Dow Jones System)**: Applied to Dow Jones Industrial Average
- **19/37/73/143/279/548 (Waring's Problem)**: Based on mathematical theory
- And many more configurations

## Technical Details

### Architecture

- **Frontend**: Pure HTML/CSS/JavaScript (no build step required)
- **APIs**: Multiple stock market data providers with fallback support
- **Storage**: LocalStorage for configuration persistence
- **Deployment**: GitHub Pages compatible

### Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers supported

## Project Structure

```
/
├── index.html          # Main application HTML
├── styles.css          # Application styling
├── app.js              # Main application logic
├── api-config.js       # API configuration and data fetching
├── sma-calculator.js   # SMA calculation and signal detection
└── README.md           # This file
```

## Usage Notes

- **API Rate Limits**: Free API tiers have rate limits. The application includes delays to respect these limits
- **Data Availability**: Some APIs may not support all timeframes for all stocks
- **Real-time Data**: Data freshness depends on the selected API provider
- **Browser Storage**: Configuration is saved locally in your browser

## Contributing

This project is part of research into SMA outfits and their role in public equity markets. Contributions and improvements are welcome.

## License

See LICENSE.txt for license information.

## Disclaimer

This tool is for educational and research purposes. It does not provide financial advice. Always conduct your own research and consult with financial professionals before making investment decisions.

## Live Deployment

The application is deployed on GitHub Pages. Access it at: [Your GitHub Pages URL will appear here after deployment]

---

**Note**: This application analyzes SMA outfits as described in the research documentation. It provides real-time scanning capabilities to detect patterns and signals based on Simple Moving Average configurations used in institutional trading.
