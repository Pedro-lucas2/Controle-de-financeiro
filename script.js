// --- ESTADO DA APLICAÇÃO ---
const DEFAULT_DATA = {
    income: 0,
    goalTotal: 0,
    goalMonths: 1,
    fixedExpenses: [],
    dailyExpenses: [],
    simulatedDate: null
};

let appData = loadStorage();

// --- ELEMENTOS DO DOM ---
const currentSimulatedDateDisplay = document.getElementById('current-simulated-date-display');
const badgeSimulated = document.getElementById('badge-simulated');

const goalTotalDisplay = document.getElementById('goal-total-display');
const goalMonthsBadge = document.getElementById('goal-months-badge');
const goalMonthlyDisplay = document.getElementById('goal-monthly-display');
const goalDailyDisplay = document.getElementById('goal-daily-display');

const cardIncome = document.getElementById('card-income');
const cardFixedTotal = document.getElementById('card-fixed-total');
const cardMonthlySavings = document.getElementById('card-monthly-savings');
const cardDailySavings = document.getElementById('card-daily-savings');
const cardSpendableTotal = document.getElementById('card-spendable-total');
const cardRemainingSpendable = document.getElementById('card-remaining-spendable');

const cardDailyContainer = document.getElementById('card-daily-container');
const cardDailyLimit = document.getElementById('card-daily-limit');
const todayStatusBadge = document.getElementById('today-status-badge');
const cardDailySubtext = document.getElementById('card-daily-subtext');

const dailyProgressBar = document.getElementById('daily-progress-bar');
const dailyProgressText = document.getElementById('daily-progress-text');
const monthlyProgressBar = document.getElementById('monthly-progress-bar');
const monthlyProgressText = document.getElementById('monthly-progress-text');

const quickExpenseForm = document.getElementById('quick-expense-form');
const quickAmount = document.getElementById('quick-amount');
const quickDate = document.getElementById('quick-date');

const btnAddFixed = document.getElementById('btn-add-fixed');
const fixedExpenseForm = document.getElementById('fixed-expense-form');
const fixedName = document.getElementById('fixed-name');
const fixedAmount = document.getElementById('fixed-amount');
const btnCancelFixed = document.getElementById('btn-cancel-fixed');
const fixedList = document.getElementById('fixed-list');
const fixedExpensesSum = document.getElementById('fixed-expenses-sum');

const filterDate = document.getElementById('filter-date');
const btnClearFilter = document.getElementById('btn-clear-filter');
const dailyTransactionsBody = document.getElementById('daily-transactions-body');
const emptyState = document.getElementById('empty-state');
const dailyCount = document.getElementById('daily-count');
const dailyTotal = document.getElementById('daily-total');

const btnNextDay = document.getElementById('btn-next-day');
const btnToday = document.getElementById('btn-today');
const btnConfig = document.getElementById('btn-config');
const btnExport = document.getElementById('btn-export');
const btnImportTrigger = document.getElementById('btn-import-trigger');
const fileImport = document.getElementById('file-import');
const btnReset = document.getElementById('btn-reset');

const budgetModal = document.getElementById('budget-modal');
const modalClose = document.getElementById('modal-close');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const budgetForm = document.getElementById('budget-form');
const inputIncome = document.getElementById('input-income');
const inputGoalTotal = document.getElementById('input-goal-total');
const inputGoalMonths = document.getElementById('input-goal-months');
const modalPreviewMonthly = document.getElementById('modal-preview-monthly');
const modalPreviewDaily = document.getElementById('modal-preview-daily');

const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// --- ARMAZENAMENTO LOCAL ---
function loadStorage() {
    try {
        const data = localStorage.getItem('finance_app_data');
        return data ? { ...DEFAULT_DATA, ...JSON.parse(data) } : { ...DEFAULT_DATA };
    } catch (e) {
        return { ...DEFAULT_DATA };
    }
}

function saveStorage() {
    localStorage.setItem('finance_app_data', JSON.stringify(appData));
}

// --- FUNÇÕES UTILITÁRIAS DE DATA E MOEDA ---
function formatCurrency(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
}

function getTodayDateString() {
    const today = new Date();
    return formatDateToString(today);
}

function getActiveDateString() {
    return appData.simulatedDate || getTodayDateString();
}

