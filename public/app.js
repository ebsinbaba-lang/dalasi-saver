const STORAGE_KEY = 'dalasi_saver_ledger_v1';
const VISIBILITY_KEY = 'dalasi_saver_show_balance';
let pendingBalanceToSave = null;
let selectedCashpowerFreq = 'weekly';

const calculateBtn = document.getElementById('calculate-btn');
const resultModal = document.getElementById('result-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const savePlanBtn = document.getElementById('save-plan-btn');
const cancelPlanBtn = document.getElementById('cancel-plan-btn');
const resetStorageBtn = document.getElementById('reset-storage-btn');

const freqWeeklyBtn = document.getElementById('freq-weekly');
const freqDailyBtn = document.getElementById('freq-daily');
const freqFeedback = document.getElementById('freq-feedback');

const savedBanner = document.getElementById('saved-banner');
const savedBalanceDisplay = document.getElementById('saved-balance-display');
const toggleVisibilityCheckbox = document.getElementById('toggle-balance-visibility');
const visibilityText = document.getElementById('visibility-text');
const incomeLabel = document.getElementById('income-label');

const waveSmsInput = document.getElementById('wave-sms-input');
const waveStatus = document.getElementById('wave-status');
const incomeInput = document.getElementById('monthly-income');
const manualSpendInput = document.getElementById('manual-spend');

let lastParsedSms = '';

freqWeeklyBtn.addEventListener('click', () => {
    selectedCashpowerFreq = 'weekly';
    freqWeeklyBtn.classList.add('active');
    freqDailyBtn.classList.remove('active');
    freqFeedback.innerText = '✓ Weekly Cashpower selected';
});

freqDailyBtn.addEventListener('click', () => {
    selectedCashpowerFreq = 'daily';
    freqDailyBtn.classList.add('active');
    freqWeeklyBtn.classList.remove('active');
    freqFeedback.innerText = '✓ Daily Cashpower selected';
});

function getSavedLedger() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function isBalanceVisible() {
    const pref = localStorage.getItem(VISIBILITY_KEY);
    return pref === null ? true : pref === 'true';
}

function refreshSavedBanner() {
    const saved = getSavedLedger();
    if (saved && typeof saved.remainingBalance === 'number') {
        savedBanner.style.display = 'flex';
        const bal = saved.remainingBalance;
        const show = isBalanceVisible();

        toggleVisibilityCheckbox.checked = show;

        if (bal < 0) {
            savedBanner.classList.add('negative');
            savedBalanceDisplay.style.color = '#e53e3e';
            savedBalanceDisplay.innerText = show ? `-D${Math.abs(bal).toLocaleString()}` : 'D •••••';
        } else {
            savedBanner.classList.remove('negative');
            savedBalanceDisplay.style.color = '#2b8a3e';
            savedBalanceDisplay.innerText = show ? `+D${bal.toLocaleString()}` : 'D •••••';
        }

        visibilityText.innerText = show ? '👁️ Show Saved Balance' : '🙈 Saved Balance Hidden';
        incomeLabel.innerText = 'Add New Monthly Salary (Optional - adds to saved balance)';
        incomeInput.placeholder = 'Leave blank unless adding new salary';
    } else {
        savedBanner.style.display = 'none';
        incomeLabel.innerText = 'Your Monthly Income (GMD)';
        incomeInput.placeholder = 'Example: 15000';
    }
}

toggleVisibilityCheckbox.addEventListener('change', () => {
    localStorage.setItem(VISIBILITY_KEY, toggleVisibilityCheckbox.checked ? 'true' : 'false');
    refreshSavedBanner();
});

function clearEntryFields() {
    incomeInput.value = '';
    manualSpendInput.value = '';
    document.getElementById('oneway-fare').value = '';
    document.getElementById('return-fare').value = '';
    document.getElementById('daily-fishmoney').value = '';
    document.getElementById('monthly-rent').value = '';
    document.getElementById('cashpower-amount').value = '';
    document.getElementById('food-maintenance').value = '';
    waveSmsInput.value = '';
    waveStatus.innerText = '';
    lastParsedSms = '';
}

refreshSavedBanner();

resetStorageBtn.addEventListener('click', () => {
    if (confirm('Clear your saved balance and start fresh?')) {
        localStorage.removeItem(STORAGE_KEY);
        clearEntryFields();
        refreshSavedBanner();
    }
});

function handleWaveSms() {
    const text = waveSmsInput.value.trim();
    if (!text) {
        lastParsedSms = '';
        waveStatus.innerText = '';
        return;
    }
    if (text === lastParsedSms) return;

    const amountMatch = text.match(/(?:D|GMD)\s*([\d,]+(?:\.\d+)?)/i) || text.match(/([\d,]+(?:\.\d+)?)\s*(?:D|GMD)/i);
    const rawNumStr = amountMatch ? amountMatch.at(1) : null;

    if (rawNumStr) {
        const cleanAmount = Math.round(parseFloat(rawNumStr.replace(/,/g, '')));
        if (!isNaN(cleanAmount) && cleanAmount > 0) {
            lastParsedSms = text;
            const isIncoming = /(?:received|deposit|credited|from\s+wave)/i.test(text);

            if (isIncoming) {
                const currentIncome = parseFloat(incomeInput.value) || 0;
                incomeInput.value = currentIncome + cleanAmount;
                waveStatus.style.color = '#2b8a3e';
                waveStatus.innerText = `✅ Added +D${cleanAmount.toLocaleString()} to Salary / Balance`;
            } else {
                const currentSpend = parseFloat(manualSpendInput.value) || 0;
                manualSpendInput.value = currentSpend + cleanAmount;
                waveStatus.style.color = '#e53e3e';
                waveStatus.innerText = `✅ Recorded -D${cleanAmount.toLocaleString()} Wave deduction`;
            }
        }
    } else {
        waveStatus.style.color = '#dd6b20';
        waveStatus.innerText = '⚠️ Could not detect a Dalasi (D) amount in that message.';
    }
}

waveSmsInput.addEventListener('input', handleWaveSms);
waveSmsInput.addEventListener('paste', () => setTimeout(handleWaveSms, 50));

function renderResults(netBalance, totalOutflow, food, familyFish, transport, housingBills, riceBags) {
    pendingBalanceToSave = netBalance;

    const balanceEl = document.getElementById('res-balance');
    const balanceCard = document.getElementById('balance-card');

    if (netBalance < 0) {
        balanceEl.innerText = `-D${Math.abs(netBalance).toLocaleString()}`;
        balanceEl.style.color = '#e53e3e';
        balanceCard.style.borderLeftColor = '#e53e3e';
    } else {
        balanceEl.innerText = `+D${netBalance.toLocaleString()}`;
        balanceEl.style.color = '#2b8a3e';
        balanceCard.style.borderLeftColor = '#2b8a3e';
    }

    document.getElementById('res-outflow').innerText = `D${totalOutflow.toLocaleString()}`;
    document.getElementById('res-food').innerText = `D${food.toLocaleString()}`;
    document.getElementById('res-family').innerText = `D${familyFish.toLocaleString()}`;
    document.getElementById('res-transport').innerText = `D${transport.toLocaleString()}`;
    document.getElementById('res-bills').innerText = `D${housingBills.toLocaleString()}`;
    document.getElementById('res-rice').innerText = `${riceBags} Bag${riceBags === 1 ? '' : 's'} of Rice`;

    resultModal.style.display = 'flex';
}

calculateBtn.addEventListener('click', () => {
    const saved = getSavedLedger();
    const existingBalance = saved ? saved.remainingBalance : 0;

    const newIncome = parseFloat(incomeInput.value) || 0;
    const spend = parseFloat(manualSpendInput.value) || 0;
    const oneway = parseFloat(document.getElementById('oneway-fare').value) || 0;
    const returnF = parseFloat(document.getElementById('return-fare').value) || 0;
    const dailyFish = parseFloat(document.getElementById('daily-fishmoney').value) || 0;
    const rent = parseFloat(document.getElementById('monthly-rent').value) || 0;
    const cashpowerAmt = parseFloat(document.getElementById('cashpower-amount').value) || 0;
    const food = parseFloat(document.getElementById('food-maintenance').value) || 0;

    if (!saved && newIncome <= 0) {
        alert("Please enter a valid monthly income greater than 0.");
        return;
    }

    const startingFunds = existingBalance + newIncome;

    const transport = Math.round((oneway + returnF) * 26);
    const familyFish = Math.round(dailyFish * 30);
    const monthlyCashpower = selectedCashpowerFreq === 'daily' ? cashpowerAmt * 30 : cashpowerAmt * 4;
    const housingBills = Math.round(rent + monthlyCashpower);
    const foodVal = Math.round(food);
    const totalOutflow = Math.round(spend + transport + familyFish + housingBills + foodVal);

    const updatedBalance = Math.round(startingFunds - totalOutflow);
    const riceBags = Math.floor(Math.max(0, updatedBalance) / 2500);

    renderResults(updatedBalance, totalOutflow, foodVal, familyFish, transport, housingBills, riceBags);
});

savePlanBtn.addEventListener('click', () => {
    if (pendingBalanceToSave !== null) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            remainingBalance: pendingBalanceToSave,
            updatedAt: new Date().toISOString()
        }));
        clearEntryFields();
        refreshSavedBanner();
    }
    resultModal.style.display = 'none';
});

