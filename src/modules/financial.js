/**
 * Renderiza todo o conteúdo da página financeira, incluindo o novo resumo e a lista de despesas.
 * @param {object} state - O objeto de estado global da aplicação.
 */
export function renderFinancialPage(state) {
    const financeiroCurrentMonthYear = document.getElementById('financeiroCurrentMonthYear');
    const faturamentoTotalMesEl = document.getElementById('faturamentoTotalMes');
    const despesasTotalMesEl = document.getElementById('despesasTotalMes');
    const lucroLiquidoMesEl = document.getElementById('lucroLiquidoMes');
    const detalhesFinanceiroEl = document.getElementById('detalhesFinanceiro');
    const expensesListEl = document.getElementById('expensesList');
    const suggestedExpensesListEl = document.getElementById('suggestedExpensesList'); // Novo
    const ganhosProfissionalMesEl = document.getElementById('ganhosProfissionalMes');

    if (!financeiroCurrentMonthYear) return;

    const date = state.currentDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    financeiroCurrentMonthYear.textContent = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const appointmentsInMonth = state.appointments.filter(app => app.status === 'faturado' && app.date && app.date.getFullYear() === year && app.date.getMonth() === month);
    const expensesInMonth = state.expenses.filter(exp => exp.dueDate && exp.dueDate.getFullYear() === year && exp.dueDate.getMonth() === month);

    if (state.role === 'salonOwner') {
        const totalRevenue = appointmentsInMonth.reduce((total, app) => {
            const service = state.services.find(s => s.id === app.serviceId);
            return total + (service?.price || 0);
        }, 0);

        const totalExpenses = expensesInMonth.reduce((total, exp) => total + (exp.value || 0), 0);
        const netProfit = totalRevenue - totalExpenses;

        faturamentoTotalMesEl.textContent = `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
        despesasTotalMesEl.textContent = `R$ ${totalExpenses.toFixed(2).replace('.', ',')}`;
        lucroLiquidoMesEl.textContent = `R$ ${netProfit.toFixed(2).replace('.', ',')}`;

        detalhesFinanceiroEl.innerHTML = '';
        if (state.professionals.length > 0) {
            state.professionals.forEach(prof => {
                const profAppointments = appointmentsInMonth.filter(app => app.professionalId === prof.id);
                const profRevenue = profAppointments.reduce((total, app) => {
                    const service = state.services.find(s => s.id === app.serviceId);
                    return total + (service?.price || 0);
                }, 0);
                const commissionValue = profRevenue * (prof.commission / 100);
                const el = document.createElement('div');
                el.className = 'bg-white p-4 rounded-lg shadow-sm border';
                el.innerHTML = `
                    <p class="font-bold text-gray-800">${prof.name}</p>
                    <div class="mt-2 text-sm space-y-1">
                        <div class="flex justify-between"><span>Faturamento:</span> <span class="font-semibold">R$ ${profRevenue.toFixed(2).replace('.', ',')}</span></div>
                        <div class="flex justify-between text-red-600"><span>Comissão (${prof.commission}%):</span> <span class="font-semibold">- R$ ${commissionValue.toFixed(2).replace('.', ',')}</span></div>
                        <div class="flex justify-between border-t pt-1 mt-1"><span>Líquido:</span> <span class="font-bold text-green-600">R$ ${(profRevenue - commissionValue).toFixed(2).replace('.', ',')}</span></div>
                    </div>`;
                detalhesFinanceiroEl.appendChild(el);
            });
        }
        
        // NOVO: Lógica para sugestões de custos fixos
        suggestedExpensesListEl.innerHTML = '';
        const recurringSuggestions = state.recurringExpenses.filter(rec => {
            // Verifica se já não existe uma despesa lançada para este custo fixo neste mês
            return !expensesInMonth.some(exp => exp.recurringExpenseSourceId === rec.id);
        });

        if (recurringSuggestions.length === 0) {
            suggestedExpensesListEl.innerHTML = `<p class="text-center text-gray-500 text-sm">Todos os custos fixos do mês já foram lançados.</p>`;
        } else {
            recurringSuggestions.forEach(rec => {
                const el = document.createElement('div');
                el.className = 'bg-gray-50 p-3 rounded-lg border flex justify-between items-center';
                el.innerHTML = `
                    <div>
                        <p class="font-semibold text-gray-700">${rec.description}</p>
                        <p class="text-sm text-gray-500">Valor Padrão: R$ ${rec.defaultValue.toFixed(2).replace('.',',')}</p>
                    </div>
                    <button class="launch-recurring-btn bg-green-500 text-white px-3 py-1 text-sm rounded-md font-semibold hover:bg-green-600" data-id="${rec.id}">
                        Lançar
                    </button>
                `;
                suggestedExpensesListEl.appendChild(el);
            });
        }


        expensesListEl.innerHTML = '';
        if (expensesInMonth.length === 0) {
            expensesListEl.innerHTML = `<p class="text-center text-gray-500 text-sm">Nenhuma despesa lançada para este mês.</p>`;
        } else {
            expensesInMonth.sort((a,b) => a.dueDate - b.dueDate).forEach(exp => {
                const el = document.createElement('div');
                el.className = 'bg-white p-3 rounded-lg shadow-sm border flex justify-between items-center';
                const dueDate = exp.dueDate.toLocaleDateString('pt-BR');
                const statusClass = exp.isPaid ? 'text-green-500' : 'text-orange-500';
                const statusText = exp.isPaid ? 'Pago' : 'Pendente';
                
                el.innerHTML = `
                    <div class="flex-1">
                        <p class="font-semibold text-gray-800">${exp.description}</p>
                        <p class="text-sm text-gray-500">Vencimento: ${dueDate}</p>
                        <p class="font-bold text-red-600 mt-1">R$ ${exp.value.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div class="text-right">
                        <button class="toggle-status-btn text-xs font-bold p-1 rounded ${statusClass}" data-id="${exp.id}">${statusText}</button>
                        <div class="mt-2">
                            <button class="edit-expense-btn text-blue-500 hover:text-blue-700 mr-2" data-id="${exp.id}"><i class="fas fa-pencil-alt"></i></button>
                            <button class="delete-expense-btn text-red-500 hover:text-red-700" data-id="${exp.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`;
                expensesListEl.appendChild(el);
            });
        }

    } else if (state.role === 'professional') {
        const profRevenue = appointmentsInMonth.reduce((total, app) => {
            const service = state.services.find(s => s.id === app.serviceId);
            return total + (service?.price || 0);
        }, 0);
        const commissionValue = profRevenue * (state.professionalProfile.commission / 100);
        ganhosProfissionalMesEl.textContent = `R$ ${commissionValue.toFixed(2).replace('.', ',')}`;
    }
}

export function initializeFinancialEventListeners(state, refreshAllViews) {
    const financeiroPrevMonthBtn = document.getElementById('financeiroPrevMonthBtn');
    const financeiroNextMonthBtn = document.getElementById('financeiroNextMonthBtn');

    if (financeiroPrevMonthBtn) {
        financeiroPrevMonthBtn.addEventListener('click', () => {
            state.currentDate.setMonth(state.currentDate.getMonth() - 1);
            refreshAllViews();
        });
    }

    if (financeiroNextMonthBtn) {
        financeiroNextMonthBtn.addEventListener('click', () => {
            state.currentDate.setMonth(state.currentDate.getMonth() + 1);
            refreshAllViews();
        });
    }
}