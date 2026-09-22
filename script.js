// LocalStorage Key
const STORAGE_KEY = 'FINANCAS_META_CUSTOM_V4';

// Main State
let appData = {
    income: 0,
    goalTotal: 0,
    goalMonths: 1,
    simulatedDate: null, // YYYY-MM-DD
    fixedExpenses: [],   // Array of { id, name, amount }
    dailyExpenses: []    // Array of { id, amount, date }
};

// DOM References
const modal = document.getElementById('budget-modal');
const budgetForm = document.getElementById('budget-form');
const inputIncome = document.getElementById('input-income');
const inputGoalTotal = document.getElementById('input-goal-total');
const inputGoalMonths = document.getElementById('input-goal-months');
const modalPreviewMonthly = document.getElementById('modal-preview-monthly');
const modalPreviewDaily = document.getElementById('modal-preview-daily');

// Quick Entry References
const quickForm = document.getElementById('quick-expense-form');
const quickAmount = document.getElementById('quick-amount');
const quickDate = document.getElementById('quick-date');

// Fixed Expense References
const fixedForm = document.getElementById('fixed-expense-form');
const fixedName = document.getElementById('fixed-name');
const fixedAmount = document.getElementById('fixed-amount');
const btnAddFixed = document.getElementById('btn-add-fixed');
const btnCancelFixed = document.getElementById('btn-cancel-fixed');
const fixedListContainer = document.getElementById('fixed-list');
const fixedExpensesSum = document.getElementById('fixed-expenses-sum');

// Card Displays
const cardIncome = document.getElementById('card-income');
const cardFixedTotal = document.getElementById('card-fixed-total');
const cardMonthlySavings = document.getElementById('card-monthly-savings');
const cardDailySavings = document.getElementById('card-daily-savings');
const cardSpendableTotal = document.getElementById('card-spendable-total');
const cardRemainingSpendable = document.getElementById('card-remaining-spendable');
const cardDailyLimit = document.getElementById('card-daily-limit');
const cardDailySubtext = document.getElementById('card-daily-subtext');
const cardDailyContainer = document.getElementById('card-daily-container');
const todayStatusBadge = document.getElementById('today-status-badge');

// Date Display & Navigation
const currentSimulatedDateDisplay = document.getElementById('current-simulated-date-display');
const badgeSimulated = document.getElementById('badge-simulated');
const btnNextDay = document.getElementById('btn-next-day');
const btnToday = document.getElementById('btn-today');

// Export/Import
const btnExport = document.getElementById('btn-export');
const btnImportTrigger = document.getElementById('btn-import-trigger');
const fileImportInput = document.getElementById('file-import');

// Goal Banner Elements
const goalTotalDisplay = document.getElementById('goal-total-display');
const goalMonthlyDisplay = document.getElementById('goal-monthly-display');
const goalDailyDisplay = document.getElementById('goal-daily-display');
const goalMonthsBadge = document.getElementById('goal-months-badge');

// Progress Indicators
const dailyProgressBar = document.getElementById('daily-progress-bar');
const dailyProgressText = document.getElementById('daily-progress-text');
const monthlyProgressBar = document.getElementById('monthly-progress-bar');
const monthlyProgressText = document.getElementById('monthly-progress-text');

// History Table Elements
const dailyTransactionsBody = document.getElementById('daily-transactions-body');
const emptyState = document.getElementById('empty-state');
const dailyCount = document.getElementById('daily-count');
const dailyTotal = document.getElementById('daily-total');
const filterDateInput = document.getElementById('filter-date');
const btnClearFilter = document.getElementById('btn-clear-filter');

// --- UTILITY FUNCTIONS ---
function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function getActiveDateString() {
    return appData.simulatedDate || getTodayDateString();
}

function parseDateString(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    toastMessage.textContent = msg;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none');
    }, 3000);
}

