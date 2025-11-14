# Analytical Tools

Scripts in this directory automate ingestion, cleansing, SMA computation, and reporting. Recommended utilities:

1. **Data Harvester:** Parallel fetcher for Lightspeed/Webull exports, with checksum validation.
2. **SMA Engine:** Rolling calculator that outputs serialized SMA windows for every outfit/timeframe combination.
3. **Signal Reporter:** Generates alert streams (webhooks, emails, dashboards) when outfits flip states.
4. **Frequency Scanner:** Quantifies how often each outfit triggered buy/sell outcomes per instrument.

Each tool should ship with:
- Usage instructions.
- Configuration schemas (API keys, rate limits, session schedules).
- Logging conventions for audit trails.

The web-based scanner implemented in this repository is considered part of the analytical toolkit and lives at the repository root for GitHub Pages compatibility. EOF
