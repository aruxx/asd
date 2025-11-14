# Processed Data

This directory stores normalized SMA outfit calculations derived from the raw feeds. Each dataset includes:

- **Ticker Universe** – Core indices (SPX, IXIC, DJI), volatility products, sector ETFs, mega-cap equities, treasuries, metals, energy, crypto, and global indices.
- **Timeframes** – Tick, second, sub-minute, minute clusters, multi-hour, daily, weekly, monthly, and quarterly aggregations.
- **Metadata** – Source feed, timezone normalization details, data quality scores, and reconciliation hashes verifying parity between Lightspeed and Webull snapshots.
- **Signal Flags** – Positive/negative system states, crossovers, slope changes, volatility overrides, and precision trigger markers.

Each processed artifact is versioned via checksum and timestamp so that the live web application can reference a verifiable lineage of computations.