function loadStorage() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            appData = JSON.parse(stored);
        } else {
            appData = {
                income: 5000,
                goalTotal: 6000,
                goalMonths: 6,
                simulatedDate: getTodayDateString(),
                fixedExpenses: [
                    { id: '1', name: 'Aluguel', amount: 1200 },
                    { id: '2', name: 'Luz e Água', amount: 250 },
                    { id: '3', name: 'Internet', amount: 110 }
                ],
                dailyExpenses: []
            };
            saveStorage();
        }
    } catch (e) {
        console.error('Erro ao carregar dados:', e);
    }
}

function saveStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    } catch (e) {
        console.error('Erro ao salvar dados:', e);
    }
}

function calculateMetrics() {
    const totalFixed = appData.fixedExpenses.reduce((acc, item) => acc + item.amount, 0);

    const months = Math.max(1, parseInt(appData.goalMonths) || 1);
    const goalTotal = Math.max(0, parseFloat(appData.goalTotal) || 0);
    
    const monthlySavings = goalTotal / months;
    const dailySavings = goalTotal / (months * 30);

    const spendableTotal = Math.max(0, appData.income - totalFixed - monthlySavings);

    // Filter daily expenses by active date's month and year
    const activeDateStr = getActiveDateString();
    const activeDateObj = parseDateString(activeDateStr);
    const activeYear = activeDateObj.getFullYear();
    const activeMonth = activeDateObj.getMonth();

    const monthlyDailyExpenses = appData.dailyExpenses.filter(item => {
        const itemDate = parseDateString(item.date);
        return itemDate.getFullYear() === activeYear && itemDate.getMonth() === activeMonth;
    });

    const totalDailySpentMonth = monthlyDailyExpenses.reduce((acc, item) => acc + item.amount, 0);
    const remainingSpendable = spendableTotal - totalDailySpentMonth;

    // Days remaining calculation in active simulated month
    const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
    const currentDay = activeDateObj.getDate();
    const daysRemaining = Math.max(1, (daysInMonth - currentDay) + 1);

    const dailyLimit = remainingSpendable > 0 ? remainingSpendable / daysRemaining : 0;

    const activeDaySpent = appData.dailyExpenses
        .filter(exp => exp.date === activeDateStr)
        .reduce((acc, exp) => acc + exp.amount, 0);

    return {
        totalFixed,
        goalTotal,
        months,
        monthlySavings,
        dailySavings,
        spendableTotal,
        totalDailySpentMonth,
        remainingSpendable,
        daysRemaining,
        daysInMonth,
        dailyLimit,
        activeDaySpent,
        activeDateStr
    };
}

