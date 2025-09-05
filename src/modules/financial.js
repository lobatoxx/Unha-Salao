/**
 * Renderiza todo o conteúdo da página financeira.
 * @param {object} state - O objeto de estado global da aplicação.
 */
export function renderFinancialPage(state) {
    // Pega os elementos do DOM necessários para esta página
    const financeiroCurrentMonthYear = document.getElementById('financeiroCurrentMonthYear');
    const detalhesFinanceiroEl = document.getElementById('detalhesFinanceiro');
    const faturamentoTotalMesEl = document.getElementById('faturamentoTotalMes');
    const ganhosProfissionalMesEl = document.getElementById('ganhosProfissionalMes');

    if (!financeiroCurrentMonthYear) return; // Se não estiver na página, não faz nada

    const date = state.currentDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    financeiroCurrentMonthYear.textContent = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const appointmentsInMonth = state.appointments.filter(app => {
        return app.status === 'faturado' && app.date && app.date.getFullYear() === year && app.date.getMonth() === month;
    });

    if (state.role === 'salonOwner') {
        let totalMonthRevenue = 0;
        detalhesFinanceiroEl.innerHTML = '';
        if (state.professionals.length === 0) {
            detalhesFinanceiroEl.innerHTML = `<p class="text-center text-gray-500 text-sm">Nenhum profissional cadastrado.</p>`;
        }
        state.professionals.forEach(prof => {
            const profAppointments = appointmentsInMonth.filter(app => app.professionalId === prof.id);
            const profRevenue = profAppointments.reduce((total, app) => {
                const service = state.services.find(s => s.id === app.serviceId);
                return total + (service?.price || 0);
            }, 0);
            totalMonthRevenue += profRevenue;
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
        faturamentoTotalMesEl.textContent = `R$ ${totalMonthRevenue.toFixed(2).replace('.', ',')}`;
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