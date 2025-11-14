import { SMA_OUTFITS, TIMEFRAMES, DEFAULT_TICKERS, PROVIDER_METADATA, APP_ALERTS } from './constants.js';
import {
  createProgram,
  updateProgram,
  completeProgram,
  addProgramLog,
  addNotification,
  addResult,
  subscribe,
  getState
} from './state.js';
import { deriveSeriesForTimeframe, getProviderMetadata } from './apiProviders.js';
import { evaluateOutfits } from './smaEngine.js';

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => Array.from(document.querySelectorAll(selector));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_TIMEFRAMES = new Set(['1m', '5m', '15m', '30m', '1h', '1d', '1w', '1M']);

const notificationTray = qs('#notification-tray');
const programListEl = qs('#program-list');
const resultsBoardEl = qs('#results-board');
const providerSelect = qs('#provider');
const apiKeyInput = qs('#api-key');
const tickerInput = qs('#tickers');
const timeframeContainer = qs('#timeframe-options');
const outfitContainer = qs('#outfit-options');
const form = qs('#scan-form');
const statusBanner = qs('#status-banner');
const providerCatalog = qs('#provider-catalog');

const initProviders = () => {
  providerSelect.innerHTML = PROVIDER_METADATA.map(
    (provider) => `<option value="${provider.id}">${provider.name}</option>`
  ).join('');
};

const renderTimeframes = () => {
  timeframeContainer.innerHTML = '';
  TIMEFRAMES.forEach((tf) => {
    const label = document.createElement('label');
    label.className = 'chip';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'timeframes';
    input.value = tf.id;
    input.checked = DEFAULT_TIMEFRAMES.has(tf.id);
    const span = document.createElement('span');
    span.textContent = `${tf.label}`;
    label.append(input, span);
    timeframeContainer.appendChild(label);
  });
};

const renderOutfits = () => {
  outfitContainer.innerHTML = '';
  SMA_OUTFITS.forEach((outfit) => {
    const label = document.createElement('label');
    label.className = 'chip chip-outfit';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'outfits';
    input.value = outfit.id;
    input.checked = true;
    const span = document.createElement('span');
    span.textContent = outfit.label;
    label.append(input, span);
    outfitContainer.appendChild(label);
  });
};

const renderProviderCatalog = () => {
  providerCatalog.innerHTML = PROVIDER_METADATA.map(
    (provider) => `
      <li>
        <strong>${provider.name}</strong>
        <p class="muted">${provider.notes}</p>
        <small>${provider.requiresKey ? 'Bring your key' : 'Demo key available'}</small>
      </li>
    `
  ).join('');
};

const renderNotification = (entry) => {
  const card = document.createElement('div');
  card.className = `toast toast-${entry.variant}`;
  card.dataset.id = entry.id;
  card.innerHTML = `
    <div>
      <strong>${entry.variant.toUpperCase()}</strong>
      <p>${entry.message}</p>
    </div>
    <button aria-label="Dismiss">×</button>
  `;
  card.querySelector('button').addEventListener('click', () => card.remove());
  notificationTray.prepend(card);
  setTimeout(() => card.remove(), 8000);
};

const formatDate = (timestamp) => {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString();
};

const summarizeProgram = (program) => {
  const { summary = {} } = program;
  const { totalTickers = 0, totalTimeframes = 0, totalSignals = 0, bullish = 0, bearish = 0 } = summary;
  return `Tickers ${totalTickers} · Timeframes ${totalTimeframes} · Signals ${totalSignals} (B ${bullish} / S ${bearish})`;
};

const renderPrograms = () => {
  const { activePrograms } = getState();
  if (!activePrograms.length) {
    programListEl.innerHTML = '<p class="muted">No active programs yet. Launch a scan to begin.</p>';
    return;
  }
  programListEl.innerHTML = activePrograms
    .map(
      (program) => `
      <article class="program-card status-${program.status}">
        <header>
          <div>
            <h3>${program.name}</h3>
            <p class="muted">Provider: ${getProviderMetadata(program.providerId)?.name ?? program.providerId}</p>
          </div>
          <span class="badge">${program.status.toUpperCase()}</span>
        </header>
        <p class="program-meta">${summarizeProgram(program)}</p>
        <dl>
          <div><dt>Created</dt><dd>${formatDate(program.createdAt)}</dd></div>
          <div><dt>Started</dt><dd>${formatDate(program.startedAt)}</dd></div>
          <div><dt>Completed</dt><dd>${formatDate(program.completedAt)}</dd></div>
        </dl>
        <details>
          <summary>Logs (${program.logs.length})</summary>
          <ul>
            ${program.logs
              .slice()
              .reverse()
              .map((log) => `<li><span>${new Date(log.timestamp).toLocaleTimeString()}</span> ${log.message}</li>`)
              .join('')}
          </ul>
        </details>
      </article>
    `
    )
    .join('');
};

const signalBadge = (signal) => {
  return `<span class="signal signal-${signal}">${signal}</span>`;
};