function updateUI() {
    const metrics = calculateMetrics();

    // Active Date Header Display
    currentSimulatedDateDisplay.textContent = formatDate(metrics.activeDateStr);
    if (metrics.activeDateStr !== getTodayDateString()) {
        badgeSimulated.classList.remove('hidden');
    } else {
        badgeSimulated.classList.add('hidden');
    }

    // Sync quick expense default date
    quickDate.value = metrics.activeDateStr;

    // Cards
    cardIncome.textContent = formatCurrency(appData.income);
    cardFixedTotal.textContent = formatCurrency(metrics.totalFixed);
    cardMonthlySavings.textContent = `${formatCurrency(metrics.monthlySavings)} /mês`;
    cardDailySavings.textContent = `Guardar ${formatCurrency(metrics.dailySavings)} por dia`;
    cardSpendableTotal.textContent = formatCurrency(metrics.spendableTotal);
    cardDailyLimit.textContent = formatCurrency(metrics.dailyLimit);

    // Goal Banner Detail
    goalTotalDisplay.textContent = formatCurrency(metrics.goalTotal);
    goalMonthlyDisplay.textContent = formatCurrency(metrics.monthlySavings);
    goalDailyDisplay.textContent = formatCurrency(metrics.dailySavings);
    goalMonthsBadge.textContent = `${metrics.months} ${metrics.months === 1 ? 'Mês' : 'Meses'}`;

    // Remaining spendable subtext
    if (metrics.remainingSpendable >= 0) {
        cardRemainingSpendable.textContent = `Saldo restante: ${formatCurrency(metrics.remainingSpendable)}`;
        cardRemainingSpendable.className = 'text-xs text-slate-500 mt-1';
    } else {
        cardRemainingSpendable.textContent = `Excedido: ${formatCurrency(Math.abs(metrics.remainingSpendable))}`;
        cardRemainingSpendable.className = 'text-xs text-red-600 font-semibold mt-1';
    }

    cardDailySubtext.textContent = `Para os ${metrics.daysRemaining} dias restantes no mês`;

    // Today Status Badge & Daily Container
    if (metrics.activeDaySpent <= metrics.dailyLimit || metrics.dailyLimit === 0) {
        todayStatusBadge.textContent = `Gasto no Dia: ${formatCurrency(metrics.activeDaySpent)} (Dentro do Limite)`;
        todayStatusBadge.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 self-start sm:self-auto';
        cardDailyContainer.className = 'bg-blue-800 p-5 rounded-xl shadow-sm text-white flex flex-col justify-between relative overflow-hidden transition-colors duration-300';
    } else {
        todayStatusBadge.textContent = `Gasto no Dia: ${formatCurrency(metrics.activeDaySpent)} (Acima do Limite)`;
        todayStatusBadge.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-900 text-white border border-slate-700 self-start sm:self-auto';
        cardDailyContainer.className = 'bg-slate-900 p-5 rounded-xl shadow-sm text-white flex flex-col justify-between relative overflow-hidden transition-colors duration-300';
    }

    // Daily Progress Bar
    let dailyPercent = metrics.dailyLimit > 0 ? (metrics.activeDaySpent / metrics.dailyLimit) * 100 : 0;
    const displayDailyPercent = Math.round(dailyPercent);
    dailyProgressBar.style.width = `${Math.min(100, dailyPercent)}%`;
    dailyProgressText.textContent = `${displayDailyPercent}% do limite diário`;

    if (dailyPercent > 100) {
        dailyProgressBar.className = 'bg-slate-900 h-3 rounded-full transition-all duration-500';
        dailyProgressText.className = 'text-slate-900 font-bold';
    } else {
        dailyProgressBar.className = 'bg-blue-700 h-3 rounded-full transition-all duration-500';
        dailyProgressText.className = 'text-blue-800 font-semibold';
    }

    // Monthly Progress Bar
    let monthlyPercent = metrics.spendableTotal > 0 ? (metrics.totalDailySpentMonth / metrics.spendableTotal) * 100 : 0;
    const displayMonthlyPercent = Math.min(100, Math.round(monthlyPercent));
    monthlyProgressBar.style.width = `${Math.min(100, monthlyPercent)}%`;
    monthlyProgressText.textContent = `${displayMonthlyPercent}% (${formatCurrency(metrics.totalDailySpentMonth)})`;

    if (monthlyPercent > 100) {
        monthlyProgressBar.className = 'bg-slate-900 h-3 rounded-full transition-all duration-500';
        monthlyProgressText.className = 'text-slate-900 font-bold';
    } else {
        monthlyProgressBar.className = 'bg-blue-700 h-3 rounded-full transition-all duration-500';
        monthlyProgressText.className = 'text-blue-800 font-semibold';
    }

    renderFixedExpenses();
    renderDailyTransactions();
}

function renderFixedExpenses() {
    fixedListContainer.innerHTML = '';

    if (appData.fixedExpenses.length === 0) {
        fixedListContainer.innerHTML = `<p class="text-xs text-slate-400 italic py-2">Nenhum gasto fixo cadastrado.</p>`;
    } else {
        appData.fixedExpenses.forEach(item => {
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg hover:border-slate-200 transition-colors text-xs';
            div.innerHTML = `
                <span class="font-medium text-slate-800 truncate pr-2">${item.name}</span>
                <div class="flex items-center space-x-2 shrink-0">
                    <span class="font-semibold text-slate-900">${formatCurrency(item.amount)}</span>
                    <button onclick="removeFixedExpense('${item.id}')" class="text-slate-400 hover:text-red-600 active:text-red-700 transition-colors p-1.5 touch-manipulation" title="Excluir">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            `;
            fixedListContainer.appendChild(div);
        });
    }

    const total = appData.fixedExpenses.reduce((acc, i) => acc + i.amount, 0);
    fixedExpensesSum.textContent = formatCurrency(total);
}

