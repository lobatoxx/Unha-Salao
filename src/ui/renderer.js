import { state } from '../state.js';
import * as DOMElements from './domElements.js';
import { getMonthYear, getStartOfMonth, getEndOfMonth } from '../utils/dateUtils.js';

// --- Funções de Renderização de UI Geral ---

export function updateSalonHeader() {
    if (state.salonInfo && state.salonInfo.logoUrl) {
        DOMElements.salonLogo.src = state.salonInfo.logoUrl;
        DOMElements.salonLogo.classList.remove('hidden');
        DOMElements.salonTitle.classList.add('hidden');
    } else if (state.salonInfo && state.salonInfo.name) {
        DOMElements.salonLogo.classList.add('hidden');
        DOMElements.salonTitle.textContent = state.salonInfo.name;
        DOMElements.salonTitle.classList.remove('hidden');
    } else {
        DOMElements.salonLogo.classList.add('hidden');
        DOMElements.salonTitle.textContent = 'Painel';
        DOMElements.salonTitle.classList.remove('hidden');
    }
}

export function updateUIVisibility() {
    const isOwner = state.role === 'salonOwner';
    const isProfessional = state.role === 'professional';

    const equipeBtn = document.querySelector('button[data-page="equipePage"]');
    const servicosBtn = document.querySelector('button[data-page="servicosPage"]');
    const financeiroBtn = document.querySelector('button[data-page="financeiroPage"]');

    if (isOwner) {
        equipeBtn.style.display = 'block';
        servicosBtn.style.display = 'block';
        financeiroBtn.style.display = 'block'; // Garante que o dono vê o financeiro
        DOMElements.openClientModalBtn.style.display = 'block';
        DOMElements.totalClientesCard.style.display = 'block';
        DOMElements.totalServicosCard.style.display = 'block';
    } else if (isProfessional) {
        equipeBtn.style.display = 'none';
        servicosBtn.style.display = 'none';
        financeiroBtn.style.display = 'none'; // Profissional não vê o novo financeiro
        DOMElements.openClientModalBtn.style.display = 'none';
        DOMElements.totalClientesCard.style.display = 'none';
        DOMElements.totalServicosCard.style.display = 'none';
    }
}

// --- Funções de Renderização de Listas ---

export function renderServices() {
    if (!DOMElements.servicesList) return;
    DOMElements.servicesList.innerHTML = '';
    if (state.services.length === 0) {
        DOMElements.servicesList.innerHTML = `<p class="text-center text-gray-500">Nenhum serviço registado.</p>`;
        return;
    }
    state.services.forEach(service => {
        const el = document.createElement('div');
        el.className = 'bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center';
        const price = typeof service.price === 'number' ? service.price.toFixed(2) : '0.00';
        el.innerHTML = `
            <div><p class="font-semibold text-gray-800">${service.name || ''}</p><p class="text-sm text-gray-500">${price.replace('.',',')} € - ${service.duration || 0} min</p></div>
            <div><button class="edit-service-btn text-blue-500 hover:text-blue-700 mr-2" data-id="${service.id}"><i class="fas fa-pencil-alt"></i></button><button class="delete-service-btn text-red-500 hover:text-red-700" data-id="${service.id}"><i class="fas fa-trash"></i></button></div>`;
        DOMElements.servicesList.appendChild(el);
    });
}

export function renderProfessionals() {
    if (!DOMElements.professionalsList) return;
    DOMElements.professionalsList.innerHTML = '';
    state.professionals.forEach(prof => {
        const el = document.createElement('div');
        el.className = 'bg-white p-4 rounded-lg shadow-sm border';
        const serviceNames = (prof.serviceIds || []).map(id => state.services.find(s => s.id === id)?.name).filter(name => name).join(', ');
        el.innerHTML = `
            <div class="flex justify-between items-center">
                <div><p class="font-semibold text-gray-800">${prof.name}</p><p class="text-sm text-gray-500">Comissão: ${prof.commission}%</p></div>
                <div class="flex items-center gap-2"><button class="edit-professional-btn text-blue-500 hover:text-blue-700" data-id="${prof.id}"><i class="fas fa-pencil-alt"></i></button><button class="delete-professional-btn text-red-500 hover:text-red-700" data-id="${prof.id}"><i class="fas fa-trash"></i></button></div>
            </div>
            <div class="mt-2 pt-2 border-t"><p class="text-xs font-medium">Serviços:</p><p class="text-xs text-gray-500">${serviceNames || 'Nenhum serviço vinculado'}</p></div>`;
        DOMElements.professionalsList.appendChild(el);
    });
}

