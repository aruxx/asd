// Main Application Controller

let apiHandler = null;
let scanner = null;
let currentConfig = {
    provider: 'yahoo',
    apiKey: null,
    notificationsEnabled: true
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadSavedConfig();
    initializeUI();
    setupEventListeners();
});

function loadSavedConfig() {
    const saved = localStorage.getItem('smaScannerConfig');
    if (saved) {
        try {
            currentConfig = JSON.parse(saved);
            document.getElementById('apiProvider').value = currentConfig.provider;
            if (currentConfig.apiKey) {
                document.getElementById('apiKey').value = currentConfig.apiKey;
            }
            if (currentConfig.provider === 'custom' || 
                (currentConfig.provider !== 'yahoo' && currentConfig.apiKey)) {
                document.getElementById('apiKeyContainer').style.display = 'block';
            }
            if (currentConfig.notificationsEnabled !== undefined) {
                document.getElementById('enableNotifications').checked = currentConfig.notificationsEnabled;
            }
        } catch (e) {
            console.error('Error loading saved config:', e);
        }
    }
}

function saveConfig() {
    localStorage.setItem('smaScannerConfig', JSON.stringify(currentConfig));
}

function initializeUI() {
    updateAPIKeyVisibility();
    updateActiveProgramsDisplay();
    updateResultsDisplay();
}

function setupEventListeners() {
    // API Provider change
    document.getElementById('apiProvider').addEventListener('change', (e) => {
        currentConfig.provider = e.target.value;
        updateAPIKeyVisibility();
    });

    // Save API Config
    document.getElementById('saveApiConfig').addEventListener('click', () => {
        const provider = document.getElementById('apiProvider').value;
        const apiKey = document.getElementById('apiKey').value.trim();
        
        if (provider !== 'yahoo' && provider !== 'custom' && !apiKey) {
            showNotification('Please enter an API key for the selected provider', 'error');
            return;
        }

        currentConfig.provider = provider;
        currentConfig.apiKey = apiKey || null;
        saveConfig();
        
        try {
            apiHandler = new APIHandler(currentConfig.provider, currentConfig.apiKey);
            showNotification('API configuration saved successfully!', 'success');
        } catch (error) {
            showNotification(`Error initializing API: ${error.message}`, 'error');
        }
    });

    // Start Scan
    document.getElementById('startScan').addEventListener('click', startScanning);

    // Stop Scan
    document.getElementById('stopScan').addEventListener('click', () => {
        if (scanner) {
            scanner.stopScan();
            document.getElementById('startScan').disabled = false;
            document.getElementById('stopScan').disabled = true;
            showNotification('Scanning stopped', 'warning');
        }
    });

    // Clear Results
    document.getElementById('clearResults').addEventListener('click', () => {
        if (scanner) {
            scanner.clearResults();
        }
        updateResultsDisplay();
        updateActiveProgramsDisplay();
        showNotification('Results cleared', 'success');
    });

    // Filter controls
    document.getElementById('filterTicker').addEventListener('input', updateResultsDisplay);
    document.getElementById('filterTimeframe').addEventListener('change', updateResultsDisplay);
}

function updateAPIKeyVisibility() {
    const provider = document.getElementById('apiProvider').value;
    const apiKeyContainer = document.getElementById('apiKeyContainer');
    
    if (provider === 'yahoo') {
        apiKeyContainer.style.display = 'none';
    } else {
        apiKeyContainer.style.display = 'block';
        if (provider === 'custom') {
            document.getElementById('apiKey').placeholder = 'Enter your custom API key';
        } else {
            document.getElementById('apiKey').placeholder = 'Enter your API key';
        }
    }
}

async function startScanning() {
    // Initialize API handler if not already done
    if (!apiHandler) {
        const provider = document.getElementById('apiProvider').value;
        const apiKey = document.getElementById('apiKey').value.trim();
        
        if (provider !== 'yahoo' && provider !== 'custom' && !apiKey) {
            showNotification('Please configure and save your API settings first', 'error');
            return;
        }

        try {
            apiHandler = new APIHandler(provider, apiKey || null);
        } catch (error) {
            showNotification(`Error initializing API: ${error.message}`, 'error');
            return;
        }
    }

    // Get configuration
    const tickerInput = document.getElementById('tickerList').value.trim();
    const tickers = tickerInput 
        ? tickerInput.split(',').map(t => t.trim().toUpperCase()).filter(t => t)
        : DEFAULT_TICKERS.slice(0, 10); // Limit to 10 for demo

    const timeframeCheckboxes = document.querySelectorAll('#timeframeGroup input[type="checkbox"]:checked');
    const timeframes = Array.from(timeframeCheckboxes).map(cb => cb.value);

    if (timeframes.length === 0) {
        showNotification('Please select at least one timeframe', 'error');
        return;
    }

    const notificationsEnabled = document.getElementById('enableNotifications').checked;
    currentConfig.notificationsEnabled = notificationsEnabled;
    saveConfig();

    // Initialize scanner
    scanner = new SMAScanner(
        apiHandler,
        SMA_OUTFITS,
        onSignalDetected,
        onScanError
    );

    // Update UI
    document.getElementById('startScan').disabled = true;
    document.getElementById('stopScan').disabled = false;
    document.getElementById('resultsBody').innerHTML = '<p class="empty-state">Scanning in progress...</p>';

    showNotification(`Starting scan: ${tickers.length} tickers, ${timeframes.length} timeframes, ${Object.keys(SMA_OUTFITS).length} outfits`, 'success');

    // Start scan
    try {
        await scanner.startScan(tickers, timeframes, notificationsEnabled);
        showNotification('Scan completed!', 'success');
    } catch (error) {
        showNotification(`Scan error: ${error.message}`, 'error');
    } finally {
        document.getElementById('startScan').disabled = false;
        document.getElementById('stopScan').disabled = true;
        updateResultsDisplay();
        updateActiveProgramsDisplay();
    }
}