function renderDailyTransactions() {
    const filterDate = filterDateInput.value;

    const filtered = appData.dailyExpenses.filter(item => {
        if (!filterDate) return true;
        return item.date === filterDate;
    });

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    dailyTransactionsBody.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        const metrics = calculateMetrics();

        filtered.forEach(item => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50/80 transition-colors';

            const daySpentTotal = appData.dailyExpenses
                .filter(e => e.date === item.date)
                .reduce((acc, e) => acc + e.amount, 0);

            const isOverLimit = metrics.dailyLimit > 0 && daySpentTotal > metrics.dailyLimit;

            tr.innerHTML = `
                <td class="py-3 px-3 font-medium text-slate-900 whitespace-nowrap">${formatDate(item.date)}</td>
                <td class="py-3 px-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${isOverLimit ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-800 border border-blue-100'}">
                        ${isOverLimit ? 'Acima do Limite' : 'Dentro do Limite'}
                    </span>
                </td>
                <td class="py-3 px-3 font-semibold text-slate-900 text-right whitespace-nowrap">${formatCurrency(item.amount)}</td>
                <td class="py-3 px-3 text-center">
                    <button onclick="removeDailyExpense('${item.id}')" class="p-1.5 text-slate-400 hover:text-red-600 active:text-red-700 transition-colors touch-manipulation" title="Excluir">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </td>
            `;
            dailyTransactionsBody.appendChild(tr);
        });
    }

    const totalSum = filtered.reduce((acc, i) => acc + i.amount, 0);
    dailyCount.textContent = `${filtered.length} lançamentos exibidos`;
    dailyTotal.textContent = `Total Exibido: ${formatCurrency(totalSum)}`;
}

// Day Navigation Handlers
btnNextDay.addEventListener('click', () => {
    const currentDateObj = parseDateString(getActiveDateString());
    currentDateObj.setDate(currentDateObj.getDate() + 1);

    const yyyy = currentDateObj.getFullYear();
    const mm = String(currentDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(currentDateObj.getDate()).padStart(2, '0');

    appData.simulatedDate = `${yyyy}-${mm}-${dd}`;
    saveStorage();
    updateUI();
    showToast(`Avançado para ${formatDate(appData.simulatedDate)}`);
});

btnToday.addEventListener('click', () => {
    appData.simulatedDate = getTodayDateString();
    saveStorage();
    updateUI();
    showToast('Data retornada para o dia de hoje.');
});

// Export Data JSON File Handler
btnExport.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
    const downloadAnchor = document.createElement('a');
    const fileName = `financas_backup_${getActiveDateString()}.json`;

    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    showToast('Histórico baixado com sucesso!');
});

// Import Data File Handler Trigger
btnImportTrigger.addEventListener('click', () => {
    fileImportInput.click();
});

fileImportInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const parsed = JSON.parse(event.target.result);

            if (parsed && typeof parsed === 'object' && ('income' in parsed || 'dailyExpenses' in parsed)) {
                appData = {
                    income: parseFloat(parsed.income) || 0,
                    goalTotal: parseFloat(parsed.goalTotal) || 0,
                    goalMonths: parseInt(parsed.goalMonths) || 1,
                    simulatedDate: parsed.simulatedDate || getTodayDateString(),
                    fixedExpenses: Array.isArray(parsed.fixedExpenses) ? parsed.fixedExpenses : [],
                    dailyExpenses: Array.isArray(parsed.dailyExpenses) ? parsed.dailyExpenses : []
                };

                saveStorage();
                updateUI();
                showToast('Histórico e dados importados com sucesso!');
            } else {
                showToast('Formato de arquivo JSON inválido.');
            }
        } catch (err) {
            console.error('Erro ao importar JSON:', err);
            showToast('Erro ao ler o arquivo JSON selecionado.');
        }
    };
    reader.readAsText(file);
    fileImportInput.value = '';
});

