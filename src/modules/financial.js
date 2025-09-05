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
    const ganhosProfissionalMesEl = document.getElementById('ganhosProfissionalMes');

    if (!financeiroCurrentMonthYear) return;

    const date = state.currentDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    financeiroCurrentMonthYear.textContent = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    // --- LÓGICA DE CÁLCULO ---
    const appointmentsInMonth = state.appointments.filter(app => app.status === 'faturado' && app.date && app.date.getFullYear() === year && app.date.getMonth() === month);
    
    // CORRIGIDO: Adicionada verificação para garantir que 'exp.dueDate' existe antes de usar '.toDate()'
    const expensesInMonth = state.expenses.filter(exp => exp.dueDate && exp.dueDate.toDate().getFullYear() === year && exp.dueDate.toDate().getMonth() === month);

    // --- RENDERIZAÇÃO PARA O DONO DO SALÃO ---
    if (state.role === 'salonOwner') {
        // 1. Calcula e exibe o resumo (Faturamento, Despesas, Lucro)
        const totalRevenue = appointmentsInMonth.reduce((total, app) => {
            const service = state.services.find(s => s.id === app.serviceId);
            return total + (service?.price || 0);
        }, 0);

        const totalExpenses = expensesInMonth.reduce((total, exp) => total + (exp.value || 0), 0);
        const netProfit = totalRevenue - totalExpenses;

        faturamentoTotalMesEl.textContent = `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
        despesasTotalMesEl.textContent = `R$ ${totalExpenses.toFixed(2).replace('.', ',')}`;
        lucroLiquidoMesEl.textContent = `R$ ${netProfit.toFixed(2).replace('.', ',')}`;

        // 2. Renderiza o detalhe do faturamento por profissional
        detalhesFinanceiroEl.innerHTML = '';
        if (state.professionals.length === 0) {
            detalhesFinanceiroEl.innerHTML = `<p class="text-center text-gray-500 text-sm">Nenhum profissional cadastrado.</p>`;
        } else {
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
        
        // 3. Renderiza a lista de despesas
        expensesListEl.innerHTML = '';
        if (expensesInMonth.length === 0) {
            expensesListEl.innerHTML = `<p class="text-center text-gray-500 text-sm">Nenhuma despesa lançada para este mês.</p>`;
        } else {
            expensesInMonth.sort((a,b) => a.dueDate - b.dueDate).forEach(exp => {
                const el = document.createElement('div');
                el.className = 'bg-white p-3 rounded-lg shadow-sm border flex justify-between items-center';
                const dueDate = exp.dueDate.toDate().toLocaleDateString('pt-BR');
                el.innerHTML = `
                    <div>
                        <p class="font-semibold text-gray-800">${exp.description}</p>
                        <p class="text-sm text-gray-500">Vencimento: ${dueDate}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-red-600">R$ ${exp.value.toFixed(2).replace('.', ',')}</p>
                        <p class="text-xs ${exp.isPaid ? 'text-green-500' : 'text-orange-500'}">${exp.isPaid ? 'Pago' : 'Pendente'}</p>
                    </div>`;
                expensesListEl.appendChild(el);
            });
        }

    // --- RENDERIZAÇÃO PARA O PROFISSIONAL ---
    } else if (state.role === 'professional') {
        const profRevenue = appointmentsInMonth.reduce((total, app) => {
            const service = state.services.find(s => s.id === app.serviceId);
            return total + (service?.price || 0);
        }, 0);
        const commissionValue = profRevenue * (state.professionalProfile.commission / 100);
        ganhosProfissionalMesEl.textContent = `R$ ${commissionValue.toFixed(2).replace('.', ',')}`;
    }
}

/**
 * Configura os eventos de clique para os botões de navegação de mês da página financeira.
 * @param {object} state - O objeto de estado global da aplicação.
 * @param {Function} refreshAllViews - A função principal que atualiza todas as telas.
 */
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