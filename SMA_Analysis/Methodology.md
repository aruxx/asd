# Methodology

The SMA outfit methodology rests on disciplined data stewardship and deterministic signal generation:

## Data Acquisition
- **Primary Feeds**: Lightspeed and Webull deliver synchronized OHLCV data with millisecond resolution. Discrepancies are logged, reconciled, and tagged for removal.
- **Formats**: JSON streams supply nested metadata for real-time operations, while CSV exports store historical slices for batch research.

## Pre-processing Pipeline
1. **Cleansing** – Remove null prices, zero-volume placeholder rows, and timestamp gaps. Detect outliers using rolling median checks and context-aware z-scores.
2. **Normalization** – Convert all timestamps to EST and align to the highest resolution needed for each timeframe stack.
3. **Filtering** – Reject entries missing tickers, venue identifiers, or liquidity attributes. Deduplicate burst entries to avoid artificially weighting a single event.
4. **Consistency Checks** – Cross-verify Lightspeed ticks against Webull snapshots; discrepancies are escalated for manual audit.
5. **Error Handling** – Implement fallback feeds, cached frames, and last-known-good substitution to keep scans continuous during outages.

## Processing & Signal Generation
- **SMA Calculation Engine** – Computes up to 999-period SMAs per timeframe with optimized rolling windows and caching for parallel processing.
- **Trigger Logic** – Detects crossovers, slope directionality, volatility throttles, and Waring-integer-specific harmonics.
- **Performance** – Uses worker pools and memoized data slices so the browser experience (and server-side tooling) can evaluate thousands of combinations without blocking.

## Compliance
All processing respects regulatory obligations (GDPR, SEC, FINRA). The documentation provides reproducible evidence trails to ensure that transparency efforts do not compromise legal boundaries.