export function renderClients() {
    if (!DOMElements.clientsList) return;
    DOMElements.clientsList.innerHTML = '';
    state.clients.forEach(client => {
        const el = document.createElement('div');
        el.className = 'bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center';
        
        let adminButtons = (state.role === 'salonOwner') ? `
            <button class="edit-client-btn text-blue-500 hover:text-blue-700" data-id="${client.id}"><i class="fas fa-pencil-alt"></i></button>
            <button class="delete-client-btn text-red-500 hover:text-red-700" data-id="${client.id}"><i class="fas fa-trash"></i></button>
        ` : '';

        el.innerHTML = `
            <div class="flex-1 cursor-pointer client-profile-btn" data-id="${client.id}">
                <p class="font-semibold text-gray-800">${client.name}</p>
                <p class="text-sm text-gray-500">${client.phone}</p>
            </div>
            <div class="flex items-center gap-2">
                <button class="whatsapp-btn text-green-500" data-id="${client.id}"><i class="fab fa-whatsapp"></i></button>
                ${adminButtons}
            </div>`;
        DOMElements.clientsList.appendChild(el);
    });
}

// --- Funções de Renderização do Dashboard ---

export function renderDashboard() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const agendamentosDeHoje = state.appointments.filter(app => app.type === 'booking' && app.status !== 'cancelado' && app.date && app.date.toISOString().split('T')[0] === todayStr);
    const faturadoHoje = state.appointments.filter(app => app.status === 'faturado' && app.date && app.date.toISOString().split('T')[0] === todayStr);

    DOMElements.agendamentosHoje.textContent = agendamentosDeHoje.length;
    const faturamentoDeHoje = faturadoHoje.reduce((total, app) => {
        const service = state.services.find(s => s.id === app.serviceId);
        return total + (service?.price || 0);
    }, 0);

    DOMElements.faturamentoHoje.textContent = `${faturamentoDeHoje.toFixed(2).replace('.', ',')} €`;
    if (state.role === 'salonOwner') {
        DOMElements.totalClientes.textContent = state.clients.length;
        DOMElements.totalServicos.textContent = state.services.length;
    }
    const proximos = state.appointments.filter(app => app.type === 'booking' && app.status === 'agendado' && app.date && app.date >= today).sort((a, b) => a.date - b.date).slice(0, 3);
    DOMElements.proximosAgendamentos.innerHTML = '';
    if (proximos.length === 0) {
        DOMElements.proximosAgendamentos.innerHTML = `<p class="text-center text-gray-500 text-sm">Nenhum agendamento próximo.</p>`;
    } else {
        proximos.forEach(app => {
            const client = state.clients.find(c => c.id === app.clientId)?.name || '...';
            const service = state.services.find(s => s.id === app.serviceId)?.name || '...';
            const el = document.createElement('div');
            el.className = 'bg-white p-3 rounded-lg shadow-sm border';
            el.innerHTML = `
                <p class="font-bold text-blue-600">${app.date.toLocaleDateString('pt-PT')} - ${app.date.toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'})}</p>
                <p class="font-semibold text-gray-800">${client}</p>
                <p class="text-sm text-gray-600">${service}</p>`;
            DOMElements.proximosAgendamentos.appendChild(el);
        });
    }
}

// --- Funções de Renderização da Agenda e Calendário ---

export function renderCalendar() {
    DOMElements.calendarDays.innerHTML = '';
    const date = state.currentDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    
    if (DOMElements.dailyView && !DOMElements.dailyView.classList.contains('hidden')) {
        const selectedDateObj = new Date(state.selectedDate + 'T00:00:00');
        DOMElements.currentMonthYear.textContent = selectedDateObj.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
    } else {
        DOMElements.currentMonthYear.textContent = date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    }
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDayOfMonth; i++) { DOMElements.calendarDays.innerHTML += `<div></div>`; }
    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        const dateString = new Date(year, month, i).toISOString().split('T')[0];
        dayEl.className = 'calendar-day flex items-center justify-center rounded-full cursor-pointer hover:bg-blue-100';
        dayEl.textContent = i;
        dayEl.dataset.date = dateString;
        const today = new Date();
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayEl.classList.add('bg-blue-600', 'text-white');
        }
        if (dateString === state.selectedDate) {
            dayEl.classList.add('day-selected');
        }
        DOMElements.calendarDays.appendChild(dayEl);
    }
}

