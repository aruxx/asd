# SMA Outfit Transparency Lab

A GitHub Pages–ready microsite that documents institutional Simple Moving Average (SMA) outfits and lets you scan every ticker/timeframe combination inside the browser. The experience merges research directories, live signal generation, and an active program monitor so the entire SMA control stack is transparent to regulators, academics, and market participants.

![Dashboard preview](images/screenshot.png)

## Highlights

- **Five provider options** – Alpha Vantage, Financial Modeling Prep, Twelve Data, Polygon.io, and Finnhub are baked in. Demo keys are prefilled where allowed; paid tiers can be added manually.
- **Universal SMA library** – Every outfit listed in the research brief (e.g., 10/50/200, Waring integers, harmonic civic stacks) is bundled and selectable.
- **Full timeframe coverage** – Tick, sub-second, multi-minute, intra-day, swing, and macro periods are synthesized from real data so you can observe how outfits align across the entire market lattice.
- **Active program monitor** – Each scan queues as a "program" with start/completion notifications, live logs, and aggregate signal summaries.
- **Research-first repository structure** – Directories such as `SMA_Analysis/`, `Technical_Explanation/`, `Real_Time_Operations/`, and `Tools_and_Scripts/` mirror the narrative supplied in the spec and are referenced inside the UI.

## Repository layout

```
├── index.html                        # Static single-page app (GitHub Pages entry point)
├── assets/
│   ├── css/styles.css                # Tailored Space Grotesk dark theme
│   └── js/                           # Vanilla JS modules (state, SMA engine, providers)
├── SMA_Analysis/                     # Introduction, overview, methodology, background
├── Technical_Explanation/            # Executive definitions & terminology
├── Data_and_Analysis/                # Raw/processed SMA outfit data docs
├── Visualizations/                   # Chart placeholders of market impact & strategy
├── Documentation/                    # Technical papers + operational reviews
├── Real_Time_Operations/             # Live thread references (Precision buys, etc.)
├── Tools_and_Scripts/                # Future analytical tooling + simulations
└── images/                           # Repo art assets (logo + screenshot)
```

## Prerequisites & local preview

No build tooling is required; everything runs in the browser. For local preview you can use any static file server:

```bash
# Option 1: Python
python -m http.server 4173

# Option 2: Serve (npm)
npx serve .

# Visit http://localhost:4173 (or the port shown)
```

Because all logic is client-side, once the files are served you can immediately launch scans.

## Using the web app

1. **Pick a provider** from the dropdown.
   - Alpha Vantage, Financial Modeling Prep, and Twelve Data ship with demo keys (`demo`).
   - Polygon.io & Finnhub require you to paste your own token (free community tiers exist).
2. **Load tickers** – paste a comma/space separated list or click *“Load institutional universe”* to prefill ~12 flagship tickers.
3. **Select timeframes** – core institutional stack (1m → 1M) is preselected. Use *Select all* to include ultra-short and experimental frames.
4. **Choose SMA outfits** – all outfits are selected by default; trim if you need faster scans.
5. **Start the program** – the engine:
   - Queues the job and posts a notification
   - Pulls data via the chosen API (with caching + synthetic fallbacks when rate-limited)
   - Evaluates every SMA configuration, recording signal, alignment score, and latest close
   - Streams the latest 100 results to the Live SMA Signals table
   - Updates the Active Programs board with logs and performance counts

> ⚠️ **Rate limits** – Alpha Vantage enforces 5 req/min. The app caches base intervals per ticker to minimize calls, but for large universes consider using Financial Modeling Prep or supply higher-tier keys.

## API configuration cheatsheet

| Provider | Free tier | Default key | Notes |
| --- | --- | --- | --- |
| Alpha Vantage | Yes (5 req/min) | `demo` | Intraday + daily functions, ideal for public demos.
| Financial Modeling Prep | Yes | `demo` | Historical chart endpoints with generous quotas.
| Twelve Data | Yes | `demo` | Equities/FX/crypto intervals down to seconds; generous demo bandwidth.
| Polygon.io | Free community | — (user supplied) | Paste your key for higher throughput intraday data.
| Finnhub | Free tier | — (user supplied) | Great for equities + crypto with 60 req/min allowing.

If a provider fails (quota exceeded, missing key, CORS issues) the UI falls back to synthetic data but clearly labels it as such so you know the feed is simulated.

## Deployment to GitHub Pages

The site is already organized for Pages—no bundler, no build step. Deploy one of two ways:

### Option A – Deploy from `main` (root)
1. Commit your changes to `main`.
2. In GitHub → *Settings → Pages*, choose **Deploy from branch** and set `Branch: main` + `Folder: /(root)`.
3. Wait for the GitHub Pages action to finish, then visit `https://<user>.github.io/<repo>/`.

### Option B – Dedicated `gh-pages` branch
```bash
git checkout -B gh-pages
rm -rf .github workflows (if any build-specific files need removal)
git add index.html assets/ images/ SMA_Analysis/ ...
git commit -m "Deploy SMA dashboard"
git push origin gh-pages
```
Then configure Pages to serve from the `gh-pages` branch root.

### Custom domain or org site
- Update `CNAME` in the repo root if you want a vanity domain.
- For organization-wide transparency initiatives, fork the repo into `<org>.github.io` and the site will automatically live at the apex domain.

## Testing checklist

- [ ] `index.html` opens locally and renders hero, program builder, provider catalog, active programs, and results table.
- [ ] Launching a scan posts an *Active Program* card and logs.
- [ ] At least one provider (Alpha Vantage demo) returns real quotes; fallback notification appears if quotas are hit.
- [ ] Documentation links open the corresponding Markdown files in this repository structure.

## Contributing

Pull requests are welcome. Please keep contributions aligned with the core mission: documenting SMA outfits and improving transparency for public-market automation. Useful additions include new data adapters, visualization modules, or validated research artifacts inside the provided directories.

## License

This project remains under the existing `LICENSE.txt` (Unlicense). Feel free to fork and adapt while crediting the upstream research.
