# SMA Outfit Transparency Hub

A public-facing research hub and browser-based scanner that documents, explains, and actively monitors Simple Moving Average (SMA) outfits used by institutional trading divisions. The project combines narrative documentation, dataset manifests, and a zero-backend web application that can run on GitHub Pages and plug into multiple free market data APIs.

## Highlights
- **Full research library** – Repository structure mirrors the SMA outfit methodology: analysis briefs, technical definitions, processed data notes, visualization scaffolds, and real-time operation templates.
- **Multi-provider scanner** – Choose between five free/bring-your-own-key APIs (Financial Modeling Prep, Alpha Vantage, Twelve Data, Polygon.io, and Stooq). Each provider exposes unique intervals and rate limits that are fully documented in-app.
- **Unlimited SMA outfits** – Scan any ticker list across every timeframe and outfit described in the research. The engine computes SMA stacks, crossover classifications, volatility diagnostics, and renders the results instantly in the browser.
- **Active program tracker** – Every scan spins up a client-side “program” with real-time progress, cancellation controls, logs, and toast notifications so you always know what is running.
- **GitHub Pages ready** – The site is a static bundle (`index.html + assets/`) that deploys without a backend. API keys never leave the browser.

## Repository Layout
```
SMA_Analysis/                # Introduction, overview, methodology, and background research
Technical_Explanation/       # Executive trading definitions (Precision Buying, Singular Point Stops, etc.)
Data_and_Analysis/           # Raw outfit catalog + processed data guidance
Visualizations/              # Market impact & strategic operations storyboard templates
Documentation/               # Technical papers and operational review notes
Real_Time_Operations/        # Case-study logging template for live threads
Tools_and_Scripts/           # Guidance for ingestion tools and simulation models
index.html + assets/         # GitHub Pages–ready SMA Outfit Scanner
```

## Running the Web App Locally
1. Clone the repository.
   ```bash
   git clone <repo-url>
   cd <repo>
   ```
2. Serve the static site with any HTTP server (examples below) and open the printed URL.
   ```bash
   # Option A: Node
   npx serve .

   # Option B: Python
   python3 -m http.server 8080
   ```
3. Load the page, choose a provider, paste your API key if required, and start a scan.

> The Financial Modeling Prep and Alpha Vantage integrations ship with `demo` keys for proof-of-life. Replace them with personal keys for sustained workloads.

## Deploying to GitHub Pages
1. Push the repository to GitHub.
2. In **Settings → Pages**, set the source to the `main` branch (root directory) and save.
3. GitHub will publish `https://<username>.github.io/<repo>/`. Because all assets are relative, no additional build step is needed.
4. Update the README (or repository description) with the published URL once Pages finishes provisioning.

If you prefer a `docs/` deployment workflow, move `index.html` and `assets/` into a `docs/` folder and point Pages at that directory.

## API Providers
| Provider | Free Tier Notes | Supported Timeframes |
| --- | --- | --- |
| Yahoo Finance | No key required; client aggregates hourly data into 4h blocks | 1m, 5m, 15m, 30m, 1h, 4h*, 1d |
| Financial Modeling Prep | Personal key required; intraday + daily history | 1m, 5m, 15m, 30m, 1h, 4h, 1d |
| Alpha Vantage | Personal key required; 5 calls/min | 1m, 5m, 15m, 30m, 1h, 1d |
| Twelve Data | Personal key required; global coverage | 1m, 5m, 15m, 30m, 1h, 4h, 1d |
| Polygon.io | Personal key required; high-fidelity aggregates | 1m, 5m, 15m, 30m, 1h, 4h, 1d |

\\*The 4h option is computed from hourly candles when using Yahoo Finance so you can run keyless scans without losing that timeframe.

The UI stores API keys locally (optional) and exposes provider docs, notes, and rate-limit reminders so you can stay within free-tier budgets.

## Features in Detail
- **Ticker + timeframe orchestration** – Paste any ticker universe or use the curated list of indices, ETFs, equities, volatility instruments, crypto proxies, and macro benchmarks described in the research brief.
- **SMA outfit catalog** – Every outfit from 10/50/200 through Waring’s Problem integers is selectable, with support for simultaneous evaluation across dozens of configurations.
- **Active program notifications** – Starting a scan fires a toast, adds the program to the dashboard, and begins streaming progress updates. Cancelling a program halts all remaining fetches.
- **Insight cards** – Results highlight last price, sample timestamp, SMA alignment, crossover classification, and a detailed stack preview.
- **Browser-only execution** – There is no backend. All requests are made directly from your browser to the provider you pick, keeping secrets out of source control.

## Notes on “Scan Everything”
The UI encourages “scan all stocks, all timeframes, all SMA outfits,” but public APIs enforce rate limits. The app enforces a practical guardrail (`200` ticker×timeframe combinations per program) to protect providers and keep the experience responsive. You can still run multiple programs sequentially if you need exhaustive coverage.

## Legal & Transparency Considerations
- Data sources remain subject to their respective licenses and terms. Always review the provider’s policy before redistributing data.
- The repository documents institutional behaviors for educational and research purposes and does not constitute investment advice.
- API keys stored via the “Remember locally” option never leave your browser’s localStorage.

---
Questions or enhancements? Open an issue or submit a pull request—the more transparency around SMA outfits, the better. EOF