cancelPlanBtn.addEventListener('click', () => {
    pendingBalanceToSave = null;
    resultModal.style.display = 'none';
});

closeModalBtn.addEventListener('click', () => {
    pendingBalanceToSave = null;
    resultModal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === resultModal) {
        pendingBalanceToSave = null;
        resultModal.style.display = 'none';
    }
});

// Register Service Worker for Offline & Home Screen App Support
// 1. Register Service Worker for Offline & Cross-Device App Installation
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => reg.update())
            .catch(() => {});
    });
}

// 2. Generate a Guaranteed Square 512x512 PNG Manifest Icon from /icon.png
// (Fixes rectangular image rejection in Chrome/Edge on Laptop, Android & iPad)
(function ensureSquareManifestIcon() {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Fill dark navy background matching your icon
        ctx.fillStyle = '#050d1a';
        ctx.fillRect(0, 0, 512, 512);

        // Center-crop image cleanly into a 512x512 square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 512, 512);

        const squarePngUrl = canvas.toDataURL('image/png');

        const manifestObj = {
            name: 'Dalasi Saver',
            short_name: 'Dalasi Saver',
            description: 'Smart Local Budgeting & Wave Assistant for The Gambia',
            start_url: window.location.origin + '/',
            scope: window.location.origin + '/',
            display: 'standalone',
            orientation: 'portrait',
            background_color: '#050d1a',
            theme_color: '#050d1a',
            icons: [
                { src: squarePngUrl, sizes: '192x192', type: 'image/png', purpose: 'any' },
                { src: squarePngUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
            ]
        };

        const blob = new Blob([JSON.stringify(manifestObj)], { type: 'application/manifest+json' });
        const manifestUrl = URL.createObjectURL(blob);
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            manifestLink.href = manifestUrl;
        }
    };
    img.src = '/icon.png?v=3';
})();