function formatDateToString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseDateString(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function formatDate(dateStr) {
    if (!dateStr) return '--/--/----';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function showToast(msg) {
    toastMessage.textContent = msg;
    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');
    setTimeout(() => {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0', 'pointer-events-none');
    }, 3500);
}

// --- CÁLCULOS PRINCIPAIS ---
function calculateMetrics() {
    const totalFixed = appData.fixedExpenses.reduce((acc, item) => acc + item.amount, 0);

    const months = Math.max(1, parseInt(appData.goalMonths) || 1);
    const goalTotal = Math.max(0, parseFloat(appData.goalTotal) || 0);
    
    const monthlySavings = goalTotal / months;
    const dailySavings = goalTotal / (months * 30);

    const spendableTotal = Math.max(0, appData.income - totalFixed - monthlySavings);

    const activeDateStr = getActiveDateString();
    const activeDateObj = parseDateString(activeDateStr);
    const activeYear = activeDateObj.getFullYear();
    const activeMonth = activeDateObj.getMonth();

    const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
    const currentDay = activeDateObj.getDate();

    const baseDailyLimit = spendableTotal > 0 ? (spendableTotal / daysInMonth) : 0;

    let accumulatedBalance = 0;

    for (let day = 1; day < currentDay; day++) {
        const dateString = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const spentOnDay = appData.dailyExpenses
            .filter(exp => exp.date === dateString)
            .reduce((acc, exp) => acc + exp.amount, 0);

        accumulatedBalance += (baseDailyLimit - spentOnDay);
    }

    const todayAvailableLimit = baseDailyLimit + accumulatedBalance;

    const activeDaySpent = appData.dailyExpenses
        .filter(exp => exp.date === activeDateStr)
        .reduce((acc, exp) => acc + exp.amount, 0);

    const monthlyDailyExpenses = appData.dailyExpenses.filter(item => {
        const itemDate = parseDateString(item.date);
        return itemDate.getFullYear() === activeYear && itemDate.getMonth() === activeMonth;
    });
    const totalDailySpentMonth = monthlyDailyExpenses.reduce((acc, item) => acc + item.amount, 0);
    const remainingSpendable = spendableTotal - totalDailySpentMonth;

    return {
        totalFixed,
        goalTotal,
        months,
        monthlySavings,
        dailySavings,
        spendableTotal,
        totalDailySpentMonth,
        remainingSpendable,
        daysInMonth,
        baseDailyLimit,
        todayAvailableLimit,
        accumulatedBalance,
        activeDaySpent,
        activeDateStr
    };
}

// --- ATUALIZAÇÃO DA INTERFACE ---
function updateUI() {
    const metrics = calculateMetrics();

    currentSimulatedDateDisplay.textContent = formatDate(metrics.activeDateStr);
    if (metrics.activeDateStr !== getTodayDateString()) {
        badgeSimulated.classList.remove('hidden');
    } else {
        badgeSimulated.classList.add('hidden');
    }

    quickDate.value = metrics.activeDateStr;

    goalTotalDisplay.textContent = formatCurrency(metrics.goalTotal);
    goalMonthlyDisplay.textContent = formatCurrency(metrics.monthlySavings);
    goalDailyDisplay.textContent = formatCurrency(metrics.dailySavings);
    goalMonthsBadge.textContent = `${metrics.months} ${metrics.months === 1 ? 'Mês' : 'Meses'}`;

    cardIncome.textContent = formatCurrency(appData.income);
    cardFixedTotal.textContent = formatCurrency(metrics.totalFixed);
    cardMonthlySavings.textContent = `${formatCurrency(metrics.monthlySavings)} /mês`;
    cardDailySavings.textContent = `Guardar ${formatCurrency(metrics.dailySavings)} por dia`;
    cardSpendableTotal.textContent = formatCurrency(metrics.spendableTotal);

    // SUBTRACÇÃO EM TEMPO REAL NO CARD DIÁRIO
    const remainingToday = metrics.todayAvailableLimit - metrics.activeDaySpent;
    cardDailyLimit.textContent = formatCurrency(remainingToday);

    if (metrics.remainingSpendable >= 0) {
        cardRemainingSpendable.textContent = `Saldo livre total no mês: ${formatCurrency(metrics.remainingSpendable)}`;
        cardRemainingSpendable.className = 'text-xs text-slate-500 mt-1';
    } else {
        cardRemainingSpendable.textContent = `Excedido no Mês: ${formatCurrency(Math.abs(metrics.remainingSpendable))}`;
        cardRemainingSpendable.className = 'text-xs text-red-600 font-semibold mt-1';
    }

    if (metrics.accumulatedBalance > 0) {
        cardDailySubtext.textContent = `+ ${formatCurrency(metrics.accumulatedBalance)} acumulado de dias anteriores`;
    } else if (metrics.accumulatedBalance < 0) {
        cardDailySubtext.textContent = `- ${formatCurrency(Math.abs(metrics.accumulatedBalance))} descontado de excessos anteriores`;
    } else {
        cardDailySubtext.textContent = `Cota normal do dia: ${formatCurrency(metrics.baseDailyLimit)}`;
    }

    todayStatusBadge.textContent = `Gasto Hoje: ${formatCurrency(metrics.activeDaySpent)}`;

    if (remainingToday >= 0) {
        cardDailyContainer.className = 'bg-blue-800 p-5 rounded-xl shadow-sm text-white flex flex-col justify-between relative overflow-hidden transition-colors duration-300 sm:col-span-2 lg:col-span-2';
        todayStatusBadge.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200';
    } else {
        cardDailyContainer.className = 'bg-red-800 p-5 rounded-xl shadow-sm text-white flex flex-col justify-between relative overflow-hidden transition-colors duration-300 sm:col-span-2 lg:col-span-2';
        todayStatusBadge.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-900 border border-red-300';
    }

    // Barras de Progresso
    const dailyPct = metrics.todayAvailableLimit > 0 ? Math.min(100, Math.max(0, (metrics.activeDaySpent / metrics.todayAvailableLimit) * 100)) : 0;
    dailyProgressBar.style.width = `${dailyPct}%`;
    dailyProgressText.textContent = `${Math.round(dailyPct)}% do limite disponível hoje`;

    if (metrics.activeDaySpent > metrics.todayAvailableLimit && metrics.todayAvailableLimit > 0) {
        dailyProgressBar.className = 'bg-red-500 h-3 rounded-full transition-all duration-500';
    } else {
        dailyProgressBar.className = 'bg-blue-700 h-3 rounded-full transition-all duration-500';
    }

    const monthlyPct = metrics.spendableTotal > 0 ? Math.min(100, Math.max(0, (metrics.totalDailySpentMonth / metrics.spendableTotal) * 100)) : 0;
    monthlyProgressBar.style.width = `${monthlyPct}%`;
    monthlyProgressText.textContent = `${Math.round(monthlyPct)}% (${formatCurrency(metrics.totalDailySpentMonth)})`;

    if (metrics.totalDailySpentMonth > metrics.spendableTotal && metrics.spendableTotal > 0) {
        monthlyProgressBar.className = 'bg-red-500 h-3 rounded-full transition-all duration-500';
    } else {
        monthlyProgressBar.className = 'bg-blue-700 h-3 rounded-full transition-all duration-500';
    }

    renderFixedExpenses(metrics.totalFixed);
    renderTransactions(metrics.activeDateStr);
}

function renderFixedExpenses(sum) {
    fixedList.innerHTML = '';
    if (appData.fixedExpenses.length === 0) {
        fixedList.innerHTML = '<p class="text-xs text-slate-400 italic">Nenhum gasto fixo registado.</p>';
    } else {
        appData.fixedExpenses.forEach(item => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center bg-slate-50 p-2 rounded text-xs border border-slate-100';
            div.innerHTML = `
                <span class="font-medium text-slate-700 truncate max-w-[120px]">${item.name}</span>
                <div class="flex items-center space-x-2">
                    <span class="font-semibold text-slate-800">${formatCurrency(item.amount)}</span>
                    <button onclick="removeFixedExpense('${item.id}')" class="text-red-500 hover:text-red-700 font-bold ml-1">&times;</button>
                </div>
            `;
            fixedList.appendChild(div);
        });
    }
    fixedExpensesSum.textContent = formatCurrency(sum);
}

function renderTransactions(activeDateStr) {
    const selectedFilter = filterDate.value || activeDateStr;
    const filtered = appData.dailyExpenses.filter(exp => exp.date === selectedFilter);

    dailyTransactionsBody.innerHTML = '';

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        filtered.forEach(exp => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50 transition-colors';
            tr.innerHTML = `
                <td class="py-2.5 px-3 font-medium">${formatDate(exp.date)}</td>
                <td class="py-2.5 px-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">Lançamento</span>
                </td>
                <td class="py-2.5 px-3 text-right font-bold text-slate-800">${formatCurrency(exp.amount)}</td>
                <td class="py-2.5 px-3 text-center">
                    <button onclick="removeDailyExpense('${exp.id}')" class="text-red-500 hover:text-red-700 font-medium">Excluir</button>
                </td>
            `;
            dailyTransactionsBody.appendChild(tr);
        });
    }

    const totalSpentFilter = filtered.reduce((acc, exp) => acc + exp.amount, 0);
    dailyCount.textContent = `${filtered.length} lançamentos exibidos`;
    dailyTotal.textContent = `Total Exibido: ${formatCurrency(totalSpentFilter)}`;
}