const renderResults = () => {
  const { results } = getState();
  if (!results.length) {
    resultsBoardEl.innerHTML = '<p class="muted">No signals yet.</p>';
    return;
  }
  const top = results.slice(0, 100);
  resultsBoardEl.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Timeframe</th>
          <th>Outfit</th>
          <th>Signal</th>
          <th>Alignment</th>
          <th>Latest Close</th>
          <th>Sample</th>
        </tr>
      </thead>
      <tbody>
        ${top
          .map(
            (row) => `
            <tr>
              <td>${row.ticker}</td>
              <td>${row.timeframe}</td>
              <td>${row.label}</td>
              <td>${signalBadge(row.signal)}</td>
              <td>${(row.alignmentScore * 100).toFixed(0)}%</td>
              <td>$${row.latestClose?.toFixed(2) ?? '—'}</td>
              <td>${row.sampleSize}</td>
            </tr>
          `
          )
          .join('')}
      </tbody>
    </table>
  `;
};

const gatherSelections = () => {
  const selectedTimeframes = qsa('input[name="timeframes"]:checked').map((input) => input.value);
  const selectedOutfits = qsa('input[name="outfits"]:checked').map((input) => input.value);
  const tickers = tickerInput.value
    .split(/[\s,]+/)
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);
  const outfits = selectedOutfits.length
    ? SMA_OUTFITS.filter((outfit) => selectedOutfits.includes(outfit.id))
    : SMA_OUTFITS;
  return {
    tickers: tickers.length ? tickers : DEFAULT_TICKERS,
    timeframes: selectedTimeframes.length ? selectedTimeframes : TIMEFRAMES.map((tf) => tf.id),
    outfits
  };
};

const updateStatusBanner = (message, tone = 'info') => {
  statusBanner.textContent = message;
  statusBanner.dataset.tone = tone;
};

const runProgram = async (program) => {
  updateProgram(program.id, { status: 'running', startedAt: Date.now() });
  addNotification(`Program ${program.name} started`, 'success');
  updateStatusBanner(APP_ALERTS.running, 'success');
  const seriesCache = new Map();
  const summary = {
    totalTickers: program.tickers.length,
    totalTimeframes: program.timeframes.length,
    totalSignals: 0,
    bullish: 0,
    bearish: 0
  };
  const pullSeries = async (ticker, timeframe) => {
    const cacheKey = `${ticker}-${timeframe}`;
    if (seriesCache.has(cacheKey)) return seriesCache.get(cacheKey);
    const data = await deriveSeriesForTimeframe({
      providerId: program.providerId,
      symbol: ticker,
      timeframeId: timeframe,
      apiKey: program.apiKey
    });
    seriesCache.set(cacheKey, data);
    return data;
  };
  for (const ticker of program.tickers) {
    for (const timeframe of program.timeframes) {
      addProgramLog(program.id, `Fetching ${ticker} · ${timeframe}`);
      const series = await pullSeries(ticker, timeframe);
      const snapshots = evaluateOutfits(series.candles, program.outfits);
      snapshots.forEach((snapshot) => {
        const result = {
          ...snapshot,
          ticker,
          timeframe,
          providerId: program.providerId,
          programId: program.id
        };
        addResult(result);
        summary.totalSignals += 1;
        if (snapshot.signal === 'bullish') summary.bullish += 1;
        if (snapshot.signal === 'bearish') summary.bearish += 1;
      });
      await wait(900);
    }
  }
  completeProgram(program.id, 'completed', summary);
  addNotification(`Program ${program.name} completed`, 'info');
  updateStatusBanner(APP_ALERTS.completed, 'info');
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const providerId = providerSelect.value;
  const apiKey = apiKeyInput.value.trim();
  const nameInput = qs('#program-name');
  const programName = nameInput.value || `SMA Scan ${new Date().toLocaleTimeString()}`;
  const selections = gatherSelections();
  const program = createProgram({
    name: programName,
    providerId,
    apiKey,
    tickers: selections.tickers,
    timeframes: selections.timeframes,
    outfits: selections.outfits,
    notes: form.notes?.value
  });
  renderPrograms();
  updateStatusBanner(APP_ALERTS.queued, 'info');
  addProgramLog(program.id, 'Program queued. Preparing to fetch data.');
  runProgram(program);
};

const bindEvents = () => {
  form.addEventListener('submit', handleSubmit);
  qs('#load-default-tickers').addEventListener('click', () => {
    tickerInput.value = DEFAULT_TICKERS.join(', ');
  });
  qs('#select-all-timeframes').addEventListener('click', () => {
    qsa('input[name="timeframes"]').forEach((input) => (input.checked = true));
  });
  qs('#deselect-timeframes').addEventListener('click', () => {
    qsa('input[name="timeframes"]').forEach((input) => (input.checked = false));
  });
  qs('#select-all-outfits').addEventListener('click', () => {
    qsa('input[name="outfits"]').forEach((input) => (input.checked = true));
  });
  qs('#deselect-outfits').addEventListener('click', () => {
    qsa('input[name="outfits"]').forEach((input) => (input.checked = false));
  });
};

const initSubscriptions = () => {
  subscribe('program:create', renderPrograms);
  subscribe('program:update', renderPrograms);
  subscribe('program:log', renderPrograms);
  subscribe('results:update', renderResults);
  subscribe('notification', renderNotification);
};

const hydrateDefaultTickers = () => {
  tickerInput.value = DEFAULT_TICKERS.slice(0, 12).join(', ');
};

const init = () => {
  initProviders();
  renderTimeframes();
  renderOutfits();
  renderProviderCatalog();
  renderPrograms();
  renderResults();
  hydrateDefaultTickers();
  bindEvents();
  initSubscriptions();
  updateStatusBanner(APP_ALERTS.idle, 'info');
};

document.addEventListener('DOMContentLoaded', init);