// 3. Cross-Device Download / Install Banner (Laptop, iPad, iPhone & Android)
let deferredInstallPrompt = null;
const installBanner = document.getElementById('install-banner');
const installAppBtn = document.getElementById('install-app-btn');
const dismissInstallBtn = document.getElementById('dismiss-install-btn');
const INSTALLED_FLAG = 'dalasi_saver_installed_v1';

// Hide banner if opened as an installed app OR already marked installed
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
if (isStandalone) {
    localStorage.setItem(INSTALLED_FLAG, 'true');
}

if (!isStandalone && localStorage.getItem(INSTALLED_FLAG) !== 'true' && installBanner) {
    installBanner.style.display = 'flex';

    // Capture native one-click install prompt on Laptop (Chrome/Edge) & Android
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
    });

    installAppBtn.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            const { outcome } = await deferredInstallPrompt.userChoice;
            if (outcome === 'accepted') {
                localStorage.setItem(INSTALLED_FLAG, 'true');
                installBanner.style.display = 'none';
            }
            deferredInstallPrompt = null;
        } else {
            // Device-specific 1-tap instructions for iPad, iPhone, or browsers without auto-prompt
            const ua = window.navigator.userAgent;
            const isAppleMobile = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

            if (isAppleMobile) {
                alert('To install Dalasi Saver on your iPhone or iPad:\n\n1. Tap the Share button (⎋) in Safari.\n2. Scroll down and tap "Add to Home Screen".\n\nOnce added, open it from your Home Screen and the Download button will disappear!');
            } else {
                alert('To install Dalasi Saver on your Laptop or Phone:\n\n• On Laptop (Chrome/Edge): Click the Install icon (⊕ or 💻) at the right end of your top address bar.\n• On Android: Tap the 3 dots (⋮) in the top-right corner and tap "Install app".');
            }
        }
    });

    // Permanently hide banner once installation completes
    window.addEventListener('appinstalled', () => {
        localStorage.setItem(INSTALLED_FLAG, 'true');
        installBanner.style.display = 'none';
        deferredInstallPrompt = null;
    });

    dismissInstallBtn.addEventListener('click', () => {
        installBanner.style.display = 'none';
    });
}