// --- EVENTOS E AÇÕES ---

// Lançamento Rápido de Gastos com Atualização e Notificação Instantânea
quickExpenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(quickAmount.value);
    const date = quickDate.value || getActiveDateString();

    if (isNaN(amount) || amount <= 0) {
        showToast('Informe um valor válido.');
        return;
    }

    appData.dailyExpenses.push({
        id: Date.now().toString(),
        amount,
        date
    });

    saveStorage();
    updateUI();

    const metrics = calculateMetrics();
    const remainingToday = metrics.todayAvailableLimit - metrics.activeDaySpent;

    quickAmount.value = '';

    if (remainingToday >= 0) {
        showToast(`Gasto de ${formatCurrency(amount)} adicionado! Resta hoje: ${formatCurrency(remainingToday)}`);
    } else {
        showToast(`Gasto de ${formatCurrency(amount)} adicionado! Teto excedido em ${formatCurrency(Math.abs(remainingToday))}`);
    }
});

// Gastos Fixos
btnAddFixed.addEventListener('click', () => fixedExpenseForm.classList.remove('hidden'));
btnCancelFixed.addEventListener('click', () => fixedExpenseForm.classList.add('hidden'));

fixedExpenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = fixedName.value.trim();
    const amount = parseFloat(fixedAmount.value);

    if (!name || isNaN(amount) || amount <= 0) {
        showToast('Preencha os campos do gasto fixo corretamente.');
        return;
    }

    appData.fixedExpenses.push({
        id: Date.now().toString(),
        name,
        amount
    });

    fixedName.value = '';
    fixedAmount.value = '';
    fixedExpenseForm.classList.add('hidden');

    saveStorage();
    updateUI();
    showToast('Gasto fixo adicionado!');
});

