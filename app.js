// Main Application Logic

let isScanning = false;
let activeScans = [];
let scanResults = [];
let scanInterval = null;

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    initializeUI();
    loadSavedConfig();
});

function initializeUI() {
    // API Provider selector
    const apiProvider = document.getElementById('apiProvider');
    const apiKeyInput = document.getElementById('apiKey');
    const apiInfo = document.getElementById('apiInfo');
    const apiKeyContainer = document.getElementById('apiKeyContainer');

    // Load saved API config
    apiProvider.value = currentApiConfig.provider || 'yahoo';
    apiKeyInput.value = currentApiConfig.apiKey || '';
    updateApiInfo();

    apiProvider.addEventListener('change', () => {
        currentApiConfig.provider = apiProvider.value;
        updateApiInfo();
    });

    apiKeyInput.addEventListener('input', () => {
        currentApiConfig.apiKey = apiKeyInput.value;
    });

    function updateApiInfo() {
        const config = API_CONFIGS[apiProvider.value];
        if (config) {
            apiInfo.textContent = config.info;
            if (config.requiresKey && config.name !== 'Yahoo Finance') {
                apiKeyContainer.style.display = 'block';
            } else {
                apiKeyContainer.style.display = 'none';
            }
        }
    }

    // Save API config button
    document.getElementById('saveApiConfig').addEventListener('click', () => {
        saveApiConfig();
        showNotification('API configuration saved!', 'success');
    });

    // Scan controls
    document.getElementById('startScan').addEventListener('click', startScan);
    document.getElementById('stopScan').addEventListener('click', stopScan);
    document.getElementById('clearResults').addEventListener('click', clearResults);
}

function loadSavedConfig() {
    // Load any saved scanner configuration
    const saved = localStorage.getItem('smaScannerConfig');
    if (saved) {
        try {
            const config = JSON.parse(saved);
            if (config.stocks) {
                document.getElementById('stockList').value = config.stocks.join(', ');
            }
        } catch (e) {
            console.error('Error loading saved config:', e);
        }
    }
}

