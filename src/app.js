// No início de app.js
import { state } from './state.js';
import {
    auth,
    db,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    deleteUser,
    collection,
    onSnapshot,
    query,
    addDoc,
    doc,
    deleteDoc,
    updateDoc,
    Timestamp,
    getDocs,
    where,
    arrayUnion,
    getDoc
} from './firebase.js';
import { initializeReports } from './modules/reports.js';
import { renderFinancialPage, initializeFinancialEventListeners } from './modules/financial.js';
import { initializeExpensesModal } from './modules/expenses.js';


let confirmAction = null; 

const whatsappMessages = [
    "Olá {cliente}! Tudo bem? Estou passando para confirmar seu agendamento conosco. Podemos contar com sua presença?",
    "Oi {cliente}! Lembrete do seu horário amanhã. Qualquer imprevisto, por favor, nos avise com antecedência.",
    "Olá {cliente}, tudo joia? Vi que faz um tempo que não nos visita. Que tal agendar um horário e renovar a beleza? 😊",
    "Olá {cliente}! Agradecemos a sua visita e preferência. Esperamos te ver em breve! Atenciosamente, {profissional}.",
];

function showConfirmModal(message, onConfirm) {
    const confirmModal = document.getElementById('confirmModal');
    const confirmModalText = document.getElementById('confirmModalText');
    confirmModalText.textContent = message;
    confirmAction = onConfirm;
    confirmModal.classList.remove('hidden');
}

async function exportAnamnesisToPDF(client, record) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    try {
        if (state.salonInfo && state.salonInfo.logoUrl) {
            const toDataURL = url => fetch(url)
                .then(response => {
                    if (!response.ok) throw new Error('A resposta da rede não foi bem-sucedida');
                    return response.blob();
                })
                .then(blob => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }));
            const logoDataUrl = await toDataURL(state.salonInfo.logoUrl);
            doc.addImage(logoDataUrl, 'PNG', 15, 10, 40, 0);
        } else {
            doc.text("Logo do Salão", 15, 20);
        }
    } catch (e) {
        console.error("Erro ao carregar ou adicionar o logo da URL:", e);
        doc.text("Logo não carregado", 15, 20);
    }
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('Ficha de Anamnese', 105, 45, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Data: ${record.date.toDate().toLocaleDateString('pt-BR')}`, 15, 55);
    doc.line(15, 60, 195, 60);
    doc.setFont("helvetica", "bold");
    doc.text('Dados do Cliente', 15, 68);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${client.name}`, 15, 75);
    doc.text(`Telefone: ${client.phone}`, 15, 82);
    doc.line(15, 90, 195, 90);
    doc.setFont("helvetica", "bold");
    doc.text('Questionário', 15, 98);
    doc.setFont("helvetica", "normal");
    let yPosition = 105;
    const answers = record.answers;
    const addPdfLine = (label, value) => {
        if (yPosition > 260) {
            doc.addPage();
            yPosition = 20;
        }
        const splitText = doc.splitTextToSize(`${label}: ${value}`, 180);
        doc.text(splitText, 15, yPosition);
        yPosition += (splitText.length * 5) + 3;
    };
    const formatYesNo = (value) => (value || 'nao').replace('nao', 'Não').replace('sim', 'Sim');
    addPdfLine("1. Possui alergia a esmaltes, removedores ou outros cosméticos?", answers.alergia === 'sim' ? `Sim - Qual? ${answers.alergia_qual || 'Não especificado'}` : 'Não');
    addPdfLine("2. Possui doenças de pele nas mãos ou unhas (micose, psoríase, etc.)?", answers.doenca_pele === 'sim' ? `Sim - Quais? ${answers.doenca_pele_qual || 'Não especificado'}` : 'Não');
    addPdfLine("3. Faz uso de anticoagulantes ou possui problemas de coagulação?", formatYesNo(answers.coagulacao));
    addPdfLine("4. Possui diabetes?", formatYesNo(answers.diabetes));
    addPdfLine("5. Já teve infecção nas unhas após procedimento estético?", formatYesNo(answers.infeccao));
    addPdfLine("6. Está gestante?", formatYesNo(answers.gestante));
    yPosition += 5;
    doc.line(15, yPosition, 195, yPosition);
    yPosition += 8;
    doc.setFont("helvetica", "bold");
    doc.text('Assinatura do Cliente:', 15, yPosition);
    yPosition += 5;
    try {
        doc.addImage(record.signature, 'PNG', 15, yPosition, 80, 25);
    } catch (e) {
        console.error("Erro ao adicionar a assinatura", e);
        doc.text("Assinatura inválida", 15, yPosition + 10);
    }
    const fileName = `Anamnese_${client.name.replace(/ /g, '_')}_${record.date.toDate().toLocaleDateString('pt-BR')}.pdf`;
    if (navigator.share) {
        const pdfBlob = doc.output('blob');
        const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
        try {
            await navigator.share({
                title: `Anamnese de ${client.name}`,
                text: `Segue a ficha de anamnese preenchida em ${record.date.toDate().toLocaleDateString('pt-BR')}.`,
                files: [pdfFile]
            });
        } catch (e) {
            console.log('Compartilhamento cancelado ou falhou', e);
        }
    } else {
        doc.save(fileName);
    }
}

function hasScheduleConflict(conflictDetails) {
    const { id: appointmentId, professionalId, date, serviceId, duration: blockDuration } = conflictDetails;
    let duration = 0;
    if (serviceId) {
        const service = state.services.find(s => s.id === serviceId);
        if (!service) return false;
        duration = service.duration;
    } else {
        duration = blockDuration;
    }
    const newStartTime = date.getTime();
    const newEndTime = newStartTime + (duration * 60000);
    for (const existingApp of state.appointments) {
        if (existingApp.professionalId !== professionalId) continue;
        if (appointmentId && existingApp.id === appointmentId) continue;
        let existingDuration = 0;
        if (existingApp.type === 'block') {
            existingDuration = existingApp.duration;
        } else {
            const existingService = state.services.find(s => s.id === existingApp.serviceId);
            if (!existingService) continue;
            existingDuration = existingService.duration;
        }
        const existingStartTime = existingApp.date.getTime();
        const existingEndTime = existingStartTime + (existingDuration * 60000);
        if (newStartTime < existingEndTime && existingStartTime < newEndTime) {
            return true;
        }
    }
    return false;
}

function updateSalonHeader() {
    const salonLogoEl = document.getElementById('salonLogo');
    const salonTitleEl = document.getElementById('salonTitle');
    if (state.salonInfo && state.salonInfo.logoUrl) {
        salonLogoEl.src = state.salonInfo.logoUrl;
        salonLogoEl.classList.remove('hidden');
        salonTitleEl.classList.add('hidden');
    } else if (state.salonInfo && state.salonInfo.name) {
        salonLogoEl.classList.add('hidden');
        salonTitleEl.textContent = state.salonInfo.name;
        salonTitleEl.classList.remove('hidden');
    } else {
        salonLogoEl.classList.add('hidden');
        salonTitleEl.textContent = 'Painel';
        salonTitleEl.classList.remove('hidden');
    }
}

function renderServices(servicesList) {
    if (!servicesList) return;
    servicesList.innerHTML = '';
    if (state.services.length === 0) {
        servicesList.innerHTML = `<p class="text-center text-gray-500">Nenhum serviço cadastrado.</p>`;
        return;
    }
    state.services.forEach(service => {
        const el = document.createElement('div');
        el.className = 'bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center';
        const price = typeof service.price === 'number' ? service.price.toFixed(2) : '0.00';
        el.innerHTML = `
            <div><p class="font-semibold text-gray-800">${service.name || ''}</p><p class="text-sm text-gray-500">R$ ${price.replace('.', ',')} - ${service.duration || 0} min</p></div>
            <div><button class="edit-service-btn text-blue-500 hover:text-blue-700 mr-2" data-id="${service.id}"><i class="fas fa-pencil-alt"></i></button><button class="delete-service-btn text-red-500 hover:text-red-700" data-id="${service.id}"><i class="fas fa-trash"></i></button></div>`;
        servicesList.appendChild(el);
    });
}