function removeFixedExpense(id) {
    appData.fixedExpenses = appData.fixedExpenses.filter(item => item.id !== id);
    saveStorage();
    updateUI();
    showToast('Gasto fixo removido.');
}

function removeDailyExpense(id) {
    appData.dailyExpenses = appData.dailyExpenses.filter(item => item.id !== id);
    saveStorage();
    updateUI();
    showToast('Lançamento removido.');
}

// Filtro de Histórico
filterDate.addEventListener('change', () => updateUI());
btnClearFilter.addEventListener('click', () => {
    filterDate.value = '';
    updateUI();
});

// Simulação de Datas
btnNextDay.addEventListener('click', () => {
    const currentDate = parseDateString(getActiveDateString());
    currentDate.setDate(currentDate.getDate() + 1);
    appData.simulatedDate = formatDateToString(currentDate);
    saveStorage();
    updateUI();
    showToast(`Data avançada para ${formatDate(appData.simulatedDate)}`);
});

btnToday.addEventListener('click', () => {
    appData.simulatedDate = null;
    saveStorage();
    updateUI();
    showToast('Voltou para a data de hoje.');
});

// Modal de Configuração de Orçamento
btnConfig.addEventListener('click', () => {
    inputIncome.value = appData.income || '';
    inputGoalTotal.value = appData.goalTotal || '';
    inputGoalMonths.value = appData.goalMonths || 1;
    updateModalPreviews();
    budgetModal.classList.remove('hidden');
});

modalClose.addEventListener('click', () => budgetModal.classList.add('hidden'));
btnCancelModal.addEventListener('click', () => budgetModal.classList.add('hidden'));

function updateModalPreviews() {
    const total = parseFloat(inputGoalTotal.value) || 0;
    const months = Math.max(1, parseInt(inputGoalMonths.value) || 1);
    const monthly = total / months;
    const daily = total / (months * 30);

    modalPreviewMonthly.textContent = formatCurrency(monthly);
    modalPreviewDaily.textContent = formatCurrency(daily);
}

inputGoalTotal.addEventListener('input', updateModalPreviews);
inputGoalMonths.addEventListener('input', updateModalPreviews);

budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    appData.income = parseFloat(inputIncome.value) || 0;
    appData.goalTotal = parseFloat(inputGoalTotal.value) || 0;
    appData.goalMonths = Math.max(1, parseInt(inputGoalMonths.value) || 1);

    saveStorage();
    updateUI();
    budgetModal.classList.add('hidden');
    showToast('Configurações salvas com sucesso!');
});

// Exportação e Importação de Dados
btnExport.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `controle_financeiro_${getActiveDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

btnImportTrigger.addEventListener('click', () => fileImport.click());

fileImport.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            appData = { ...DEFAULT_DATA, ...imported };
            saveStorage();
            updateUI();
            showToast('Dados importados com sucesso!');
        } catch (err) {
            showToast('Erro ao ler ficheiro JSON.');
        }
    };
    reader.readAsText(file);
});

// Limpeza de Dados
btnReset.addEventListener('click', () => {
    if (confirm('Tem a certeza que deseja apagar todos os dados registados?')) {
        appData = { ...DEFAULT_DATA };
        saveStorage();
        updateUI();
        showToast('Todos os dados foram apagados.');
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
});