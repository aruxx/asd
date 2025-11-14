import { TIMEFRAMES, DEFAULT_TICKERS, SMA_OUTFITS, MAX_WORKLOAD } from './constants.js';
import { API_PROVIDERS, getProviderById } from './api-providers.js';
import { analyzeOutfit } from './sma-engine.js';
import { createProgram, updateProgramStatus, appendLog, appendResult, getState, markCancelled, clearResults } from './state-store.js';
import { uniqStrings, formatNumber, formatDate, STORAGE_KEYS } from './utils.js';

const dom = {
  providerSelect: document.getElementById('provider-select'),
  providerDetails: document.getElementById('provider-details'),
  apiKeyInput: document.getElementById('api-key-input'),
  rememberKey: document.getElementById('remember-key'),
  tickerInput: document.getElementById('ticker-input'),
  loadDefaultsBtn: document.getElementById('load-default-tickers'),
  timeframeList: document.querySelector('[data-timeframe-list]'),
  selectAllTimeframesBtn: document.getElementById('select-all-timeframes'),
  outfitList: document.querySelector('[data-outfit-list]'),
  selectCoreOutfitsBtn: document.getElementById('select-core-outfits'),
  selectAllOutfitsBtn: document.getElementById('select-all-outfits'),
  workloadSummary: document.getElementById('workload-summary'),
  startScanBtn: document.getElementById('start-scan-btn'),
  quickScanBtn: document.getElementById('quick-scan-btn'),
  programList: document.getElementById('program-list'),
  resultsGrid: document.getElementById('results-grid'),
  clearResultsBtn: document.getElementById('clear-results-btn'),
  activeProgramCount: document.getElementById('active-program-count'),
  lastSync: document.getElementById('last-sync'),
  toastContainer: document.getElementById('toast-container')
};

const localState = {
  apiKeys: {},
  remember: true,
  lastConfig: null,
  lastSyncAt: null
};

init();

function init() {
  hydrateProviders();
  hydrateTickers();
  hydrateTimeframes();
  hydrateOutfits();
  loadPreferences();
  bindEvents();
  updateWorkloadSummary();
  renderPrograms();
  renderResults();
}

function hydrateProviders() {
  API_PROVIDERS.forEach((provider) => {
    const option = document.createElement('option');
    option.value = provider.id;
    option.textContent = provider.name;
    dom.providerSelect.appendChild(option);
  });
  const defaultProvider = API_PROVIDERS[0];
  if (defaultProvider) {
    dom.providerSelect.value = defaultProvider.id;
    updateProviderDetails(defaultProvider);
  }
}

function hydrateTickers() {
  dom.tickerInput.value = DEFAULT_TICKERS.join(', ');
}

function hydrateTimeframes() {
  dom.timeframeList.innerHTML = '';
  TIMEFRAMES.forEach((frame) => {
    const label = document.createElement('label');
    label.className = 'chip';
    label.innerHTML = `
      <input type="checkbox" class="timeframe-checkbox" value="${frame.id}" checked>
      <span>
        <strong>${frame.label}</strong>
        <small>${frame.description}</small>
      </span>
    `;
    dom.timeframeList.appendChild(label);
  });
}

function hydrateOutfits() {
  dom.outfitList.innerHTML = '';
  Object.entries(SMA_OUTFITS).forEach(([name, combo], index) => {
    const label = document.createElement('label');
    label.className = 'chip outfit-chip';
    const defaultChecked = index < 3;
    label.innerHTML = `
      <input type="checkbox" class="outfit-checkbox" value="${name}" ${defaultChecked ? 'checked' : ''}>
      <span>
        <strong>${name}</strong>
        <small>${combo.join(' / ')}</small>
      </span>
    `;
    dom.outfitList.appendChild(label);
  });
}

function bindEvents() {
  dom.providerSelect.addEventListener('change', () => {
    const provider = getProviderById(dom.providerSelect.value);
    updateProviderDetails(provider);
    persistConfig();
  });

  dom.apiKeyInput.addEventListener('input', (event) => {
    const providerId = dom.providerSelect.value;
    localState.apiKeys[providerId] = event.target.value.trim();
    if (localState.remember) {
      localStorage.setItem(STORAGE_KEYS.apiKeys, JSON.stringify(localState.apiKeys));
    }
  });

  dom.rememberKey.addEventListener('change', (event) => {
    localState.remember = event.target.checked;
    persistConfig();
    if (!localState.remember) {
      localStorage.removeItem(STORAGE_KEYS.apiKeys);
    } else {
      localStorage.setItem(STORAGE_KEYS.apiKeys, JSON.stringify(localState.apiKeys));
    }
  });

  dom.tickerInput.addEventListener('input', updateWorkloadSummary);

  dom.loadDefaultsBtn.addEventListener('click', () => {
    dom.tickerInput.value = DEFAULT_TICKERS.join(', ');
    updateWorkloadSummary();
  });

  dom.timeframeList.addEventListener('change', updateWorkloadSummary);
  dom.outfitList.addEventListener('change', updateWorkloadSummary);

  dom.selectAllTimeframesBtn.addEventListener('click', () => {
    dom.timeframeList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = true;
    });
    updateWorkloadSummary();
  });

  dom.selectCoreOutfitsBtn.addEventListener('click', () => {
    dom.outfitList.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
      checkbox.checked = index < 3;
    });
    updateWorkloadSummary();
  });

  dom.selectAllOutfitsBtn.addEventListener('click', () => {
    dom.outfitList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.checked = true;
    });
    updateWorkloadSummary();
  });

  dom.startScanBtn.addEventListener('click', () => handleScan());
  dom.quickScanBtn.addEventListener('click', () => handleScan({ quick: true }));

  dom.clearResultsBtn.addEventListener('click', () => {
    clearResults();
    renderResults();
  });
}