export function renderAppointmentsForDay() {
    const selected = state.selectedDate;
    if (!selected) {
        DOMElements.appointmentsForDay.innerHTML = `<p class="text-center text-gray-500 text-sm">Selecione um dia para ver os agendamentos.</p>`;
        return;
    }
    const dateObj = new Date(selected + 'T00:00:00');
    DOMElements.appointmentsTitle.textContent = `Agendamentos para ${dateObj.toLocaleDateString('pt-PT')}:`;
    const dayAppointments = state.appointments.filter(app => app.date && app.date.toISOString().split('T')[0] === selected).sort((a, b) => a.date - b.date);
    DOMElements.appointmentsForDay.innerHTML = '';
    if (dayAppointments.length === 0) {
        DOMElements.appointmentsForDay.innerHTML = `<p class="text-center text-gray-500 text-sm">Nenhum agendamento para este dia.</p>`;
    } else {
        dayAppointments.forEach(app => {
            const el = document.createElement('div');
            el.className = 'bg-white p-3 rounded-lg shadow-sm border cursor-pointer hover:bg-gray-50';
            el.dataset.id = app.id;

            let statusIcon = '';
            if (app.status === 'faturado') {
                statusIcon = `<i class="fas fa-dollar-sign text-green-500 text-xs ml-2"></i>`;
            } else if (app.status === 'cancelado') {
                statusIcon = `<i class="fas fa-ban text-red-500 text-xs ml-2"></i>`;
                el.classList.add('opacity-50');
            }

            if (app.type === 'block') {
                const startTimeStr = app.date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
                const endTime = new Date(app.date.getTime() + app.duration * 60000);
                const endTimeStr = endTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
                el.innerHTML = `
                    <div class="pointer-events-none">
                        <p class="font-bold text-gray-600">${startTimeStr} - ${endTimeStr}</p>
                        <p class="font-semibold text-gray-800"><i class="fas fa-lock mr-2"></i>Bloqueado</p>
                        <p class="text-sm text-gray-600">${app.reason || 'Motivo não informado'}</p>
                    </div>`;
            } else {
                const client = state.clients.find(c => c.id === app.clientId);
                const service = state.services.find(s => s.id === app.serviceId);
                const prof = state.professionals.find(p => p.id === app.professionalId)?.name || '...';
                const startTime = app.date;
                const duration = service?.duration || 0;
                const endTime = new Date(startTime.getTime() + duration * 60000);
                const startTimeStr = startTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
                const endTimeStr = endTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
                el.innerHTML = `
                    <div>
                        <div class="flex items-center pointer-events-none">
                            <p class="font-bold text-blue-600">${startTimeStr} - ${endTimeStr}</p>
                            ${statusIcon}
                        </div>
                        <div class="flex items-center">
                            <p class="font-semibold text-gray-800">${client?.name || '...'}</p>
                            <button class="whatsapp-btn text-green-500 ml-2 text-sm" data-id="${client?.id}"><i class="fab fa-whatsapp"></i></button>
                        </div>
                        <p class="text-sm text-gray-600 pointer-events-none">${service?.name || '...'} com ${prof}</p>
                    </div>`;
            }
            DOMElements.appointmentsForDay.appendChild(el);
        });
    }
}