function getSelectedTimeframes() {
    const checkboxes = document.querySelectorAll('#timeframes input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function getSelectedSMAOutfits() {
    const checkboxes = document.querySelectorAll('#smaOutfits input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function getStockList() {
    const stockListInput = document.getElementById('stockList').value;
    return stockListInput
        .split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);
}

async function startScan() {
    if (isScanning) {
        return;
    }

    const stocks = getStockList();
    const timeframes = getSelectedTimeframes();
    const outfits = getSelectedSMAOutfits();

    if (stocks.length === 0) {
        showNotification('Please enter at least one stock symbol', 'error');
        return;
    }

    if (timeframes.length === 0) {
        showNotification('Please select at least one timeframe', 'error');
        return;
    }

    if (outfits.length === 0) {
        showNotification('Please select at least one SMA outfit', 'error');
        return;
    }

    // Save configuration
    const config = {
        stocks: stocks,
        timeframes: timeframes,
        outfits: outfits
    };
    localStorage.setItem('smaScannerConfig', JSON.stringify(config));

    isScanning = true;
    scanResults = [];
    activeScans = [];

    // Update UI
    document.getElementById('startScan').disabled = true;
    document.getElementById('stopScan').disabled = false;
    document.getElementById('resultsContainer').innerHTML = '<p class="no-results">Scanning in progress...</p>';

    // Create scan tasks
    const totalScans = stocks.length * timeframes.length * outfits.length;
    let completedScans = 0;

    showNotification(`Starting scan: ${stocks.length} stocks × ${timeframes.length} timeframes × ${outfits.length} outfits = ${totalScans} analyses`, 'success');

    // Process scans in batches to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < stocks.length; i += batchSize) {
        if (!isScanning) break;

        const batch = stocks.slice(i, i + batchSize);
        const promises = [];

        for (const symbol of batch) {
            for (const timeframe of timeframes) {
                for (const outfit of outfits) {
                    if (!isScanning) break;

                    const scanId = `${symbol}-${timeframe}-${outfit}`;
                    addActiveScan(scanId, symbol, timeframe, outfit);

                    const promise = analyzeStock(symbol, [timeframe], [outfit], currentApiConfig.apiKey)
                        .then(results => {
                            completedScans++;
                            removeActiveScan(scanId);
                            
                            if (results.length > 0) {
                                scanResults.push(...results);
                                updateResultsDisplay();
                            }

                            // Update progress
                            if (completedScans % 10 === 0 || completedScans === totalScans) {
                                showNotification(`Progress: ${completedScans}/${totalScans} analyses completed`, 'success');
                            }
                        })
                        .catch(error => {
                            removeActiveScan(scanId);
                            console.error(`Error scanning ${symbol}:`, error);
                        });

                    promises.push(promise);

                    // Add delay to respect API rate limits
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
        }

        // Wait for batch to complete
        await Promise.all(promises);
        
        // Add delay between batches
        if (i + batchSize < stocks.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Scan complete
    isScanning = false;
    document.getElementById('startScan').disabled = false;
    document.getElementById('stopScan').disabled = true;

    if (scanResults.length === 0) {
        document.getElementById('resultsContainer').innerHTML = '<p class="no-results">No signals detected. Try different stocks, timeframes, or SMA outfits.</p>';
    } else {
        showNotification(`Scan complete! Found ${scanResults.length} signal(s)`, 'success');
    }
}

function stopScan() {
    isScanning = false;
    activeScans = [];
    document.getElementById('startScan').disabled = false;
    document.getElementById('stopScan').disabled = true;
    document.getElementById('activeScansList').innerHTML = '<p class="no-scans">No active scans running</p>';
    showNotification('Scan stopped', 'warning');
}

function clearResults() {
    scanResults = [];
    updateResultsDisplay();
    showNotification('Results cleared', 'success');
}

function addActiveScan(scanId, symbol, timeframe, outfit) {
    const scan = {
        id: scanId,
        symbol: symbol,
        timeframe: timeframe,
        outfit: outfit,
        startTime: new Date()
    };
    activeScans.push(scan);
    updateActiveScansDisplay();
}

function removeActiveScan(scanId) {
    activeScans = activeScans.filter(scan => scan.id !== scanId);
    updateActiveScansDisplay();
}

function updateActiveScansDisplay() {
    const container = document.getElementById('activeScansList');
    
    if (activeScans.length === 0) {
        container.innerHTML = '<p class="no-scans">No active scans running</p>';
        return;
    }

    container.innerHTML = activeScans.map(scan => `
        <div class="scan-item">
            <div class="scan-item-info">
                <div class="scan-item-title">${scan.symbol} - ${scan.timeframe}</div>
                <div class="scan-item-details">SMA Outfit: ${scan.outfit}</div>
            </div>
            <div class="scan-item-status">
                <span class="spinner"></span> Scanning...
            </div>
        </div>
    `).join('');
}

function updateResultsDisplay() {
    const container = document.getElementById('resultsContainer');
    
    if (scanResults.length === 0) {
        container.innerHTML = '<p class="no-results">No results yet. Start a scan to see SMA outfit signals.</p>';
        return;
    }

    // Group results by symbol and timeframe
    const grouped = {};
    scanResults.forEach(result => {
        const key = `${result.symbol}-${result.timeframe}`;
        if (!grouped[key]) {
            grouped[key] = {
                symbol: result.symbol,
                timeframe: result.timeframe,
                signals: []
            };
        }
        grouped[key].signals.push(result.signals);
    });

    container.innerHTML = Object.values(grouped).map(group => {
        const allSignals = group.signals.flatMap(s => s.signals);
        const buySignals = allSignals.filter(s => s.strength === 'STRONG_BUY' || s.type === 'GOLDEN_CROSS' || (s.type === 'SYSTEM_SIGNAL' && s.signal === 'POSITIVE'));
        const sellSignals = allSignals.filter(s => s.strength === 'STRONG_SELL' || s.type === 'DEATH_CROSS' || (s.type === 'SYSTEM_SIGNAL' && s.signal === 'NEGATIVE'));
        
        return `
            <div class="result-item">
                <div class="result-header">
                    <div>
                        <span class="result-symbol">${group.symbol}</span>
                        <span class="result-timeframe">${group.timeframe}</span>
                    </div>
                    <div>
                        ${buySignals.length > 0 ? `<span style="color: var(--success-color); font-weight: 700;">${buySignals.length} BUY</span>` : ''}
                        ${sellSignals.length > 0 ? `<span style="color: var(--danger-color); font-weight: 700;">${sellSignals.length} SELL</span>` : ''}
                    </div>
                </div>
                ${group.signals.map(signalData => `
                    <div style="margin-top: 15px;">
                        <div class="result-outfit">${signalData.outfitName} (${signalData.outfit})</div>
                        <div class="result-signals">
                            <div class="signal-item">
                                <span class="signal-label">Current Price:</span>
                                <span class="signal-value">$${signalData.currentPrice.toFixed(2)}</span>
                            </div>
                            ${signalData.signals.map(signal => `
                                <div class="signal-item">
                                    <span class="signal-label ${signal.strength === 'STRONG_BUY' ? 'signal-buy' : signal.strength === 'STRONG_SELL' ? 'signal-sell' : ''}">
                                        ${signal.type === 'GOLDEN_CROSS' ? '🟢 ' : signal.type === 'DEATH_CROSS' ? '🔴 ' : signal.type === 'SYSTEM_SIGNAL' ? '⚡ ' : '📊 '}
                                        ${signal.message}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }).join('');
}

function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