function updateProviderDetails(provider) {
  if (!provider) return;
  dom.providerDetails.innerHTML = `
    <div>
      <p>${provider.description}</p>
      <p class="provider-meta"><strong>Intervals:</strong> ${provider.intervals.join(', ')}</p>
      <p class="provider-meta"><strong>Notes:</strong> ${provider.notes}</p>
      <a href="${provider.docsUrl}" target="_blank" rel="noreferrer">View API docs ↗</a>
    </div>
  `;
  const savedKey = localState.apiKeys[provider.id] ?? '';
  dom.apiKeyInput.value = savedKey;
  dom.apiKeyInput.placeholder = provider.requiresKey ? 'Enter API key' : 'Optional API key';
  dom.apiKeyInput.disabled = false;
}

function gatherSelections() {
  const rawTickers = dom.tickerInput.value.split(/\s|,|\n/);
  const tickers = uniqStrings(rawTickers);
  const timeframes = [...dom.timeframeList.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
  const outfits = [...dom.outfitList.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
  return { tickers, timeframes, outfits };
}

function updateWorkloadSummary() {
  const { tickers, timeframes, outfits } = gatherSelections();
  const workload = tickers.length * timeframes.length;
  dom.workloadSummary.textContent = `${tickers.length} tickers × ${timeframes.length} timeframes × ${outfits.length} outfits = ${workload * Math.max(outfits.length, 1)} SMA evaluations`;
  persistConfig();
}

function handleScan({ quick = false } = {}) {
  const provider = getProviderById(dom.providerSelect.value);
  if (!provider) {
    showToast('Select a data provider first.', 'error');
    return;
  }
  const selections = gatherSelections();
  if (!selections.tickers.length) {
    showToast('Add at least one ticker.', 'error');
    return;
  }
  if (!selections.timeframes.length) {
    showToast('Select at least one timeframe.', 'error');
    return;
  }
  if (!selections.outfits.length) {
    showToast('Select at least one SMA outfit.', 'error');
    return;
  }

  const workload = selections.tickers.length * selections.timeframes.length;
  if (!quick && workload > MAX_WORKLOAD) {
    showToast(`Workload (${workload}) exceeds the safe cap (${MAX_WORKLOAD}). Trim tickers or timeframes.`, 'error');
    return;
  }

  const apiKey = localState.apiKeys[provider.id] ?? dom.apiKeyInput.value.trim();
  if (provider.requiresKey && !apiKey) {
    showToast(`${provider.name} needs an API key.`, 'error');
    return;
  }

  const tickers = quick ? selections.tickers.slice(0, 5) : selections.tickers;
  const timeframes = quick ? selections.timeframes.slice(0, 2) : selections.timeframes;
  const outfits = quick ? selections.outfits.slice(0, 3) : selections.outfits;

  const program = createProgram({
    providerId: provider.id,
    providerName: provider.name,
    tickers,
    timeframes,
    outfits
  });
  appendLog(program.id, `Program started with ${tickers.length} tickers and ${timeframes.length} timeframes.`);
  showToast(`Program ${program.id} started.`, 'info');
  persistConfig();
  renderPrograms();

  runProgram({ program, provider, apiKey, tickers, timeframes, outfits });
}

async function runProgram({ program, provider, apiKey, tickers, timeframes, outfits }) {
  let completed = 0;
  const total = tickers.length * timeframes.length;
  for (const ticker of tickers) {
    if (program.cancelToken.cancelled) break;
    for (const timeframe of timeframes) {
      if (program.cancelToken.cancelled) break;
      try {
        appendLog(program.id, `Fetching ${ticker} @ ${timeframe}`);
        const candles = await provider.fetchSeries({ ticker, timeframe, apiKey });
        if (!candles.length) {
          throw new Error('No candles returned');
        }
        outfits.forEach((outfitName) => {
          const outfitPeriods = SMA_OUTFITS[outfitName];
          const analysis = analyzeOutfit({ ticker, timeframe, outfitName, outfitPeriods, candles });
          appendResult(program.id, analysis);
        });
        completed += 1;
        localState.lastSyncAt = new Date();
        updateProgramStatus(program.id, { progress: { completed, total } });
        renderPrograms();
        appendLog(program.id, `Processed ${ticker} ${timeframe}`);
        renderResults();
        updateHeroMeta();
      } catch (error) {
        appendLog(program.id, `${ticker} ${timeframe}: ${error.message}`, 'error');
        showToast(`${ticker} ${timeframe}: ${error.message}`, 'error');
      }
    }
  }
  const status = program.cancelToken.cancelled ? 'cancelled' : 'completed';
  updateProgramStatus(program.id, { status });
  appendLog(program.id, `Program ${status}.`);
  showToast(`Program ${program.id} ${status}.`, status === 'completed' ? 'success' : 'warning');
  renderPrograms();
  updateHeroMeta();
}

function renderPrograms() {
  const state = getState();
  if (!state.programs.length) {
    dom.programList.innerHTML = '<p class="empty">No active programs yet. Launch a scan to populate this view.</p>';
    dom.activeProgramCount.textContent = '0 active programs';
    return;
  }
  dom.programList.innerHTML = '';
  const activeCount = state.programs.filter((program) => program.status === 'running').length;
  dom.activeProgramCount.textContent = `${activeCount} active program${activeCount === 1 ? '' : 's'}`;
  state.programs.forEach((program) => {
    const card = document.createElement('article');
    card.className = 'program-card';
    card.innerHTML = `
      <header>
        <div>
          <p class="eyebrow">${program.id}</p>
          <h3>${program.providerName}</h3>
        </div>
        <span class="status ${program.status}">${program.status}</span>
      </header>
      <p>${program.tickers.length} tickers · ${program.timeframes.length} timeframes · ${program.outfits.length} outfits</p>
      <div class="progress">
        <div style="width: ${program.progress.percent ?? 0}%"></div>
      </div>
      <footer>
        <small>Started ${formatDate(program.createdAt)}</small>
        ${program.status === 'running' ? `<button data-cancel="${program.id}">Cancel</button>` : ''}
      </footer>
    `;
    dom.programList.appendChild(card);
  });

  dom.programList.querySelectorAll('button[data-cancel]').forEach((button) => {
    button.addEventListener('click', () => {
      const programId = button.getAttribute('data-cancel');
      markCancelled(programId);
      appendLog(programId, 'Cancellation requested.', 'warning');
      renderPrograms();
    });
  });
}

function renderResults() {
  const state = getState();
  if (!state.results.length) {
    dom.resultsGrid.innerHTML = '<p class="empty">No SMA signals yet. Run a scan to populate this section.</p>';
    return;
  }
  dom.resultsGrid.innerHTML = '';
  state.results.forEach((result) => {
    const card = document.createElement('article');
    card.className = 'result-card';
    card.innerHTML = `
      <header>
        <div>
          <p class="eyebrow">${result.ticker} · ${result.timeframe}</p>
          <h3>${result.outfitName}</h3>
        </div>
        <span class="badge ${result.signal.type}">${result.signal.type}</span>
      </header>
      <ul>
        <li><strong>Last Price</strong><span>${formatNumber(result.latestPrice)}</span></li>
        <li><strong>Sample</strong><span>${formatDate(result.latestTime)}</span></li>
        <li><strong>Alignment</strong><span>${result.alignment}</span></li>
        <li><strong>Signal</strong><span>${result.signal.detail}</span></li>
      </ul>
      <details>
        <summary>View SMA stack</summary>
        <div class="stack-list">
          ${result.stacks.map((stack) => `<p>${stack.period}: ${formatNumber(stack.latest)}</p>`).join('')}
        </div>
      </details>
    `;
    dom.resultsGrid.appendChild(card);
  });
}

function loadPreferences() {
  try {
    const storedKeys = JSON.parse(localStorage.getItem(STORAGE_KEYS.apiKeys));
    if (storedKeys) {
      localState.apiKeys = storedKeys;
    }
  } catch (error) {
    console.warn('Unable to parse stored API keys', error);
  }
  try {
    const config = JSON.parse(localStorage.getItem(STORAGE_KEYS.lastConfig));
    if (config) {
      localState.lastConfig = config;
      dom.providerSelect.value = config.providerId ?? dom.providerSelect.value;
      dom.tickerInput.value = config.tickers ?? dom.tickerInput.value;
      localState.remember = config.remember ?? true;
      dom.rememberKey.checked = localState.remember;
      updateProviderDetails(getProviderById(dom.providerSelect.value));
      applySelection(dom.timeframeList, config.timeframes);
      applySelection(dom.outfitList, config.outfits);
    }
  } catch (error) {
    console.warn('Unable to parse stored config', error);
  }
}

function applySelection(container, values = []) {
  if (!values.length) return;
  container.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = values.includes(checkbox.value);
  });
}

function persistConfig() {
  const config = {
    providerId: dom.providerSelect.value,
    tickers: dom.tickerInput.value,
    timeframes: [...dom.timeframeList.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value),
    outfits: [...dom.outfitList.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value),
    remember: dom.rememberKey.checked
  };
  localStorage.setItem(STORAGE_KEYS.lastConfig, JSON.stringify(config));
}

function updateHeroMeta() {
  if (localState.lastSyncAt) {
    dom.lastSync.textContent = `Last sync ${formatDate(localState.lastSyncAt)}`;
  }
}

function showToast(message, type = 'info') {
  if (!dom.toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('show');
  }, 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