export function renderDailyView(openActionChoiceModal) {
    const date = new Date(state.selectedDate + 'T00:00:00');
    DOMElements.dailyViewTitle.textContent = `Agenda para ${date.toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}`;
    DOMElements.dailyViewTimeSlots.innerHTML = '';

    const dayAppointments = state.appointments
        .filter(app => app.date && app.date.toISOString().split('T')[0] === state.selectedDate)
        .sort((a, b) => a.date - b.date);

    const START_HOUR = 8;
    const END_HOUR = 19;
    const SLOT_DURATION_MINUTES = 30;
    const SLOT_HEIGHT_REM = 2.5;

    const backgroundSlots = document.createDocumentFragment();
    for (let h = START_HOUR; h < END_HOUR; h++) {
        for (let m = 0; m < 60; m += SLOT_DURATION_MINUTES) {
            const slotTime = new Date(date);
            slotTime.setHours(h, m, 0, 0);
            const slotTimeStr = slotTime.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

            const el = document.createElement('div');
            el.className = 'flex items-start p-2 border-t border-gray-100 hover:bg-gray-50 cursor-pointer';
            el.style.height = `${SLOT_HEIGHT_REM}rem`;
            el.dataset.date = state.selectedDate;
            el.dataset.time = slotTimeStr;
            el.innerHTML = `<div class="text-xs font-bold text-gray-400 w-12">${slotTimeStr}</div>`;
            el.onclick = () => openActionChoiceModal(el.dataset.date, el.dataset.time);
            backgroundSlots.appendChild(el);
        }
    }
    DOMElements.dailyViewTimeSlots.appendChild(backgroundSlots);
    
    dayAppointments.forEach(app => {
        const isBlock = app.type === 'block';
        const service = !isBlock ? state.services.find(s => s.id === app.serviceId) : null;
        const client = !isBlock ? state.clients.find(c => c.id === app.clientId) : null;
        const professional = state.professionals.find(p => p.id === app.professionalId);
        const duration = isBlock ? app.duration : (service?.duration || SLOT_DURATION_MINUTES);
        
        const startMinutes = (app.date.getHours() * 60 + app.date.getMinutes()) - (START_HOUR * 60);
        const topPosition = (startMinutes / SLOT_DURATION_MINUTES) * SLOT_HEIGHT_REM;
        const height = (duration / SLOT_DURATION_MINUTES) * SLOT_HEIGHT_REM;
        
        const appEndTime = new Date(app.date.getTime() + duration * 60000);
        const overlappingApps = dayAppointments.filter(otherApp => {
            const otherIsBlock = otherApp.type === 'block';
            const otherService = !otherIsBlock ? state.services.find(s => s.id === otherApp.serviceId) : null;
            const otherDuration = otherIsBlock ? otherApp.duration : (otherService?.duration || 0);
            const otherAppEndTime = new Date(otherApp.date.getTime() + otherDuration * 60000);
            return app.date < otherAppEndTime && otherApp.date < appEndTime;
        });

        const numColumns = overlappingApps.length;
        const columnIndex = overlappingApps.findIndex(a => a.id === app.id);
        const width = 100 / numColumns;
        const left = columnIndex * width;
        
        const el = document.createElement('div');
        let bgColor = isBlock ? 'bg-gray-200' : 'bg-blue-100';
        let borderColor = isBlock ? 'border-gray-500' : 'border-blue-500';
        if (app.status === 'cancelado') {
            bgColor = 'bg-gray-100';
            borderColor = 'border-gray-300';
            el.classList.add('opacity-70');
        }

        el.className = `absolute flex flex-col p-2 border-l-4 ${borderColor} ${bgColor} rounded-r-lg overflow-hidden cursor-pointer`;
        el.style.top = `${topPosition}rem`;
        el.style.height = `${height}rem`;
        el.style.left = `calc(${left}% + 3.5rem)`;
        el.style.width = `calc(${width}% - 0.2rem)`;
        el.style.marginRight = '0.2rem';
        el.dataset.id = app.id;

        let statusIcon = '';
         if (app.status === 'faturado') {
            statusIcon = `<i class="fas fa-dollar-sign text-green-600 text-xs absolute top-1 right-1"></i>`;
        } else if (app.status === 'cancelado') {
            statusIcon = `<i class="fas fa-ban text-red-600 text-xs absolute top-1 right-1"></i>`;
        }

        if(isBlock) {
            el.innerHTML = `
                <div class="pointer-events-none flex items-center gap-2">
                    <i class="fas fa-lock text-gray-600 text-xs"></i>
                    <div>
                        <p class="font-semibold text-xs text-gray-800 truncate">${app.reason || 'Bloqueado'}</p>
                        <p class="text-xs text-gray-600 truncate">${professional?.name || ''}</p>
                    </div>
                </div>
            `;
        } else {
            el.innerHTML = `
                <div>
                    <div class="flex items-center">
                        <p class="font-semibold text-xs text-blue-900 truncate">${client?.name || ''}</p>
                        <button class="whatsapp-btn text-green-500 ml-2 text-xs flex-shrink-0" data-id="${client?.id}"><i class="fab fa-whatsapp"></i></button>
                    </div>
                    <p class="text-xs text-blue-700 truncate">${service?.name || ''}</p>
                    <p class="text-xs text-blue-600 truncate">${professional?.name || ''}</p>
                </div>
                ${statusIcon}
            `;
        }
        
        DOMElements.dailyViewTimeSlots.appendChild(el);
    });
}