function onSignalDetected(result) {
    // Show notification
    const signalType = result.signal.type === 'buy' ? '🟢 BUY' : '🔴 SELL';
    showNotification(
        `${signalType} Signal: ${result.ticker} (${result.timeframe}) - ${result.outfitName}`,
        result.signal.type === 'buy' ? 'success' : 'error'
    );

    // Update displays
    updateResultsDisplay();
    updateActiveProgramsDisplay();
}

function onScanError(error, programId) {
    console.error(`Scan error for ${programId}:`, error);
    // Don't show notification for every error to avoid spam
}

function updateActiveProgramsDisplay() {
    const container = document.getElementById('activePrograms');
    
    if (!scanner) {
        container.innerHTML = '<p class="empty-state">No active programs. Start scanning to begin monitoring.</p>';
        return;
    }

    const programs = scanner.getActivePrograms();
    
    if (programs.length === 0) {
        container.innerHTML = '<p class="empty-state">No active programs detected.</p>';
        return;
    }

    container.innerHTML = programs.map(program => {
        const signalClass = program.signal.type === 'buy' ? 'success' : 'error';
        const signalIcon = program.signal.type === 'buy' ? '🟢' : '🔴';
        const runtime = Math.floor((Date.now() - program.startTime) / 1000);
        const runtimeStr = runtime < 60 ? `${runtime}s` : `${Math.floor(runtime / 60)}m ${runtime % 60}s`;

        return `
            <div class="program-item active">
                <div class="program-info">
                    <div class="program-title">${signalIcon} ${program.ticker} - ${program.timeframe} - ${program.outfitName}</div>
                    <div class="program-details">
                        Signal: ${program.signal.message} | Price: $${program.price.toFixed(2)} | Runtime: ${runtimeStr}
                    </div>
                </div>
                <div class="program-status running">Active</div>
            </div>
        `;
    }).join('');
}

function updateResultsDisplay() {
    if (!scanner) {
        document.getElementById('resultsBody').innerHTML = '<p class="empty-state">No results yet. Start scanning to see SMA outfit signals.</p>';
        updateStats();
        return;
    }

    const results = scanner.getResults();
    const stats = scanner.getStats();

    // Apply filters
    const tickerFilter = document.getElementById('filterTicker').value.toUpperCase();
    const timeframeFilter = document.getElementById('filterTimeframe').value;

    const filteredResults = results.filter(r => {
        const matchTicker = !tickerFilter || r.ticker.includes(tickerFilter);
        const matchTimeframe = !timeframeFilter || r.timeframe === timeframeFilter;
        return matchTicker && matchTimeframe;
    });

    // Update stats
    updateStats(stats, filteredResults);

    // Display results
    if (filteredResults.length === 0) {
        document.getElementById('resultsBody').innerHTML = '<p class="empty-state">No results match the current filters.</p>';
        return;
    }

    // Sort by timestamp (newest first)
    filteredResults.sort((a, b) => b.timestamp - a.timestamp);

    document.getElementById('resultsBody').innerHTML = filteredResults.map(result => {
        const signalClass = result.signal.type === 'buy' ? 'buy' : result.signal.type === 'sell' ? 'sell' : 'neutral';
        const signalText = result.signal.type === 'buy' ? 'BUY' : result.signal.type === 'sell' ? 'SELL' : 'NEUTRAL';
        const statusClass = result.status === 'active' ? 'active' : 'inactive';
        const date = new Date(result.timestamp);
        const timeStr = date.toLocaleTimeString();

        // Format SMA values
        const smaValues = Object.entries(result.smas)
            .filter(([_, v]) => v !== null)
            .map(([p, v]) => `MA${p}: $${v.toFixed(2)}`)
            .join(', ');

        return `
            <div class="result-row">
                <div class="col-ticker">${result.ticker}</div>
                <div class="col-timeframe">${result.timeframe}</div>
                <div class="col-outfit" title="${result.outfitName}">${result.outfit}</div>
                <div class="col-signal">
                    <span class="signal-badge signal-${signalClass}">${signalText}</span>
                    <small style="display: block; margin-top: 4px; color: var(--text-secondary); font-size: 0.8rem;">
                        ${result.signal.message}
                    </small>
                </div>
                <div class="col-status">
                    <span class="status-indicator status-${statusClass}"></span>
                    ${result.status}
                </div>
                <div class="col-time">${timeStr}</div>
            </div>
        `;
    }).join('');
}

function updateStats(stats = null, filteredResults = null) {
    if (!stats && scanner) {
        stats = scanner.getStats();
    }

    if (stats) {
        document.getElementById('totalScans').textContent = `Total Scans: ${stats.totalScans}`;
        document.getElementById('activeSignals').textContent = `Active Signals: ${stats.activeSignals}`;
        document.getElementById('lastUpdate').textContent = stats.lastUpdate 
            ? `Last Update: ${new Date(stats.lastUpdate).toLocaleTimeString()}`
            : 'Last Update: Never';
    } else {
        document.getElementById('totalScans').textContent = 'Total Scans: 0';
        document.getElementById('activeSignals').textContent = 'Active Signals: 0';
        document.getElementById('lastUpdate').textContent = 'Last Update: Never';
    }
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    notification.innerHTML = `
        <div class="notification-title">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${type.toUpperCase()}</div>
        <div class="notification-message">${message}</div>
    `;

    container.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);

    // Click to dismiss
    notification.addEventListener('click', () => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    });
}

// Periodic update of active programs display
setInterval(() => {
    if (scanner) {
        updateActiveProgramsDisplay();
    }
}, 5000); // Update every 5 seconds
