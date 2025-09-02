import { doc, addDoc, updateDoc, collection, Timestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let db;
let state;
let dom;
let expensesChart = null;

export function initFinancialModule(database, appState, domElements) {
    db = database;
    state = appState;
    dom = domElements;
    setupEventListeners();
}

function setupEventListeners() {
    dom.financeTabs.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = e.target.closest('a')?.dataset.tab;
        if (!tabName) return;
        
        dom.financeTabs.querySelectorAll('a').forEach(tab => {
            tab.classList.remove('border-blue-500', 'text-blue-600');
            tab.classList.add('border-transparent', 'text-gray-500');
        });
        e.target.closest('a').classList.add('border-blue-500', 'text-blue-600');
        
        dom.financeTabPanes.forEach(pane => {
            pane.classList.toggle('hidden', pane.id !== `${tabName}Tab`);
        });

        renderFinancialModule();
    });

    dom.openExpenseModalBtn.addEventListener('click', () => openTransactionModal('expense'));
    dom.openRevenueModalBtn.addEventListener('click', () => openTransactionModal('revenue'));
    dom.closeTransactionModalBtn.addEventListener('click', () => closeModal());
    dom.transactionForm.addEventListener('submit', handleTransactionSubmit);
    dom.financeiroPrevMonthBtn.addEventListener('click', () => changeMonth(-1));
    dom.financeiroNextMonthBtn.addEventListener('click', () => changeMonth(1));
}

function changeMonth(direction) {
    state.currentDate.setMonth(state.currentDate.getMonth() + direction);
    renderFinancialModule();
}

export function renderFinancialModule() {
    const date = state.currentDate;
    dom.financeiroCurrentMonthYear.textContent = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    const activeTab = document.querySelector('.finance-tab.border-blue-500')?.dataset.tab || 'overview';
    if (activeTab === 'overview') {
        renderFinancialOverview();
    } else if (activeTab === 'transactions') {
        renderTransactionsList();
    }
}

function getTransactionsForCurrentMonth() {
    const { appointments, services, transactions } = state;
    const currentMonth = state.currentDate.getMonth();
    const currentYear = state.currentDate.getFullYear();

    const revenueFromAppointments = appointments
        .filter(app => app.status === 'faturado' && app.date.getMonth() === currentMonth && app.date.getFullYear() === currentYear)
        .map(app => {
            const service = services.find(s => s.id === app.serviceId);
            return {
                id: app.id,
                date: app.date,
                description: `Serviço: ${service?.name || 'N/A'}`,
                amount: service?.price || 0,
                type: 'revenue',
                isFromAppointment: true
            };
        });

    const manualTransactions = transactions
        .filter(t => t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear);

    return [...revenueFromAppointments, ...manualTransactions].sort((a, b) => b.date - a.date);
}


function renderTransactionsList() {
    const allTransactions = getTransactionsForCurrentMonth();
    dom.transactionsList.innerHTML = '';
    
    if (allTransactions.length === 0) {
        dom.transactionsList.innerHTML = '<p class="text-center text-gray-500 p-4">Nenhum lançamento para este mês.</p>';
        return;
    }

    allTransactions.forEach(t => {
        const el = document.createElement('div');
        const isRevenue = t.type === 'revenue';
        el.className = `p-3 rounded-lg flex justify-between items-center ${isRevenue ? 'bg-green-50' : 'bg-red-50'}`;
        
        el.innerHTML = `
            <div>
                <p class="font-bold">${t.description}</p>
                <p class="text-sm text-gray-500">${t.date.toLocaleDateString('pt-BR')}</p>
            </div>
            <p class="font-bold ${isRevenue ? 'text-green-600' : 'text-red-600'}">
                ${isRevenue ? '+' : '-'} R$ ${t.amount.toFixed(2).replace('.', ',')}
            </p>
        `;
        dom.transactionsList.appendChild(el);
    });
}

function renderFinancialOverview() {
    const allTransactions = getTransactionsForCurrentMonth();

    const totalRevenue = allTransactions
        .filter(t => t.type === 'revenue')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const profit = totalRevenue - totalExpenses;

    dom.overviewRevenueEl.textContent = `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
    dom.overviewExpensesEl.textContent = `R$ ${totalExpenses.toFixed(2).replace('.', ',')}`;
    dom.overviewProfitEl.textContent = `R$ ${profit.toFixed(2).replace('.', ',')}`;

    // Lógica do Gráfico (Fase 2)
    const expensesByCategory = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

    const chartLabels = Object.keys(expensesByCategory);
    const chartData = Object.values(expensesByCategory);

    if(expensesChart) {
        expensesChart.destroy();
    }
    
    expensesChart = new Chart(dom.expensesChartCanvas, {
        type: 'doughnut',
        data: {
            labels: chartLabels.length > 0 ? chartLabels : ['Nenhuma despesa'],
            datasets: [{
                data: chartData.length > 0 ? chartData : [1],
                backgroundColor: chartLabels.length > 0 ? ['#EF4444', '#F97316', '#EAB308', '#84CC16', '#22C55E', '#10B981'] : ['#E5E7EB'],
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        },
    });
}

function openTransactionModal(type) {
    dom.transactionForm.reset();
    document.getElementById('transactionIdToEdit').value = '';
    document.getElementById('transactionType').value = type;
    const title = document.getElementById('transactionModalTitle');
    const saveBtn = document.getElementById('saveTransactionBtn');
    const expenseFields = document.getElementById('expenseFieldsContainer');

    if (type === 'expense') {
        title.textContent = 'Nova Despesa';
        saveBtn.className = 'text-white px-4 py-2 rounded-lg font-semibold bg-red-500 hover:bg-red-600';
        expenseFields.style.display = 'block';
    } else {
        title.textContent = 'Nova Receita';
        saveBtn.className = 'text-white px-4 py-2 rounded-lg font-semibold bg-green-500 hover:bg-green-600';
        expenseFields.style.display = 'none';
    }
    dom.transactionModal.classList.remove('hidden');
}

function closeModal() {
    dom.transactionModal.classList.add('hidden');
}

async function handleTransactionSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('transactionIdToEdit').value;
    const type = document.getElementById('transactionType').value;
    const dateValue = document.getElementById('transactionDate').value;

    const data = {
        description: document.getElementById('transactionDescription').value,
        amount: parseFloat(document.getElementById('transactionAmount').value),
        date: Timestamp.fromDate(new Date(dateValue + 'T12:00:00')), // Adiciona hora para evitar problemas de fuso
        type: type,
        salonId: state.userSalonId
    };

    if (type === 'expense') {
        data.category = document.getElementById('transactionCategory').value;
        data.expenseType = document.getElementById('transactionExpenseType').value;
    }

    try {
        if (id) {
            await updateDoc(doc(db, 'transactions', id), data);
        } else {
            await addDoc(collection(db, 'transactions'), data);
        }
        closeModal();
    } catch (err) {
        console.error("Erro ao salvar transação:", err);
        alert("Falha ao salvar transação.");
    }
}