// --- NOVAS FUNÇÕES DE RENDERIZAÇÃO FINANCEIRA ---

function renderExpenseItem(expense) {
    const isRecurring = expense.dueDay; // Despesas recorrentes têm 'dueDay', as outras não
    const valueClass = expense.value > 100 ? 'text-red-600' : 'text-gray-700';
    const dateText = isRecurring 
        ? `Vence todo o dia ${expense.dueDay}`
        : `Vence em ${new Date(expense.dueDate + 'T00:00:00').toLocaleDateString('pt-PT')}`;

    return `
        <div class="bg-white p-3 rounded-lg shadow-sm border-l-4 border-gray-200 flex justify-between items-center">
            <div>
                <p class="font-semibold text-gray-800">${expense.description}</p>
                <p class="text-xs text-gray-500">${dateText} - Categoria: ${expense.category}</p>
            </div>
            <div class="text-right">
                <p class="font-bold ${valueClass}">${expense.value.toFixed(2).replace('.', ',')} €</p>
                <div class="text-gray-400 mt-1">
                    <button class="edit-expense-btn hover:text-blue-500" data-id="${expense.id}" data-recurring="${!!isRecurring}"><i class="fas fa-edit"></i></button>
                    <button class="delete-expense-btn hover:text-red-500 ml-2" data-id="${expense.id}" data-recurring="${!!isRecurring}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        </div>
    `;
}

export function renderFinancialPage() {
    if (!DOMElements.financeiroPage.classList.contains('active')) return;

    DOMElements.financeiroCurrentMonthYear.textContent = getMonthYear(state.currentDate);

    const start = getStartOfMonth(state.currentDate);
    const end = getEndOfMonth(state.currentDate);
    
    // Calcular Faturação
    const faturamento = state.appointments
        .filter(app => app.status === 'faturado' && app.date >= start && app.date <= end)
        .reduce((sum, app) => {
            const service = state.services.find(s => s.id === app.serviceId);
            return sum + (service?.price || 0);
        }, 0);
    
    // Calcular Despesas do Mês
    let totalDespesas = 0;
    
    // Despesas pontuais do mês
    const monthlyExpenses = state.expenses.filter(exp => {
        const dueDate = new Date(exp.dueDate + 'T00:00:00');
        return dueDate >= start && dueDate <= end;
    });
    totalDespesas += monthlyExpenses.reduce((sum, exp) => sum + exp.value, 0);

    // Despesas recorrentes aplicáveis a este mês
    totalDespesas += state.recurringExpenses.reduce((sum, rexp) => sum + rexp.value, 0);
    
    // Atualizar o Dashboard Financeiro
    DOMElements.financeiroFaturamento.textContent = `${faturamento.toFixed(2).replace('.', ',')} €`;
    DOMElements.financeiroDespesas.textContent = `${totalDespesas.toFixed(2).replace('.', ',')} €`;
    DOMElements.financeiroLucro.textContent = `${(faturamento - totalDespesas).toFixed(2).replace('.', ',')} €`;
    
    // Renderizar a lista de Despesas Pontuais
    const expensesListElement = document.getElementById('expensesList');
    expensesListElement.innerHTML = monthlyExpenses.length > 0 
        ? monthlyExpenses.map(renderExpenseItem).join('')
        : '<p class="text-center text-gray-500 text-sm p-4">Nenhuma despesa pontual para este mês.</p>';

    // Renderizar a lista de Despesas Recorrentes
    const recurringExpensesListElement = document.getElementById('recurringExpensesList');
    recurringExpensesListElement.innerHTML = state.recurringExpenses.length > 0 
        ? state.recurringExpenses.map(renderExpenseItem).join('')
        : '<p class="text-center text-gray-500 text-sm p-4">Nenhuma despesa recorrente registada.</p>';
}