// Quick Expense Form Submit
quickForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(quickAmount.value);
    const date = quickDate.value;

    if (isNaN(amount) || amount <= 0 || !date) {
        showToast('Informe um valor válido e uma data.');
        return;
    }

    appData.dailyExpenses.push({
        id: Date.now().toString(),
        amount,
        date
    });

    saveStorage();
    updateUI();

    quickAmount.value = '';
    showToast('Gasto lançado com sucesso.');
});

// Fixed Expense Form Toggles
btnAddFixed.addEventListener('click', () => {
    fixedForm.classList.remove('hidden');
    fixedName.focus();
});

btnCancelFixed.addEventListener('click', () => {
    fixedForm.classList.add('hidden');
    fixedForm.reset();
});

// Fixed Expense Submit
fixedForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = fixedName.value.trim();
    const amount = parseFloat(fixedAmount.value);

    if (!name || isNaN(amount) || amount <= 0) {
        showToast('Preencha os campos corretamente.');
        return;
    }

    appData.fixedExpenses.push({
        id: Date.now().toString(),
        name,
        amount
    });

    saveStorage();
    updateUI();

    fixedForm.reset();
    fixedForm.classList.add('hidden');
    showToast('Gasto fixo adicionado.');
});

// Global Remove Functions
window.removeFixedExpense = function(id) {
    appData.fixedExpenses = appData.fixedExpenses.filter(i => i.id !== id);
    saveStorage();
    updateUI();
    showToast('Gasto fixo removido.');
};

window.removeDailyExpense = function(id) {
    appData.dailyExpenses = appData.dailyExpenses.filter(i => i.id !== id);
    saveStorage();
    updateUI();
    showToast('Lançamento removido.');
};

// Modal Calculation Preview Live Handler
function updateModalPreview() {
    const total = parseFloat(inputGoalTotal.value) || 0;
    const months = Math.max(1, parseInt(inputGoalMonths.value) || 1);

    const monthly = total / months;
    const daily = total / (months * 30);

    modalPreviewMonthly.textContent = formatCurrency(monthly);
    modalPreviewDaily.textContent = formatCurrency(daily);
}

inputGoalTotal.addEventListener('input', updateModalPreview);
inputGoalMonths.addEventListener('input', updateModalPreview);

// Modal Control Buttons
document.getElementById('btn-config').addEventListener('click', () => {
    inputIncome.value = appData.income || '';
    inputGoalTotal.value = appData.goalTotal || '';
    inputGoalMonths.value = appData.goalMonths || 1;
    updateModalPreview();
    modal.classList.remove('hidden');
});

const closeModal = () => modal.classList.add('hidden');
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);

// Fechar modal ao clicar fora no mobile
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const inc = parseFloat(inputIncome.value) || 0;
    const totalG = parseFloat(inputGoalTotal.value) || 0;
    const m = parseInt(inputGoalMonths.value) || 1;

    appData.income = inc;
    appData.goalTotal = totalG;
    appData.goalMonths = Math.max(1, m);

    saveStorage();
    updateUI();
    closeModal();
    showToast('Orçamento e meta atualizados.');
});

// Reset Data Action
document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Deseja realmente limpar todos os dados do sistema?')) {
        appData = {
            income: 0,
            goalTotal: 0,
            goalMonths: 1,
            simulatedDate: getTodayDateString(),
            fixedExpenses: [],
            dailyExpenses: []
        };
        saveStorage();
        updateUI();
        showToast('Todos os dados foram redefinidos.');
    }
});

// Filter Actions
filterDateInput.addEventListener('change', renderDailyTransactions);
btnClearFilter.addEventListener('click', () => {
    filterDateInput.value = '';
    renderDailyTransactions();
});

// Application Initialization
window.onload = function() {
    loadStorage();
    updateUI();
};