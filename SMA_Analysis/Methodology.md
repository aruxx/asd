# Methodology

The SMA Outfit Research Program relies on institutional-grade data capture, rigorous preprocessing, and deterministic analysis pipelines. Every conclusion in this repository flows from reproducible computational steps designed to preserve fidelity between raw market emissions and derived SMA signals.

## Data Sources
- **Lightspeed (Desktop):** High-frequency OHLC, depth, and order-book differentials used as the authoritative source for intraday price action.
- **Webull:** Complements the Lightspeed feed with enriched metadata and instrument descriptors; discrepancies—such as the March 18, 2024 cache anomaly—are cataloged and corrected.
- **InfluxDB:** Primary time-series warehouse chosen for its millisecond precision, retention policies, and near-instantaneous query response.

## Preprocessing Pipeline
1. **Data Cleansing:** Remove nulls, zero/negative anomalies, and entries lacking ticker, timestamp, or volume metadata. Statistical outliers inconsistent with news or historic volatility are flagged for manual review.
2. **Timestamp Normalization:** Convert all feeds to EST with millisecond precision to maintain deterministic ordering across venues and sessions.
3. **Integrity Checks:** Cross-verify identical instruments across Lightspeed and Webull; log divergences for auditability.
4. **Deduplication:** Collapse duplicate records introduced by exchange hiccups or broker caching artifacts.
5. **Error Handling:** Implement fallback sourcing and last-known-good substitution to bridge feed interruptions without corrupting rolling calculations.

## Data Integration
Cleansed feeds enter a staging layer where schema harmonization occurs (JSON ↔ CSV normalization). Fields are aligned so that every downstream process receives consistent OHLC, volume, and metadata attributes.

## SMA Calculation Engine
- **Parameter Bounds:** All SMA periods are strictly 1–999, mirroring institutional enforcement.
- **Rolling Computations:** SMA series are calculated via rolling sums for performance and streamed directly into signal generation logic.
- **Multi-Timeframe Support:** Tick/second/sub-minute/minute/hourly/daily/weekly/monthly/quarterly windows are supported, with specific engines toggled according to strategy requirements.

## Signal Generation
- **Crossover Detection:** Short-vs-long relationships generate bullish or bearish signals the moment a crossover is mathematically confirmed.
- **Frequency Analysis:** Historical frequency of each pattern is tracked to flag statistically dominant outfits per instrument.
- **Trigger Enforcement:** Detection of historically revisited outfits automatically sets buy/sell/short/stop triggers, including singular point hard stop enforcement.

## Performance & Resilience
- **Parallelization:** Ticker-timeframe workloads execute in parallel to satisfy real-time expectations.
- **Caching:** Expensive computations are memoized so rapid rescans reuse validated SMA windows.
- **Monitoring:** Anomaly detectors watch for feed drift, volatility spikes, and cross-market dislocations that might invalidate baseline assumptions.

The net result is a reproducible framework where SMA outfits are auditable, explainable, and empirically tied to market outcomes. EOF