function renderProfessionals(professionalsList) {
    if (!professionalsList) return;
    professionalsList.innerHTML = '';
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
        professionalsList.appendChild(el);
    });
}

function renderClients(clientsList) {
    if (!clientsList) return;
    clientsList.innerHTML = '';
    state.clients.forEach(client => {
        const el = document.createElement('div');
        el.className = 'bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center';
        let adminButtons = '';
        if (state.role === 'salonOwner') {
            adminButtons = `
                <button class="edit-client-btn text-blue-500 hover:text-blue-700" data-id="${client.id}"><i class="fas fa-pencil-alt"></i></button>
                <button class="delete-client-btn text-red-500 hover:text-red-700" data-id="${client.id}"><i class="fas fa-trash"></i></button>
            `;
        }
        el.innerHTML = `
            <div class="flex-1 cursor-pointer client-profile-btn" data-id="${client.id}">
                <p class="font-semibold text-gray-800">${client.name}</p>
                <p class="text-sm text-gray-500">${client.phone}</p>
            </div>
            <div class="flex items-center gap-2">
                <button class="whatsapp-btn text-green-500" data-id="${client.id}"><i class="fab fa-whatsapp"></i></button>
                ${adminButtons}
            </div>`;
        clientsList.appendChild(el);
    });
}

