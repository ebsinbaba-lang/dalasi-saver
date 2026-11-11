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

// Direct File Download (Saves standalone Dalasi-Saver.html to Downloads folder)
const installBanner = document.getElementById('install-banner');
const installAppBtn = document.getElementById('install-app-btn');
const dismissInstallBtn = document.getElementById('dismiss-install-btn');

// Detect if opened from a local downloaded file or standalone mode
const isLocalFile = window.location.protocol === 'file:';
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

if (!isLocalFile && !isStandalone && installBanner) {
    installBanner.style.display = 'flex';

    installAppBtn.addEventListener('click', async () => {
        installAppBtn.innerText = 'Downloading...';
        try {
            const [cssRes, jsRes] = await Promise.all([
                fetch('/style.css'),
                fetch('/app.js')
            ]);
            const cssText = await cssRes.text();
            const jsText = await jsRes.text();

            // Clone current page and bundle CSS + JS inline for 100% offline use
            const docClone = document.documentElement.cloneNode(true);
            const bannerInClone = docClone.querySelector('#install-banner');
            if (bannerInClone) bannerInClone.remove();

            const extCss = docClone.querySelector('link[href="/style.css"]');
            if (extCss) {
                const inlineStyle = document.createElement('style');
                inlineStyle.textContent = cssText;
                extCss.replaceWith(inlineStyle);
            }

            const extScript = docClone.querySelector('script[src="/app.js"]');
            if (extScript) {
                const inlineScript = document.createElement('script');
                inlineScript.textContent = jsText;
                extScript.replaceWith(inlineScript);
            }

            const fullHtml = '<!DOCTYPE html>\n' + docClone.outerHTML;
            const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
            const downloadUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = 'Dalasi-Saver.html';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);

            installBanner.style.display = 'none';
        } catch (err) {
            alert('Download failed. Please check your connection and try again.');
        } finally {
            installAppBtn.innerText = 'Download';
        }
    });

    dismissInstallBtn.addEventListener('click', () => {
        installBanner.style.display = 'none';
    });
}
