# Changelog

## v2.0.0 - SMA Outfit Analysis Web Application

### Added
- Complete web application for SMA outfit analysis
- Support for 5 free stock market APIs:
  - Alpha Vantage
  - Finnhub
  - Polygon.io
  - Twelve Data
  - Yahoo Finance (no API key required)
- Real-time stock scanning across multiple timeframes
- SMA outfit detection and signal generation
- Active scan monitoring and notifications
- Results display with buy/sell signals
- LocalStorage configuration persistence
- Responsive design for mobile and desktop

### Features
- Multi-timeframe analysis (1m, 5m, 15m, 30m, 1h, 1d)
- Multiple SMA outfit configurations
- Golden Cross / Death Cross detection
- System-specific signals (S&P, NASDAQ, Dow Jones)
- Price position analysis relative to SMAs
- Batch processing with API rate limit handling

### Technical
- Pure HTML/CSS/JavaScript (no build step)
- GitHub Pages compatible
- Client-side only (no backend required)
- CORS-friendly API implementations