function renderAppointmentsForDay(appointmentsForDay, appointmentsTitle, dateString) {
    if (dateString) { state.selectedDate = dateString; }
    const selected = state.selectedDate;
    if (!selected) {
        appointmentsForDay.innerHTML = `<p class="text-center text-gray-500 text-sm">Selecione um dia para ver os agendamentos.</p>`;
        return;
    }
    const dateObj = new Date(selected + 'T00:00:00');
    appointmentsTitle.textContent = `Agendamentos para ${dateObj.toLocaleDateString('pt-BR')}:`;
    const dayAppointments = state.appointments.filter(app => app.date && app.date.toISOString().split('T')[0] === selected).sort((a, b) => a.date - b.date);
    appointmentsForDay.innerHTML = '';
    if (dayAppointments.length === 0) {
        appointmentsForDay.innerHTML = `<p class="text-center text-gray-500 text-sm">Nenhum agendamento para este dia.</p>`;
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
                const startTimeStr = app.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const endTime = new Date(app.date.getTime() + app.duration * 60000);
                const endTimeStr = endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                el.innerHTML = `
                    <div class="pointer-events-none">
                        <p class="font-bold text-gray-600">${startTimeStr} - ${endTimeStr}</p>
                        <p class="font-semibold text-gray-800"><i class="fas fa-lock mr-2"></i>Bloqueado</p>
                        <p class="text-sm text-gray-600">${app.reason || 'Motivo não informado'}</p>
                    </div>`;
            } else {
                const client = state.clients.find(c => c.id === app.clientId);
                const service = state.services.find(s => s.id === app.serviceId);
                const serviceName = service?.name || '...';
                const prof = state.professionals.find(p => p.id === app.professionalId)?.name || '...';
                const startTime = app.date;
                const duration = service?.duration || 0;
                const endTime = new Date(startTime.getTime() + duration * 60000);
                const startTimeStr = startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const endTimeStr = endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
                        <p class="text-sm text-gray-600 pointer-events-none">${serviceName} com ${prof}</p>
                    </div>`;
            }
            appointmentsForDay.appendChild(el);
        });
    }
}

function renderCalendar(calendarDays, currentMonthYear) {
    calendarDays.innerHTML = '';
    const date = state.currentDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    const dailyView = document.getElementById('dailyView');
    if (dailyView && !dailyView.classList.contains('hidden')) {
        const selectedDateObj = new Date(state.selectedDate + 'T00:00:00');
        currentMonthYear.textContent = selectedDateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    } else {
        currentMonthYear.textContent = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDayOfMonth; i++) { calendarDays.innerHTML += `<div></div>`; }
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
        calendarDays.appendChild(dayEl);
    }
}

function renderDailyView(dailyViewTimeSlots, dailyViewTitle, dateString, openActionChoiceModal) {
    const date = new Date(dateString + 'T00:00:00');
    dailyViewTitle.textContent = `Agenda para ${date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`;
    dailyViewTimeSlots.innerHTML = '';
    const dayAppointments = state.appointments
        .filter(app => app.date && app.date.toISOString().split('T')[0] === dateString)
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
            const slotTimeStr = slotTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const el = document.createElement('div');
            el.className = 'flex items-start p-2 border-t border-gray-100 hover:bg-gray-50 cursor-pointer';
            el.style.height = `${SLOT_HEIGHT_REM}rem`;
            el.dataset.date = dateString;
            el.dataset.time = slotTimeStr;
            el.innerHTML = `<div class="text-xs font-bold text-gray-400 w-12">${slotTimeStr}</div>`;
            el.onclick = () => openActionChoiceModal(el.dataset.date, el.dataset.time);
            backgroundSlots.appendChild(el);
        }
    }
    dailyViewTimeSlots.appendChild(backgroundSlots);
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
        let hoverBgColor = isBlock ? 'hover:bg-gray-300' : 'hover:bg-blue-200';
        if (app.status === 'cancelado') {
            bgColor = 'bg-gray-100';
            borderColor = 'border-gray-300';
            hoverBgColor = 'hover:bg-gray-200';
            el.classList.add('opacity-70');
        }
        el.className = `absolute flex flex-col p-2 border-l-4 ${borderColor} ${bgColor} ${hoverBgColor} rounded-r-lg overflow-hidden cursor-pointer`;
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
        if (isBlock) {
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
        dailyViewTimeSlots.appendChild(el);
    });
}

function renderDashboard(agendamentosHojeEl, faturamentoHojeEl, totalClientesEl, totalServicosEl, proximosAgendamentosEl) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const agendamentosDeHoje = state.appointments.filter(app => app.type === 'booking' && app.status !== 'cancelado' && app.date && app.date.toISOString().split('T')[0] === todayStr);
    const faturadoHoje = state.appointments.filter(app => app.status === 'faturado' && app.date && app.date.toISOString().split('T')[0] === todayStr);
    agendamentosHojeEl.textContent = agendamentosDeHoje.length;
    const faturamentoDeHoje = faturadoHoje.reduce((total, app) => {
        const service = state.services.find(s => s.id === app.serviceId);
        return total + (service?.price || 0);
    }, 0);
    faturamentoHojeEl.textContent = `R$ ${faturamentoDeHoje.toFixed(2).replace('.', ',')}`;
    if (state.role === 'salonOwner') {
        totalClientesEl.textContent = state.clients.length;
        totalServicosEl.textContent = state.services.length;
    }
    const proximos = state.appointments.filter(app => app.type === 'booking' && app.status === 'agendado' && app.date && app.date >= today).sort((a, b) => a.date - b.date).slice(0, 3);
    proximosAgendamentosEl.innerHTML = '';
    if (proximos.length === 0) {
        proximosAgendamentosEl.innerHTML = `<p class="text-center text-gray-500 text-sm">Nenhum agendamento próximo.</p>`;
    } else {
        proximos.forEach(app => {
            const client = state.clients.find(c => c.id === app.clientId)?.name || '...';
            const service = state.services.find(s => s.id === app.serviceId)?.name || '...';
            const el = document.createElement('div');
            el.className = 'bg-white p-3 rounded-lg shadow-sm border';
            el.innerHTML = `
                <p class="font-bold text-blue-600">${app.date.toLocaleDateString('pt-BR')} - ${app.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                <p class="font-semibold text-gray-800">${client}</p>
                <p class="text-sm text-gray-600">${service}</p>`;
            proximosAgendamentosEl.appendChild(el);
        });
    }
}

function updateUIVisibility() {
    const role = state.role;
    const isOwner = role === 'salonOwner';
    const isProfessional = role === 'professional';
    const equipeBtn = document.querySelector('button[data-page="equipePage"]');
    const servicosBtn = document.querySelector('button[data-page="servicosPage"]');
    const openClientModalBtn = document.getElementById('openClientModalBtn');
    const totalClientesCard = document.getElementById('totalClientesCard');
    const totalServicosCard = document.getElementById('totalServicosCard');
    const adminFinancialSummary = document.getElementById('adminFinancialSummary');
    const adminFinancialDetails = document.getElementById('adminFinancialDetails');
    const professionalFinancialSummary = document.getElementById('professionalFinancialSummary');
    const openExpenseModalBtn = document.getElementById('openExpenseModalBtn');

    if (isOwner) {
        equipeBtn.style.display = 'block';
        servicosBtn.style.display = 'block';
        openClientModalBtn.style.display = 'block';
        totalClientesCard.style.display = 'block';
        totalServicosCard.style.display = 'block';
        adminFinancialSummary.style.display = 'grid';
        adminFinancialDetails.style.display = 'block';
        professionalFinancialSummary.classList.add('hidden');
        openExpenseModalBtn.style.display = 'flex';
    } else if (isProfessional) {
        equipeBtn.style.display = 'none';
        servicosBtn.style.display = 'none';
        openClientModalBtn.style.display = 'none';
        totalClientesCard.style.display = 'none';
        totalServicosCard.style.display = 'none';
        adminFinancialSummary.style.display = 'none';
        adminFinancialDetails.style.display = 'none';
        professionalFinancialSummary.classList.remove('hidden');
        openExpenseModalBtn.style.display = 'none';
    } else {
        document.querySelectorAll('.page, footer').forEach(el => el.style.display = 'none');
    }
}

function main() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loginPage = document.getElementById('loginPage');
    const appContainer = document.getElementById('appContainer');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginButton = document.getElementById('loginButton');
    const registerButton = document.getElementById('registerButton');
    const logoutButton = document.getElementById('logoutButton');
    const authError = document.getElementById('authError');
    const servicesList = document.getElementById('servicesList');
    const openServiceModalBtn = document.getElementById('openServiceModalBtn');
    const closeServiceModalBtn = document.getElementById('closeServiceModalBtn');
    const addServiceModal = document.getElementById('addServiceModal');
    const addServiceForm = document.getElementById('addServiceForm');
    const serviceModalTitle = document.getElementById('serviceModalTitle');
    const serviceIdToEdit = document.getElementById('serviceIdToEdit');
    const professionalsList = document.getElementById('professionalsList');
    const openProfessionalModalBtn = document.getElementById('openProfessionalModalBtn');
    const closeProfessionalModalBtn = document.getElementById('closeProfessionalModalBtn');
    const addProfessionalModal = document.getElementById('addProfessionalModal');
    const addProfessionalForm = document.getElementById('addProfessionalForm');
    const professionalServicesChecklist = document.getElementById('professionalServicesChecklist');
    const professionalModalTitle = document.getElementById('professionalModalTitle');
    const professionalIdToEdit = document.getElementById('professionalIdToEdit');
    const clientsList = document.getElementById('clientsList');
    const closeClientModalBtn = document.getElementById('closeClientModalBtn');
    const addClientModal = document.getElementById('addClientModal');
    const addClientForm = document.getElementById('addClientForm');
    const clientModalTitle = document.getElementById('clientModalTitle');
    const clientIdToEdit = document.getElementById('clientIdToEdit');
    const clientProfileModal = document.getElementById('clientProfileModal');
    const closeClientProfileModalBtn = document.getElementById('closeClientProfileModalBtn');
    const appointmentsTitle = document.getElementById('appointmentsTitle');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const calendarDays = document.getElementById('calendarDays');
    const appointmentsForDay = document.getElementById('appointmentsForDay');
    const monthViewBtn = document.getElementById('monthViewBtn');
    const dayViewBtn = document.getElementById('dayViewBtn');
    const monthlyView = document.getElementById('monthlyView');
    const dailyView = document.getElementById('dailyView');
    const dailyViewTitle = document.getElementById('dailyViewTitle');
    const dailyViewTimeSlots = document.getElementById('dailyViewTimeSlots');
    const addAppointmentModal = document.getElementById('addAppointmentModal');
    const closeAppointmentModalBtn = document.getElementById('closeAppointmentModalBtn');
    const addAppointmentForm = document.getElementById('addAppointmentForm');
    const appointmentModalTitle = document.getElementById('appointmentModalTitle');
    const appointmentIdToEdit = document.getElementById('appointmentIdToEdit');
    const deleteAppointmentBtn = document.getElementById('deleteAppointmentBtn');
    const startAppointmentAction = document.getElementById('startAppointmentAction');
    const startAppointmentBtn = document.getElementById('startAppointmentBtn');
    const editAppointmentActions = document.getElementById('editAppointmentActions');
    const invoiceAppointmentBtn = document.getElementById('invoiceAppointmentBtn');
    const cancelAppointmentBtn = document.getElementById('cancelAppointmentBtn');
    const openBlockTimeModalBtn = document.getElementById('openBlockTimeModalBtn');
    const closeBlockTimeModalBtn = document.getElementById('closeBlockTimeModalBtn');
    const blockTimeModal = document.getElementById('blockTimeModal');
    const blockTimeForm = document.getElementById('blockTimeForm');
    const blockIdToEdit = document.getElementById('blockIdToEdit');
    const deleteBlockBtn = document.getElementById('deleteBlockBtn');
    const actionChoiceModal = document.getElementById('actionChoiceModal');
    const newAppointmentChoiceBtn = document.getElementById('newAppointmentChoiceBtn');
    const blockTimeChoiceBtn = document.getElementById('blockTimeChoiceBtn');
    const cancelActionChoiceBtn = document.getElementById('cancelActionChoiceBtn');
    const observationModal = document.getElementById('observationModal');
    const observationForm = document.getElementById('observationForm');
    const invoiceWithoutObservationBtn = document.getElementById('invoiceWithoutObservationBtn');
    const cancelObservationBtn = document.getElementById('cancelObservationBtn');
    const confirmModal = document.getElementById('confirmModal');
    const confirmModalOk = document.getElementById('confirmModalOk');
    const confirmModalCancel = document.getElementById('confirmModalCancel');
    const faturamentoHojeEl = document.getElementById('faturamentoHoje');
    const agendamentosHojeEl = document.getElementById('agendamentosHoje');
    const totalClientesEl = document.getElementById('totalClientes');
    const totalServicosEl = document.getElementById('totalServicos');
    const proximosAgendamentosEl = document.getElementById('proximosAgendamentos');
    const whatsappMessageModal = document.getElementById('whatsappMessageModal');
    const whatsappMessagesList = document.getElementById('whatsappMessagesList');
    const closeWhatsappMessageModalBtn = document.getElementById('closeWhatsappMessageModalBtn');
    const reminderModal = document.getElementById('reminderModal');
    const reminderText = document.getElementById('reminderText');
    const reminderInvoiceBtn = document.getElementById('reminderInvoiceBtn');
    const reminderRescheduleBtn = document.getElementById('reminderRescheduleBtn');
    const closeReminderModalBtn = document.getElementById('closeReminderModalBtn');
    const anamnesisModal = document.getElementById('anamnesisModal');
    const anamnesisForm = document.getElementById('anamnesisForm');
    const closeAnamnesisModalBtn = document.getElementById('closeAnamnesisModalBtn');
    const canvas = document.getElementById('signature-pad');
    const clearSignatureBtn = document.getElementById('clearSignatureBtn');
    state.signaturePad = new SignaturePad(canvas);
    const blockDayModal = document.getElementById('blockDayModal');
    const closeBlockDayModalBtn = document.getElementById('closeBlockDayModalBtn');
    const blockDayForm = document.getElementById('blockDayForm');
    
    const refreshAllViews = () => {
        renderCalendar(calendarDays, currentMonthYear);
        renderAppointmentsForDay(appointmentsForDay, appointmentsTitle, state.selectedDate);
        renderFinancialPage(state);
        if (!dailyView.classList.contains('hidden')) {
            renderDailyView(dailyViewTimeSlots, dailyViewTitle, state.selectedDate, openActionChoiceModal);
        }
    };
    
    initializeReports(state);
    initializeFinancialEventListeners(state, refreshAllViews);
    initializeExpensesModal(state, db);

    registerButton.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        authError.textContent = '';
        if (!email || !password) {
            authError.textContent = "Preencha e-mail e senha.";
            return;
        }
        try {
            const q = query(collection(db, 'professionals'), where("email", "==", email));
            const professionalSnapshot = await getDocs(q);
            if (professionalSnapshot.empty) {
                authError.textContent = "E-mail não autorizado. Fale com o administrador do salão.";
                return;
            }
            const professionalDoc = professionalSnapshot.docs[0];
            if (professionalDoc.data().userId) {
                authError.textContent = "Este profissional já possui uma conta registrada. Tente fazer login.";
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const professionalRef = doc(db, 'professionals', professionalDoc.id);
            await updateDoc(professionalRef, {
                userId: user.uid
            });
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                authError.textContent = "Este e-mail já está em uso. Tente fazer login.";
            } else if (error.code === 'auth/weak-password') {
                authError.textContent = "A senha deve ter no mínimo 6 caracteres.";
            } else {
                authError.textContent = "Ocorreu um erro ao registrar.";
                console.error("Erro no registro:", error);
            }
        }
    });

    loginButton.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;
        authError.textContent = '';
        try { await signInWithEmailAndPassword(auth, email, password); }
        catch (error) { authError.textContent = "E-mail ou senha inválidos."; }
    });

    logoutButton.addEventListener('click', () => signOut(auth));

    monthViewBtn.addEventListener('click', () => {
        monthlyView.style.display = 'block';
        dailyView.classList.add('hidden');
        monthViewBtn.classList.add('active');
        dayViewBtn.classList.remove('active');
        renderCalendar(calendarDays, currentMonthYear);
    });

    dayViewBtn.addEventListener('click', () => {
        monthlyView.style.display = 'none';
        dailyView.classList.remove('hidden');
        monthViewBtn.classList.remove('active');
        dayViewBtn.classList.add('active');
        renderDailyView(dailyViewTimeSlots, dailyViewTitle, state.selectedDate, openActionChoiceModal);
        renderCalendar(calendarDays, currentMonthYear);
    });

    calendarDays.addEventListener('click', (e) => {
        const dayEl = e.target.closest('.calendar-day');
        if (dayEl && dayEl.dataset.date) {
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('day-selected'));
            dayEl.classList.add('day-selected');
            state.selectedDate = dayEl.dataset.date;
            renderAppointmentsForDay(appointmentsForDay, appointmentsTitle, state.selectedDate);
            dayViewBtn.click();
        }
    });

    prevMonthBtn.addEventListener('click', () => {
        if (!dailyView.classList.contains('hidden')) {
            const currentDate = new Date(state.selectedDate + 'T00:00:00');
            currentDate.setDate(currentDate.getDate() - 1);
            state.selectedDate = currentDate.toISOString().split('T')[0];
            state.currentDate = currentDate;
            refreshAllViews();
        } else {
            state.currentDate.setMonth(state.currentDate.getMonth() - 1);
            refreshAllViews();
        }
    });

    nextMonthBtn.addEventListener('click', () => {
        if (!dailyView.classList.contains('hidden')) {
            const currentDate = new Date(state.selectedDate + 'T00:00:00');
            currentDate.setDate(currentDate.getDate() + 1);
            state.selectedDate = currentDate.toISOString().split('T')[0];
            state.currentDate = currentDate;
            refreshAllViews();
        } else {
            state.currentDate.setMonth(state.currentDate.getMonth() + 1);
            refreshAllViews();
        }
    });

    openServiceModalBtn.addEventListener('click', () => {
        serviceModalTitle.textContent = 'Adicionar Serviço';
        addServiceForm.reset();
        serviceIdToEdit.value = '';
        addServiceModal.classList.remove('hidden');
    });

    closeServiceModalBtn.addEventListener('click', () => addServiceModal.classList.add('hidden'));

    addServiceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = serviceIdToEdit.value;
        const data = {
            name: document.getElementById('serviceName').value,
            price: parseFloat(document.getElementById('servicePrice').value),
            duration: parseInt(document.getElementById('serviceDuration').value),
            salonId: state.userSalonId
        };
        try {
            if (id) { await updateDoc(doc(db, 'services', id), data); }
            else { await addDoc(collection(db, 'services'), data); }
            addServiceForm.reset(); addServiceModal.classList.add('hidden');
        } catch (err) { console.error(err); }
    });

    openProfessionalModalBtn.addEventListener('click', () => {
        professionalModalTitle.textContent = 'Adicionar Profissional';
        addProfessionalForm.reset();
        professionalIdToEdit.value = '';
        document.getElementById('professionalEmail').readOnly = false;
        document.getElementById('professionalEmail').classList.remove('bg-gray-100');
        professionalServicesChecklist.innerHTML = '';
        state.services.forEach(service => {
            professionalServicesChecklist.innerHTML += `<div class="flex items-center"><input id="service-add-${service.id}" name="services-add" value="${service.id}" type="checkbox" class="h-4 w-4 text-blue-600 rounded"><label for="service-add-${service.id}" class="ml-2 text-sm">${service.name}</label></div>`;
        });
        addProfessionalModal.classList.remove('hidden');
    });

    closeProfessionalModalBtn.addEventListener('click', () => addProfessionalModal.classList.add('hidden'));

    addProfessionalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = professionalIdToEdit.value;
        const name = id ? 'services-edit' : 'services-add';
        const data = {
            name: document.getElementById('professionalName').value,
            email: document.getElementById('professionalEmail').value,
            commission: parseInt(document.getElementById('professionalCommission').value),
            serviceIds: Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value),
            salonId: state.userSalonId
        };
        if (!data.name || !data.commission || !data.email) { alert('Preencha nome, e-mail e comissão.'); return; }
        try {
            if (id) {
                const { salonId, email, ...updateData } = data;
                await updateDoc(doc(db, 'professionals', id), updateData);
            } else {
                await addDoc(collection(db, 'professionals'), data);
            }
            addProfessionalForm.reset();
            addProfessionalModal.classList.add('hidden');
        } catch (err) { console.error(err); }
    });

    document.getElementById('openClientModalBtn').addEventListener('click', () => {
        clientModalTitle.textContent = 'Adicionar Cliente';
        addClientForm.reset();
        clientIdToEdit.value = '';
        addClientModal.classList.remove('hidden');
    });

    closeClientModalBtn.addEventListener('click', () => addClientModal.classList.add('hidden'));

    addClientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = clientIdToEdit.value;
        const data = {
            name: document.getElementById('clientName').value,
            phone: document.getElementById('clientPhone').value,
            address: document.getElementById('clientAddress').value,
            observations: document.getElementById('clientObservations').value,
            salonId: state.userSalonId
        };
        if (!data.name || !data.phone) { alert('Nome e telefone são obrigatórios.'); return; }
        try {
            if (id) { await updateDoc(doc(db, 'clients', id), data); }
            else { await addDoc(collection(db, 'clients'), data); }
            addClientForm.reset(); addClientModal.classList.add('hidden');
        } catch (err) { console.error(err); }
    });

    closeClientProfileModalBtn.addEventListener('click', () => clientProfileModal.classList.add('hidden'));

    function openAppointmentModal(date, appointmentId = null) {
        addAppointmentForm.reset();
        document.getElementById('appointmentDate').value = date;
        deleteAppointmentBtn.classList.add('hidden');
        editAppointmentActions.classList.add('hidden');
        startAppointmentAction.classList.add('hidden');
        document.getElementById('appointmentObservationDisplay').classList.add('hidden');
        const clientSelect = document.getElementById('appointmentClient');
        clientSelect.innerHTML = '<option value="">Selecione um cliente</option>';
        state.clients.forEach(c => clientSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`);
        const profSelect = document.getElementById('appointmentProfessional');
        profSelect.innerHTML = '<option value="">Selecione um profissional</option>';
        state.professionals.forEach(p => profSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`);
        const serviceSelect = document.getElementById('appointmentService');
        serviceSelect.innerHTML = '<option value="">Selecione um serviço</option>';
        state.services.forEach(s => serviceSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`);
        if (appointmentId) {
            const app = state.appointments.find(a => a.id === appointmentId);
            appointmentModalTitle.textContent = 'Editar Agendamento';
            appointmentIdToEdit.value = app.id;
            document.getElementById('appointmentTime').value = app.date.toTimeString().substring(0, 5);
            clientSelect.value = app.clientId;
            profSelect.value = app.professionalId;
            serviceSelect.value = app.serviceId;
            deleteAppointmentBtn.classList.remove('hidden');
            if (app.status === 'agendado') {
                startAppointmentAction.classList.remove('hidden');
            }
            else if (app.status === 'concluido') {
                editAppointmentActions.classList.remove('hidden');
            }
            if (app.observation) {
                document.getElementById('appointmentObservationText').textContent = app.observation;
                document.getElementById('appointmentObservationDisplay').classList.remove('hidden');
            }
        }
        else {
            appointmentModalTitle.textContent = 'Novo Agendamento';
            appointmentIdToEdit.value = '';
        }
        addAppointmentModal.classList.remove('hidden');
    }

    closeAppointmentModalBtn.addEventListener('click', () => addAppointmentModal.classList.add('hidden'));

    addAppointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = appointmentIdToEdit.value;
        const dateTime = new Date(`${document.getElementById('appointmentDate').value}T${document.getElementById('appointmentTime').value}`);
        const professionalId = document.getElementById('appointmentProfessional').value;
        const serviceId = document.getElementById('appointmentService').value;
        if (hasScheduleConflict({ id, professionalId, date: dateTime, serviceId })) {
            alert("Conflito de agenda! Esta profissional já está ocupada neste horário.");
            return;
        }
        const data = {
            date: Timestamp.fromDate(dateTime),
            clientId: document.getElementById('appointmentClient').value,
            professionalId: professionalId,
            serviceId: serviceId,
            type: 'booking',
            status: 'agendado',
            salonId: state.userSalonId
        };
        if (!data.clientId || !data.professionalId || !data.serviceId) {
            alert('Preencha todos os campos.');
            return;
        }
        try {
            if (id) {
                await updateDoc(doc(db, 'appointments', id), data);
            }
            else {
                await addDoc(collection(db, 'appointments'), data);
            }
            addAppointmentForm.reset();
            addAppointmentModal.classList.add('hidden');
        } catch (err) {
            console.error(err);
        }
    });

    deleteAppointmentBtn.addEventListener('click', () => {
        const id = appointmentIdToEdit.value;
        if (!id)
            return;
        showConfirmModal('Tem certeza que deseja excluir este agendamento?', () => {
            deleteDoc(doc(db, 'appointments', id))
                .then(() => {
                addAppointmentModal.classList.add('hidden');
            })
                .catch(err => console.error(err));
        });
    });

    const updateAppointmentStatus = async (status, id, observation = null) => {
        if (!id)
            return;
        try {
            const dataToUpdate = { status };
            if (observation) {
                dataToUpdate.observation = observation;
            }
            await updateDoc(doc(db, 'appointments', id), dataToUpdate);
            addAppointmentModal.classList.add('hidden');
            observationModal.classList.add('hidden');
        }
        catch (err) {
            console.error(err);
        }
    };

    function openObservationModal(appointmentId) {
        document.getElementById('observationAppointmentId').value = appointmentId;
        observationForm.reset();
        addAppointmentModal.classList.add('hidden');
        reminderModal.classList.add('hidden');
        observationModal.classList.remove('hidden');
    }

    invoiceAppointmentBtn.addEventListener('click', () => openObservationModal(appointmentIdToEdit.value));

    reminderInvoiceBtn.addEventListener('click', (e) => openObservationModal(e.target.dataset.id));

    observationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('observationAppointmentId').value;
        const text = document.getElementById('observationText').value;
        updateAppointmentStatus('faturado', id, text);
    });

    invoiceWithoutObservationBtn.addEventListener('click', () => {
        const id = document.getElementById('observationAppointmentId').value;
        updateAppointmentStatus('faturado', id);
    });

    cancelObservationBtn.addEventListener('click', () => observationModal.classList.add('hidden'));

    cancelAppointmentBtn.addEventListener('click', () => {
        showConfirmModal('Tem certeza que deseja cancelar este atendimento?', () => {
            updateAppointmentStatus('cancelado', appointmentIdToEdit.value);
        });
    });

    function openBlockTimeModal(blockId = null) {
        blockTimeForm.reset();
        blockIdToEdit.value = '';
        deleteBlockBtn.classList.add('hidden');
        document.getElementById('blockDate').value = state.selectedDate;
        const profSelect = document.getElementById('blockProfessional');
        const profSelectContainer = document.getElementById('blockProfessionalAdminView');
        const profNameContainer = document.getElementById('blockProfessionalUserView');
        if (state.role === 'salonOwner') {
            profSelectContainer.style.display = 'block';
            profNameContainer.style.display = 'none';
            profSelect.innerHTML = '<option value="">Selecione um profissional</option>';
            state.professionals.forEach(p => profSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`);
        }
        else {
            profSelectContainer.style.display = 'none';
            profNameContainer.style.display = 'block';
            document.getElementById('blockProfessionalName').textContent = state.professionalProfile.name;
        }
        if (blockId) {
            const block = state.appointments.find(b => b.id === blockId);
            document.getElementById('blockTimeModalTitle').textContent = 'Editar Bloqueio';
            blockIdToEdit.value = block.id;
            if (state.role === 'salonOwner')
                profSelect.value = block.professionalId;
            document.getElementById('blockStartTime').value = block.date.toTimeString().substring(0, 5);
            const endTime = new Date(block.date.getTime() + block.duration * 60000);
            document.getElementById('blockEndTime').value = endTime.toTimeString().substring(0, 5);
            document.getElementById('blockReason').value = block.reason;
            deleteBlockBtn.classList.remove('hidden');
        }
        else {
            document.getElementById('blockTimeModalTitle').textContent = 'Bloquear Horário';
        }
        blockTimeModal.classList.remove('hidden');
    }

    closeBlockTimeModalBtn.addEventListener('click', () => blockTimeModal.classList.add('hidden'));

    blockTimeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = blockIdToEdit.value;
        const date = document.getElementById('blockDate').value;
        const startTime = document.getElementById('blockStartTime').value;
        const endTime = document.getElementById('blockEndTime').value;
        const professionalId = state.role === 'salonOwner' ? document.getElementById('blockProfessional').value : state.professionalProfile.id;
        if (!startTime || !endTime || !professionalId || endTime <= startTime) {
            alert('Por favor, preencha todos os campos e verifique se o horário de término é após o de início.');
            return;
        }
        const startDateTime = new Date(`${date}T${startTime}`);
        const endDateTime = new Date(`${date}T${endTime}`);
        const duration = (endDateTime - startDateTime) / 60000;
        if (hasScheduleConflict({ id, professionalId, date: startDateTime, duration })) {
            alert("Conflito de agenda! Já existe um agendamento ou bloqueio neste período.");
            return;
        }
        const data = {
            date: Timestamp.fromDate(startDateTime),
            professionalId: professionalId,
            duration: duration,
            reason: document.getElementById('blockReason').value || 'Bloqueado',
            type: 'block',
            salonId: state.userSalonId
        };
        try {
            if (id) {
                await updateDoc(doc(db, 'appointments', id), data);
            }
            else {
                await addDoc(collection(db, 'appointments'), data);
            }
            blockTimeForm.reset();
            blockTimeModal.classList.add('hidden');
        }
        catch (err) {
            console.error(err);
        }
    });

    deleteBlockBtn.addEventListener('click', () => {
        const id = blockIdToEdit.value;
        if (!id)
            return;
        showConfirmModal('Tem certeza que deseja excluir este bloqueio?', () => {
            deleteDoc(doc(db, 'appointments', id))
                .then(() => {
                blockTimeModal.classList.add('hidden');
            })
                .catch(err => console.error(err));
        });
    });

    function openBlockDayModal() {
        document.getElementById('blockDayDate').textContent = new Date(state.selectedDate + 'T00:00:00').toLocaleDateString('pt-BR');
        const adminView = document.getElementById('blockDayProfessionalAdminView');
        const userView = document.getElementById('blockDayProfessionalUserView');
        if (state.role === 'salonOwner') {
            adminView.style.display = 'block';
            userView.style.display = 'none';
            const selectEl = document.getElementById('blockDayProfessional');
            selectEl.innerHTML = '<option value="">Selecione...</option>';
            state.professionals.forEach(p => {
                selectEl.innerHTML += `<option value="${p.id}">${p.name}</option>`;
            });
        }
        else {
            adminView.style.display = 'none';
            userView.style.display = 'block';
            document.getElementById('blockDayProfessionalName').textContent = state.professionalProfile.name;
        }
        blockDayModal.classList.remove('hidden');
    }

    openBlockTimeModalBtn.addEventListener('click', openBlockDayModal);

    closeBlockDayModalBtn.addEventListener('click', () => blockDayModal.classList.add('hidden'));

    blockDayForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let professionalId;
        let professionalName;
        if (state.role === 'salonOwner') {
            const selectEl = document.getElementById('blockDayProfessional');
            professionalId = selectEl.value;
            if (!professionalId) {
                alert('Por favor, selecione um profissional.');
                return;
            }
            professionalName = selectEl.options[selectEl.selectedIndex].text;
        }
        else {
            professionalId = state.professionalProfile.id;
            professionalName = state.professionalProfile.name;
        }
        const dayHasAppointments = state.appointments.some(app => app.professionalId === professionalId &&
            app.date.toISOString().split('T')[0] === state.selectedDate &&
            app.type === 'booking' &&
            app.status !== 'cancelado');
        if (dayHasAppointments) {
            alert(`Não é possível bloquear o dia para ${professionalName}, pois já existem agendamentos marcados. Por favor, cancele ou reagende os atendimentos primeiro.`);
            return;
        }
        showConfirmModal(`Tem certeza que deseja bloquear o dia inteiro para ${professionalName}?`, async () => {
            const START_HOUR = 8;
            const END_HOUR = 19;
            const DURATION_MINUTES = (END_HOUR - START_HOUR) * 60;
            const startDateTime = new Date(`${state.selectedDate}T08:00:00`);
            const data = {
                date: Timestamp.fromDate(startDateTime),
                professionalId: professionalId,
                duration: DURATION_MINUTES,
                reason: 'Dia bloqueado',
                type: 'block',
                salonId: state.userSalonId
            };
            try {
                await addDoc(collection(db, 'appointments'), data);
                blockDayModal.classList.add('hidden');
            }
            catch (err) {
                console.error("Erro ao bloquear o dia:", err);
                alert("Ocorreu um erro ao tentar bloquear o dia.");
            }
        });
    });

    function openActionChoiceModal(date, time) {
        state.tempSlot = { date, time };
        actionChoiceModal.classList.remove('hidden');
    }

    newAppointmentChoiceBtn.addEventListener('click', () => {
        actionChoiceModal.classList.add('hidden');
        openAppointmentModal(state.tempSlot.date);
        document.getElementById('appointmentTime').value = state.tempSlot.time;
    });

    blockTimeChoiceBtn.addEventListener('click', () => {
        actionChoiceModal.classList.add('hidden');
        openBlockTimeModal();
        document.getElementById('blockStartTime').value = state.tempSlot.time;
    });

    cancelActionChoiceBtn.addEventListener('click', () => {
        actionChoiceModal.classList.add('hidden');
    });

    function openWhatsAppMessageModal(clientId) {
        const client = state.clients.find(c => c.id === clientId);
        if (!client)
            return;
        state.tempClient = client;
        whatsappMessagesList.innerHTML = '';
        const professionalName = state.role === 'professional' ? state.professionalProfile.name : "Nós do Salão";
        whatsappMessages.forEach(msg => {
            const finalMsg = msg
                .replace('{cliente}', client.name.split(' ')[0])
                .replace('{profissional}', professionalName);
            const el = document.createElement('button');
            el.className = 'w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm';
            el.textContent = finalMsg;
            el.dataset.message = finalMsg;
            whatsappMessagesList.appendChild(el);
        });
        whatsappMessageModal.classList.remove('hidden');
    }

    closeWhatsappMessageModalBtn.addEventListener('click', () => whatsappMessageModal.classList.add('hidden'));

    whatsappMessagesList.addEventListener('click', (e) => {
        const messageBtn = e.target.closest('button');
        if (!messageBtn || !messageBtn.dataset.message)
            return;
        const message = messageBtn.dataset.message;
        const phone = state.tempClient.phone.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        const url = `https://wa.me/55${phone}?text=${encodedMessage}`;
        window.open(url, '_blank');
        whatsappMessageModal.classList.add('hidden');
    });

    function showReminderModal(app) {
        const client = state.clients.find(c => c.id === app.clientId);
        reminderText.textContent = `Atendimento de ${client?.name || 'Cliente'} finalizou. Deseja faturar ou reagendar?`;
        reminderInvoiceBtn.dataset.id = app.id;
        reminderRescheduleBtn.dataset.id = app.id;
        reminderModal.classList.remove('hidden');
        const remindedApp = state.appointments.find(a => a.id === app.id);
        if (remindedApp)
            remindedApp.reminderSent = true;
    }

    closeReminderModalBtn.addEventListener('click', () => reminderModal.classList.add('hidden'));

    reminderRescheduleBtn.addEventListener('click', (e) => {
        const appId = e.target.dataset.id;
        const app = state.appointments.find(a => a.id === appId);
        if (app)
            openAppointmentModal(app.date.toISOString().split('T')[0], appId);
        reminderModal.classList.add('hidden');
    });

    function checkAppointmentsForReminders() {
        if (state.role !== 'professional')
            return;
        const now = new Date();
        for (const app of state.appointments) {
            if (app.status !== 'agendado' || app.type !== 'booking' || app.reminderSent)
                continue;
            const service = state.services.find(s => s.id === app.serviceId);
            if (!service)
                continue;
            const endTime = new Date(app.date.getTime() + service.duration * 60000);
            const reminderTime = new Date(endTime.getTime() + 10 * 60000);
            if (now > reminderTime) {
                showReminderModal(app);
                break;
            }
        }
    }

    function openAnamnesisModal(appointmentId) {
        const app = state.appointments.find(a => a.id === appointmentId);
        const client = state.clients.find(c => c.id === app.clientId);
        if (!app || !client)
            return;
        anamnesisForm.reset();
        state.signaturePad.clear();
        document.getElementById('anamnesisAppointmentId').value = app.id;
        document.getElementById('anamnesisClientId').value = client.id;
        document.getElementById('anamnesisClientName').textContent = client.name;
        document.getElementById('anamnesisClientPhone').textContent = client.phone;
        if (client.anamnesisHistory && client.anamnesisHistory.length > 0) {
            const lastRecord = client.anamnesisHistory[client.anamnesisHistory.length - 1];
            Object.keys(lastRecord.answers).forEach(key => {
                const value = lastRecord.answers[key];
                const input = anamnesisForm.querySelector(`[name="${key}"][value="${value}"]`);
                if (input && input.type === 'radio') {
                    input.checked = true;
                }
                else {
                    const textInput = anamnesisForm.querySelector(`[name="${key}"]`);
                    if (textInput)
                        textInput.value = value;
                }
            });
        }
        addAppointmentModal.classList.add('hidden');
        anamnesisModal.classList.remove('hidden');
    }

    startAppointmentBtn.addEventListener('click', () => {
        const appId = appointmentIdToEdit.value;
        openAnamnesisModal(appId);
    });

    clearSignatureBtn.addEventListener('click', () => state.signaturePad.clear());

    closeAnamnesisModalBtn.addEventListener('click', () => anamnesisModal.classList.add('hidden'));

    anamnesisForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (state.signaturePad.isEmpty()) {
            alert('A assinatura do cliente é obrigatória.');
            return;
        }
        const clientId = document.getElementById('anamnesisClientId').value;
        const appointmentId = document.getElementById('anamnesisAppointmentId').value;
        const formData = new FormData(anamnesisForm);
        const answers = {};
        for (let [key, value] of formData.entries()) {
            answers[key] = value;
        }
        const newRecord = {
            date: Timestamp.now(),
            answers: answers,
            signature: state.signaturePad.toDataURL()
        };
        try {
            const clientRef = doc(db, 'clients', clientId);
            const clientSnap = await getDoc(clientRef);
            if (clientSnap.exists()) {
                const existingHistory = clientSnap.data().anamnesisHistory || [];
                const updatedHistory = [...existingHistory, newRecord];
                await updateDoc(clientRef, {
                    anamnesisHistory: updatedHistory
                });
                await updateDoc(doc(db, 'appointments', appointmentId), {
                    status: 'concluido'
                });
                anamnesisModal.classList.add('hidden');
            }
            else {
                console.error("Cliente não encontrado para salvar anamnese.");
                alert("Ocorreu um erro: cliente não encontrado.");
            }
        }
        catch (err) {
            console.error("Erro ao salvar ficha:", err);
            alert("Ocorreu um erro ao salvar a ficha. Tente novamente.");
        }
    });

    function openClientProfileModal(clientId) {
        const client = state.clients.find(c => c.id === clientId);
        if (!client)
            return;
        document.getElementById('profileClientName').textContent = client.name;
        document.getElementById('profileClientPhone').textContent = client.phone;
        document.getElementById('profileClientAddress').textContent = client.address || 'Não informado';
        document.getElementById('profileClientObservations').textContent = client.observations || 'Nenhuma observação.';
        const historyContainer = document.getElementById('anamnesisHistoryContainer');
        historyContainer.innerHTML = '';
        if (client.anamnesisHistory && client.anamnesisHistory.length > 0) {
            [...client.anamnesisHistory].reverse().forEach(record => {
                const el = document.createElement('details');
                el.className = 'bg-gray-100 p-2 rounded-lg text-sm';
                const contentDiv = document.createElement('div');
                contentDiv.className = 'mt-2 pt-2 border-t text-xs space-y-1';
                const answers = record.answers;
                const formatYesNo = (value) => (value || 'nao').replace('nao', 'Não').replace('sim', 'Sim');
                contentDiv.innerHTML = `
                    <p><strong>1. Alergias:</strong> ${answers.alergia === 'sim' ? `Sim - ${answers.alergia_qual || 'Não especificado'}` : 'Não'}</p>
                    <p><strong>2. Doenças de Pele:</strong> ${answers.doenca_pele === 'sim' ? `Sim - ${answers.doenca_pele_qual || 'Não especificado'}` : 'Não'}</p>
                    <p><strong>3. Problemas de Coagulação:</strong> ${formatYesNo(answers.coagulacao)}</p>
                    <p><strong>4. Diabetes:</strong> ${formatYesNo(answers.diabetes)}</p>
                    <p><strong>5. Infecção Prévia:</strong> ${formatYesNo(answers.infeccao)}</p>
                    <p><strong>6. Gestante:</strong> ${formatYesNo(answers.gestante)}</p>
                    <p class="mt-2"><strong>Assinatura:</strong></p>
                    <img src="${record.signature}" class="border rounded">
                `;
                const summary = document.createElement('summary');
                summary.className = 'font-semibold cursor-pointer flex justify-between items-center';
                const dateText = document.createElement('span');
                dateText.textContent = `Ficha de ${record.date.toDate().toLocaleDateString('pt-BR')}`;
                const pdfButton = document.createElement('button');
                pdfButton.className = 'bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600';
                pdfButton.innerHTML = '<i class="fas fa-file-pdf mr-1"></i> Exportar';
                pdfButton.onclick = (e) => {
                    e.preventDefault();
                    exportAnamnesisToPDF(client, record);
                };
                summary.appendChild(dateText);
                summary.appendChild(pdfButton);
                el.appendChild(summary);
                el.appendChild(contentDiv);
                historyContainer.appendChild(el);
            });
        }
        else {
            historyContainer.innerHTML = `<p class="text-sm text-gray-500">Nenhum histórico encontrado.</p>`;
        }
        clientProfileModal.classList.remove('hidden');
    }

    confirmModalOk.addEventListener('click', () => {
        if (typeof confirmAction === 'function') {
            confirmAction();
        }
        confirmModal.classList.add('hidden');
    });

    confirmModalCancel.addEventListener('click', () => confirmModal.classList.add('hidden'));

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pageId = e.currentTarget.dataset.page;
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(pageId)?.classList.add('active');
            document.querySelectorAll('.nav-btn').forEach(nav => {
                nav.classList.remove('text-blue-600', 'font-bold');
                nav.classList.add('text-gray-400');
                nav.querySelector('p').classList.remove('font-bold');
            });
            e.currentTarget.classList.add('text-blue-600');
            e.currentTarget.classList.remove('text-gray-400');
            e.currentTarget.querySelector('p').classList.add('font-bold');
        });
    });

    onAuthStateChanged(auth, async (user) => {
        if (state.reminderInterval)
            clearInterval(state.reminderInterval);
        state.unsubscribes.forEach(unsub => unsub());
        state.unsubscribes.length = 0;
        if (user) {
            state.user = user;
            let foundRole = false;
            const professionalsRef = collection(db, 'professionals');
            const q = query(professionalsRef, where("userId", "==", user.uid));
            const professionalSnapshot = await getDocs(q);
            if (!professionalSnapshot.empty) {
                const professionalDoc = professionalSnapshot.docs[0];
                state.professionalProfile = { id: professionalDoc.id, ...professionalDoc.data() };
                state.role = 'professional';
                state.userSalonId = professionalDoc.data().salonId;
                state.reminderInterval = setInterval(checkAppointmentsForReminders, 60000);
                foundRole = true;
            }
            if (!foundRole) {
                const salonsRef = collection(db, 'salons');
                const q = query(salonsRef, where("ownerId", "==", user.uid));
                const salonSnapshot = await getDocs(q);
                if (!salonSnapshot.empty) {
                    const salonDoc = salonSnapshot.docs[0];
                    state.role = 'salonOwner';
                    state.userSalonId = salonDoc.id;
                    foundRole = true;
                }
            }
            if (!foundRole) {
                console.log("Usuário sem papel definido. Deslogando.");
                signOut(auth);
                return;
            }
            if (state.userSalonId) {
                const salonRef = doc(db, 'salons', state.userSalonId);
                const salonSnap = await getDoc(salonRef);
                if (salonSnap.exists()) {
                    state.salonInfo = salonSnap.data();
                }
                else {
                    console.error("Salão não encontrado para o ID:", state.userSalonId);
                    signOut(auth);
                    return;
                }
            }
            const renderAll = () => {
                updateSalonHeader();
                renderServices(document.getElementById('servicesList'));
                renderProfessionals(document.getElementById('professionalsList'));
                renderClients(document.getElementById('clientsList'));
                renderAppointmentsForDay(document.getElementById('appointmentsForDay'), document.getElementById('appointmentsTitle'), state.selectedDate);
                renderDashboard(document.getElementById('agendamentosHoje'), document.getElementById('faturamentoHoje'), document.getElementById('totalClientes'), document.getElementById('totalServicos'), document.getElementById('proximosAgendamentos'));
                renderFinancialPage(state);
                renderCalendar(document.getElementById('calendarDays'), document.getElementById('currentMonthYear'));
                if (!document.getElementById('dailyView').classList.contains('hidden')) {
                    renderDailyView(document.getElementById('dailyViewTimeSlots'), document.getElementById('dailyViewTitle'), state.selectedDate, openActionChoiceModal);
                }
            };
            const collectionsToListen = {
                services: "services",
                clients: "clients",
                professionals: "professionals",
                appointments: "appointments",
            };
            
            // CORRIGIDO: O "ouvinte" de despesas só é ativado para o dono do salão
            if (state.role === 'salonOwner') {
                const expensesQuery = query(collection(db, 'expenses'), where("salonId", "==", state.userSalonId));
                const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
                    state.expenses = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        dueDate: doc.data().dueDate?.toDate(),
                        createdAt: doc.data().createdAt?.toDate()
                    }));
                    renderAll();
                }, error => {
                    console.error(`Erro ao ouvir a coleção expenses:`, error);
                });
                state.unsubscribes.push(unsubExpenses);
            }

            Object.keys(collectionsToListen).forEach(key => {
                const collectionName = collectionsToListen[key];
                const collectionRef = collection(db, collectionName);
                const q = query(collectionRef, where("salonId", "==", state.userSalonId));
                const unsub = onSnapshot(q, (snapshot) => {
                    state[key] = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        date: doc.data().date?.toDate(),
                    }));
                    renderAll();
                }, error => {
                    console.error(`Erro ao ouvir a coleção ${collectionName}:`, error);
                });
                state.unsubscribes.push(unsub);
            });
            updateUIVisibility();
            appContainer.classList.remove('hidden');
            loginPage.classList.add('hidden');
        }
        else {
            state.user = null;
            state.role = 'client';
            state.userSalonId = null;
            state.professionalProfile = null;
            state.salonInfo = null;
            state.appointments = [];
            state.professionals = [];
            state.clients = [];
            state.services = [];
            state.expenses = [];
            appContainer.classList.add('hidden');
            loginPage.classList.remove('hidden');
        }
        setTimeout(() => loadingOverlay.classList.add('hidden'), 500);
    });
    servicesList.addEventListener('click', (e) => {
        if (state.role !== 'salonOwner')
            return;
        const editBtn = e.target.closest('.edit-service-btn');
        const deleteBtn = e.target.closest('.delete-service-btn');
        if (editBtn) {
            const serviceId = editBtn.dataset.id;
            const serviceToEdit = state.services.find(s => s.id === serviceId);
            if (serviceToEdit) {
                serviceModalTitle.textContent = 'Editar Serviço';
                serviceIdToEdit.value = serviceId;
                document.getElementById('serviceName').value = serviceToEdit.name;
                document.getElementById('servicePrice').value = serviceToEdit.price;
                document.getElementById('serviceDuration').value = serviceToEdit.duration;
                addServiceModal.classList.remove('hidden');
            }
        }
        if (deleteBtn) {
            const serviceId = deleteBtn.dataset.id;
            showConfirmModal('Tem certeza que deseja excluir este serviço?', () => {
                deleteDoc(doc(db, 'services', serviceId)).catch(err => console.error(err));
            });
        }
    });
    clientsList.addEventListener('click', (e) => {
        const whatsAppBtn = e.target.closest('.whatsapp-btn');
        if (whatsAppBtn) {
            openWhatsAppMessageModal(whatsAppBtn.dataset.id);
            return;
        }
        const profileBtn = e.target.closest('.client-profile-btn');
        if (profileBtn) {
            openClientProfileModal(profileBtn.dataset.id);
            return;
        }
        if (state.role !== 'salonOwner')
            return;
        const editBtn = e.target.closest('.edit-client-btn');
        const deleteBtn = e.target.closest('.delete-client-btn');
        if (editBtn) {
            const clientId = editBtn.dataset.id;
            const clientToEdit = state.clients.find(c => c.id === clientId);
            if (clientToEdit) {
                clientModalTitle.textContent = 'Editar Cliente';
                clientIdToEdit.value = clientId;
                document.getElementById('clientName').value = clientToEdit.name;
                document.getElementById('clientPhone').value = clientToEdit.phone;
                document.getElementById('clientAddress').value = clientToEdit.address || '';
                document.getElementById('clientObservations').value = clientToEdit.observations || '';
                addClientModal.classList.remove('hidden');
            }
        }
        if (deleteBtn) {
            const clientId = deleteBtn.dataset.id;
            showConfirmModal('Tem certeza que deseja excluir este cliente?', () => {
                deleteDoc(doc(db, 'clients', clientId)).catch(err => console.error(err));
            });
        }
    });
    professionalsList.addEventListener('click', (e) => {
        if (state.role !== 'salonOwner')
            return;
        const editBtn = e.target.closest('.edit-professional-btn');
        const deleteBtn = e.target.closest('.delete-professional-btn');
        if (editBtn) {
            const profId = editBtn.dataset.id;
            const profToEdit = state.professionals.find(p => p.id === profId);
            if (profToEdit) {
                professionalModalTitle.textContent = 'Editar Profissional';
                professionalIdToEdit.value = profId;
                document.getElementById('professionalName').value = profToEdit.name;
                const emailInput = document.getElementById('professionalEmail');
                emailInput.value = profToEdit.email || '';
                emailInput.readOnly = true;
                emailInput.classList.add('bg-gray-100');
                document.getElementById('professionalCommission').value = profToEdit.commission;
                professionalServicesChecklist.innerHTML = '';
                state.services.forEach(service => {
                    const isChecked = profToEdit.serviceIds?.includes(service.id) ? 'checked' : '';
                    professionalServicesChecklist.innerHTML += `<div class="flex items-center"><input id="service-edit-${service.id}" name="services-edit" value="${service.id}" type="checkbox" ${isChecked} class="h-4 w-4 text-blue-600 rounded"><label for="service-edit-${service.id}" class="ml-2 text-sm">${service.name}</label></div>`;
                });
                addProfessionalModal.classList.remove('hidden');
            }
        }
        if (deleteBtn) {
            const profId = deleteBtn.dataset.id;
            showConfirmModal('Tem certeza que deseja excluir este profissional?', () => {
                deleteDoc(doc(db, 'professionals', profId)).catch(err => console.error(err));
            });
        }
    });
    const handleAgendaClick = (e) => {
        const whatsAppBtn = e.target.closest('.whatsapp-btn');
        if (whatsAppBtn) {
            e.stopPropagation();
            openWhatsAppMessageModal(whatsAppBtn.dataset.id);
            return;
        }
        const itemCard = e.target.closest('[data-id]');
        if (itemCard) {
            const appId = itemCard.dataset.id;
            const app = state.appointments.find(a => a.id === appId);
            if (app) {
                if (app.type === 'block') {
                    openBlockTimeModal(app.id);
                }
                else {
                    openAppointmentModal(app.date.toISOString().split('T')[0], app.id);
                }
            }
        }
    };
    appointmentsForDay.addEventListener('click', handleAgendaClick);
    dailyViewTimeSlots.addEventListener('click', handleAgendaClick);
}
main();