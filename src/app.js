import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, addDoc, doc, deleteDoc, updateDoc, Timestamp, getDocs, where, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyDUJBdk2K5n9645h7FlC8xVTWk1BHjY8Q0",
  authDomain: "mi-galvao.firebaseapp.com",
  projectId: "mi-galvao",
  storageBucket: "mi-galvao.firebasestorage.app",
  messagingSenderId: "791002859648",
  appId: "1:791002859648:web:5e9a2ba629efd2516efe65",
  measurementId: "G-ELHH1TQ32R"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let state = {
    user: null,
    role: 'client',
    userSalonId: null,
    salonInfo: null, // Armazena informações do salão (nome, logoUrl, etc.)
    professionalProfile: null,
    appointments: [], professionals: [], clients: [], services: [], expenses: [],
    currentDate: new Date(),
    selectedDate: new Date().toISOString().split('T')[0],
    tempSlot: { date: null, time: null },
    tempClient: { id: null, name: null, phone: null }
};

let confirmAction = null; // Variável global para a ação de confirmação

const whatsappMessages = [
    "Olá {cliente}! Tudo bem? Estou passando para confirmar seu agendamento conosco. Podemos contar com sua presença?",
    "Oi {cliente}! Lembrete do seu horário amanhã. Qualquer imprevisto, por favor, nos avise com antecedência.",
    "Olá {cliente}, tudo joia? Vi que faz um tempo que não nos visita. Que tal agendar um horário e renovar a beleza? 😊",
    "Olá {cliente}! Agradecemos a sua visita e preferência. Esperamos te ver em breve! Atenciosamente, {profissional}.",
];

let unsubscribes = [];
let reminderInterval = null;
let signaturePad = null;

function showConfirmModal(message, onConfirm) {
    const confirmModal = document.getElementById('confirmModal');
    const confirmModalText = document.getElementById('confirmModalText');
    
    confirmModalText.textContent = message;
    confirmAction = onConfirm; // Armazena a função a ser executada
    
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
        if (yPosition > 260) { doc.addPage(); yPosition = 20; }
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
    } catch(e) {
        console.error("Erro ao adicionar a assinatura", e);
        doc.text("Assinatura inválida", 15, yPosition + 10);
    }

    const fileName = `Anamnese_${client.name.replace(/ /g, '_')}_${record.date.toDate().toLocaleDateString('pt-BR')}.pdf`;
    if (navigator.share) {
        const pdfBlob = doc.output('blob');
        const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
        try {
            await navigator.share({ title: `Anamnese de ${client.name}`, text: `Segue a ficha de anamnese preenchida.`, files: [pdfFile] });
        } catch(e) { console.log('Compartilhamento cancelado ou falhou', e); }
    } else { doc.save(fileName); }
}

function hasScheduleConflict(conflictDetails) {
    const { id: appointmentId, professionalId, date, serviceId, duration: blockDuration } = conflictDetails;
    let duration = serviceId ? state.services.find(s => s.id === serviceId)?.duration || 0 : blockDuration;
    if (!duration) return false;
    
    const newStartTime = date.getTime();
    const newEndTime = newStartTime + (duration * 60000);

    for (const existingApp of state.appointments) {
        if (existingApp.professionalId !== professionalId || (appointmentId && existingApp.id === appointmentId)) continue;
        let existingDuration = existingApp.type === 'block' ? existingApp.duration : (state.services.find(s => s.id === existingApp.serviceId)?.duration || 0);
        if (!existingDuration) continue;
        const existingStartTime = existingApp.date.getTime();
        const existingEndTime = existingStartTime + (existingDuration * 60000);
        if (newStartTime < existingEndTime && existingStartTime < newEndTime) return true;
    }
    return false;
}

function updateSalonHeader() {
    const salonLogoEl = document.getElementById('salonLogo');
    const salonTitleEl = document.getElementById('salonTitle');

    if (state.salonInfo?.logoUrl) {
        salonLogoEl.src = state.salonInfo.logoUrl;
        salonLogoEl.classList.remove('hidden');
        salonTitleEl.classList.add('hidden');
    } else if (state.salonInfo?.name) {
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
    servicesList.innerHTML = state.services.length === 0 ? `<p class="text-center text-gray-500">Nenhum serviço cadastrado.</p>` : '';
    state.services.forEach(service => {
        const el = document.createElement('div');
        el.className = 'bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center';
        const price = (typeof service.price === 'number' ? service.price.toFixed(2) : '0.00').replace('.',',');
        el.innerHTML = `
            <div><p class="font-semibold text-gray-800">${service.name || ''}</p><p class="text-sm text-gray-500">R$ ${price} - ${service.duration || 0} min</p></div>
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
        const serviceNames = (prof.serviceIds || []).map(id => state.services.find(s => s.id === id)?.name).filter(Boolean).join(', ');
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
        let adminButtons = state.role === 'salonOwner' ? `
            <button class="edit-client-btn text-blue-500 hover:text-blue-700" data-id="${client.id}"><i class="fas fa-pencil-alt"></i></button>
            <button class="delete-client-btn text-red-500 hover:text-red-700" data-id="${client.id}"><i class="fas fa-trash"></i></button>` : '';
        el.innerHTML = `
            <div class="flex-1 cursor-pointer client-profile-btn" data-id="${client.id}">
                <p class="font-semibold text-gray-800">${client.name}</p><p class="text-sm text-gray-500">${client.phone}</p>
            </div>
            <div class="flex items-center gap-2">
                <button class="whatsapp-btn text-green-500" data-id="${client.id}"><i class="fab fa-whatsapp"></i></button>${adminButtons}
            </div>`;
        clientsList.appendChild(el);
    });
}

function renderAppointmentsForDay(appointmentsForDay, appointmentsTitle, dateString) {
    if (dateString) state.selectedDate = dateString;
    const selected = state.selectedDate;
    if (!selected) { appointmentsForDay.innerHTML = `<p class="text-center text-gray-500 text-sm">Selecione um dia.</p>`; return; }
    
    const dateObj = new Date(selected + 'T00:00:00');
    appointmentsTitle.textContent = `Agendamentos para ${dateObj.toLocaleDateString('pt-BR')}:`;
    const dayAppointments = state.appointments.filter(app => app.date?.toISOString().split('T')[0] === selected).sort((a, b) => a.date - b.date);
    
    appointmentsForDay.innerHTML = dayAppointments.length === 0 ? `<p class="text-center text-gray-500 text-sm">Nenhum agendamento para este dia.</p>` : '';
    
    dayAppointments.forEach(app => {
        const el = document.createElement('div');
        el.className = 'bg-white p-3 rounded-lg shadow-sm border cursor-pointer hover:bg-gray-50';
        el.dataset.id = app.id;

        let statusIcon = '';
        if (app.status === 'faturado') { statusIcon = `<i class="fas fa-dollar-sign text-green-500 text-xs ml-2"></i>`; } 
        else if (app.status === 'cancelado') { statusIcon = `<i class="fas fa-ban text-red-500 text-xs ml-2"></i>`; el.classList.add('opacity-50'); }

        if (app.type === 'block') {
            const startTimeStr = app.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const endTime = new Date(app.date.getTime() + app.duration * 60000);
            const endTimeStr = endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            el.innerHTML = `<div class="pointer-events-none"><p class="font-bold text-gray-600">${startTimeStr} - ${endTimeStr}</p><p class="font-semibold text-gray-800"><i class="fas fa-lock mr-2"></i>Bloqueado</p><p class="text-sm text-gray-600">${app.reason || 'Motivo não informado'}</p></div>`;
        } else {
            const client = state.clients.find(c => c.id === app.clientId);
            const service = state.services.find(s => s.id === app.serviceId);
            const prof = state.professionals.find(p => p.id === app.professionalId);
            const startTime = app.date, duration = service?.duration || 0;
            const endTime = new Date(startTime.getTime() + duration * 60000);
            const startTimeStr = startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const endTimeStr = endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            el.innerHTML = `
                <div>
                    <div class="flex items-center pointer-events-none"><p class="font-bold text-blue-600">${startTimeStr} - ${endTimeStr}</p>${statusIcon}</div>
                    <div class="flex items-center"><p class="font-semibold text-gray-800">${client?.name || '...'}</p><button class="whatsapp-btn text-green-500 ml-2 text-sm" data-id="${client?.id}"><i class="fab fa-whatsapp"></i></button></div>
                    <p class="text-sm text-gray-600 pointer-events-none">${service?.name || '...'} com ${prof?.name || '...'}</p>
                </div>`;
        }
        appointmentsForDay.appendChild(el);
    });
}

function renderCalendar(calendarDays, currentMonthYear) {
    calendarDays.innerHTML = '';
    const date = state.currentDate, year = date.getFullYear(), month = date.getMonth();
    
    if (document.getElementById('dailyView')?.classList.contains('hidden')) {
        currentMonthYear.textContent = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    } else {
        const selectedDateObj = new Date(state.selectedDate + 'T00:00:00');
        currentMonthYear.textContent = selectedDateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.innerHTML += `<div></div>`;
    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        const dateString = new Date(year, month, i).toISOString().split('T')[0];
        dayEl.className = 'calendar-day flex items-center justify-center rounded-full cursor-pointer hover:bg-blue-100';
        dayEl.textContent = i;
        dayEl.dataset.date = dateString;
        const today = new Date();
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) dayEl.classList.add('bg-blue-600', 'text-white');
        if (dateString === state.selectedDate) dayEl.classList.add('day-selected');
        calendarDays.appendChild(dayEl);
    }
}

function renderDailyView(dailyViewTimeSlots, dailyViewTitle, dateString, openActionChoiceModal) {
    const date = new Date(dateString + 'T00:00:00');
    dailyViewTitle.textContent = `Agenda para ${date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`;
    dailyViewTimeSlots.innerHTML = '';

    const dayAppointments = state.appointments.filter(app => app.date?.toISOString().split('T')[0] === dateString).sort((a, b) => a.date - b.date);
    const START_HOUR = 8, END_HOUR = 19, SLOT_DURATION_MINUTES = 30, SLOT_HEIGHT_REM = 2.5;

    const backgroundSlots = document.createDocumentFragment();
    for (let h = START_HOUR; h < END_HOUR; h++) {
        for (let m = 0; m < 60; m += SLOT_DURATION_MINUTES) {
            const slotTime = new Date(date); slotTime.setHours(h, m, 0, 0);
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
        const duration = isBlock ? app.duration : (service?.duration || SLOT_DURATION_MINUTES);
        const startMinutes = (app.date.getHours() * 60 + app.date.getMinutes()) - (START_HOUR * 60);
        const topPosition = (startMinutes / SLOT_DURATION_MINUTES) * SLOT_HEIGHT_REM, height = (duration / SLOT_DURATION_MINUTES) * SLOT_HEIGHT_REM;
        const el = document.createElement('div');
        let bgColor = isBlock ? 'bg-gray-200' : 'bg-blue-100', borderColor = isBlock ? 'border-gray-500' : 'border-blue-500';
        if (app.status === 'cancelado') { bgColor = 'bg-gray-100'; borderColor = 'border-gray-300'; el.classList.add('opacity-70'); }
        el.className = `absolute flex flex-col p-2 border-l-4 ${borderColor} ${bgColor} hover:bg-opacity-80 rounded-r-lg overflow-hidden cursor-pointer`;
        el.style.top = `${topPosition}rem`; el.style.height = `${height}rem`; el.style.left = `3.5rem`; el.style.width = `calc(100% - 3.7rem)`; el.dataset.id = app.id;

        let statusIcon = '';
        if (app.status === 'faturado') statusIcon = `<i class="fas fa-dollar-sign text-green-600 text-xs absolute top-1 right-1"></i>`;
        else if (app.status === 'cancelado') statusIcon = `<i class="fas fa-ban text-red-600 text-xs absolute top-1 right-1"></i>`;
        
        const professional = state.professionals.find(p => p.id === app.professionalId);
        if(isBlock) {
            el.innerHTML = `<div class="pointer-events-none flex items-center gap-2"><i class="fas fa-lock text-gray-600 text-xs"></i><div><p class="font-semibold text-xs text-gray-800 truncate">${app.reason || 'Bloqueado'}</p><p class="text-xs text-gray-600 truncate">${professional?.name || ''}</p></div></div>`;
        } else {
            const client = state.clients.find(c => c.id === app.clientId);
            el.innerHTML = `<div><div class="flex items-center"><p class="font-semibold text-xs text-blue-900 truncate">${client?.name || ''}</p><button class="whatsapp-btn text-green-500 ml-2 text-xs flex-shrink-0" data-id="${client?.id}"><i class="fab fa-whatsapp"></i></button></div><p class="text-xs text-blue-700 truncate">${service?.name || ''}</p><p class="text-xs text-blue-600 truncate">${professional?.name || ''}</p></div>${statusIcon}`;
        }
        dailyViewTimeSlots.appendChild(el);
    });
}

function renderDashboard(agendamentosHojeEl, faturamentoHojeEl, totalClientesEl, totalServicosEl, proximosAgendamentosEl) {
    const today = new Date(); today.setHours(0, 0, 0, 0); const todayStr = today.toISOString().split('T')[0];
    const agendamentosDeHoje = state.appointments.filter(app => app.type === 'booking' && app.status !== 'cancelado' && app.date?.toISOString().split('T')[0] === todayStr);
    const faturadoHoje = state.appointments.filter(app => app.status === 'faturado' && app.date?.toISOString().split('T')[0] === todayStr);
    const faturamentoDeHoje = faturadoHoje.reduce((total, app) => total + (state.services.find(s => s.id === app.serviceId)?.price || 0), 0);
    
    agendamentosHojeEl.textContent = agendamentosDeHoje.length;
    faturamentoHojeEl.textContent = `R$ ${faturamentoDeHoje.toFixed(2).replace('.', ',')}`;
    if (state.role === 'salonOwner') {
        totalClientesEl.textContent = state.clients.length;
        totalServicosEl.textContent = state.services.length;
    }
    const proximos = state.appointments.filter(app => app.type === 'booking' && app.status === 'agendado' && app.date >= today).sort((a, b) => a.date - b.date).slice(0, 3);
    proximosAgendamentosEl.innerHTML = proximos.length === 0 ? `<p class="text-center text-gray-500 text-sm">Nenhum agendamento próximo.</p>` : '';
    proximos.forEach(app => {
        const client = state.clients.find(c => c.id === app.clientId)?.name || '...';
        const service = state.services.find(s => s.id === app.serviceId)?.name || '...';
        const el = document.createElement('div');
        el.className = 'bg-white p-3 rounded-lg shadow-sm border';
        el.innerHTML = `<p class="font-bold text-blue-600">${app.date.toLocaleDateString('pt-BR')} - ${app.date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</p><p class="font-semibold text-gray-800">${client}</p><p class="text-sm text-gray-600">${service}</p>`;
        proximosAgendamentosEl.appendChild(el);
    });
}

function renderFinanceiro(financeiroCurrentMonthYear, detalhesFinanceiroEl, faturamentoTotalMesEl, ganhosProfissionalMesEl) {
    const date = state.currentDate, year = date.getFullYear(), month = date.getMonth();
    financeiroCurrentMonthYear.textContent = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const appointmentsInMonth = state.appointments.filter(app => app.status === 'faturado' && app.date?.getFullYear() === year && app.date?.getMonth() === month);

    if (state.role === 'salonOwner') {
        let totalMonthRevenue = 0;
        detalhesFinanceiroEl.innerHTML = state.professionals.length === 0 ? `<p class="text-center text-gray-500 text-sm">Nenhum profissional.</p>` : '';
        state.professionals.forEach(prof => {
            const profAppointments = appointmentsInMonth.filter(app => app.professionalId === prof.id);
            const profRevenue = profAppointments.reduce((total, app) => total + (state.services.find(s => s.id === app.serviceId)?.price || 0), 0);
            totalMonthRevenue += profRevenue;
            const commissionValue = profRevenue * (prof.commission / 100);
            const el = document.createElement('div');
            el.className = 'bg-white p-4 rounded-lg shadow-sm border';
            el.innerHTML = `<p class="font-bold text-gray-800">${prof.name}</p><div class="mt-2 text-sm space-y-1"><div class="flex justify-between"><span>Faturamento:</span> <span class="font-semibold">R$ ${profRevenue.toFixed(2).replace('.', ',')}</span></div><div class="flex justify-between text-red-600"><span>Comissão (${prof.commission}%):</span> <span class="font-semibold">- R$ ${commissionValue.toFixed(2).replace('.', ',')}</span></div><div class="flex justify-between border-t pt-1 mt-1"><span>Líquido:</span> <span class="font-bold text-green-600">R$ ${(profRevenue - commissionValue).toFixed(2).replace('.', ',')}</span></div></div>`;
            detalhesFinanceiroEl.appendChild(el);
        });
        faturamentoTotalMesEl.textContent = `R$ ${totalMonthRevenue.toFixed(2).replace('.', ',')}`;
    } else if (state.role === 'professional') {
        const profRevenue = appointmentsInMonth.reduce((total, app) => total + (state.services.find(s => s.id === app.serviceId)?.price || 0), 0);
        const commissionValue = profRevenue * (state.professionalProfile.commission / 100);
        ganhosProfissionalMesEl.textContent = `R$ ${commissionValue.toFixed(2).replace('.', ',')}`;
    }
}

function renderExpenses(expensesList, contasCurrentMonthYear, totalAPagarMes, totalPagoMes, balancoMes) {
    if (!expensesList) return;
    const date = state.currentDate, year = date.getFullYear(), month = date.getMonth();
    contasCurrentMonthYear.textContent = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    const expensesInMonth = state.expenses.filter(exp => exp.dueDate?.getFullYear() === year && exp.dueDate?.getMonth() === month).sort((a, b) => a.dueDate - b.dueDate);
    let totalToPay = 0, totalPaid = 0;
    expensesList.innerHTML = expensesInMonth.length === 0 ? `<p class="text-center text-gray-500 text-sm">Nenhuma conta para este mês.</p>` : '';

    expensesInMonth.forEach(exp => {
        totalToPay += exp.amount;
        if (exp.paid) totalPaid += exp.amount;
        const el = document.createElement('div');
        el.className = `p-3 rounded-lg shadow-sm border flex items-center justify-between ${exp.paid ? 'bg-gray-100 opacity-70' : 'bg-white'}`;
        const installmentText = exp.isInstallment ? `<span class="text-xs text-gray-500 ml-1">(${exp.currentInstallment}/${exp.totalInstallments})</span>` : '';
        el.innerHTML = `
            <div class="flex-1 ${exp.paid ? 'line-through' : ''}">
                <p class="font-semibold text-gray-800">${exp.description} ${installmentText}</p>
                <p class="text-sm ${exp.paid ? 'text-gray-500' : 'text-red-600'}">Vence em: ${exp.dueDate.toLocaleDateString('pt-BR')} - <strong>R$ ${exp.amount.toFixed(2).replace('.', ',')}</strong></p>
            </div>
            <div class="flex items-center gap-2 ml-2">
                ${!exp.paid ? `<button class="pay-expense-btn bg-green-500 text-white text-xs px-3 py-1 rounded-full hover:bg-green-600" data-id="${exp.id}">Pagar</button>` : `<span class="text-green-600 font-bold text-sm"><i class="fas fa-check-circle"></i> Pago</span>`}
                <button class="delete-expense-btn text-red-500 hover:text-red-700" data-id="${exp.id}" data-groupid="${exp.installmentGroupId || ''}"><i class="fas fa-trash"></i></button>
            </div>`;
        expensesList.appendChild(el);
    });

    totalAPagarMes.textContent = `R$ ${totalToPay.toFixed(2).replace('.', ',')}`;
    totalPagoMes.textContent = `R$ ${totalPaid.toFixed(2).replace('.', ',')}`;
    const appointmentsInMonth = state.appointments.filter(app => app.status === 'faturado' && app.date?.getFullYear() === year && app.date?.getMonth() === month);
    const totalMonthRevenue = appointmentsInMonth.reduce((total, app) => total + (state.services.find(s => s.id === app.serviceId)?.price || 0), 0);
    const balance = totalMonthRevenue - totalPaid;
    balancoMes.textContent = `R$ ${balance.toFixed(2).replace('.', ',')}`;
    balancoMes.className = `text-2xl font-bold ${balance >= 0 ? 'text-blue-900' : 'text-red-900'}`;
}

function updateUIVisibility() {
    const isOwner = state.role === 'salonOwner';
    const ownerElements = ['equipePage', 'servicosPage', 'openClientModalBtn', 'totalClientesCard', 'totalServicosCard', 'adminFinancialSummary', 'adminFinancialDetails'];
    const professionalElements = ['professionalFinancialSummary'];
    
    document.querySelector('button[data-page="equipePage"]').style.display = isOwner ? '' : 'none';
    document.querySelector('button[data-page="servicosPage"]').style.display = isOwner ? '' : 'none';
    ownerElements.forEach(id => { if (document.getElementById(id)) document.getElementById(id).style.display = isOwner ? '' : 'none'; });
    professionalElements.forEach(id => { if (document.getElementById(id)) document.getElementById(id).classList.toggle('hidden', isOwner); });
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
    const addServiceModal = document.getElementById('addServiceModal');
    const addServiceForm = document.getElementById('addServiceForm');
    const serviceModalTitle = document.getElementById('serviceModalTitle');
    const serviceIdToEdit = document.getElementById('serviceIdToEdit');
    const professionalsList = document.getElementById('professionalsList');
    const openProfessionalModalBtn = document.getElementById('openProfessionalModalBtn');
    const addProfessionalModal = document.getElementById('addProfessionalModal');
    const addProfessionalForm = document.getElementById('addProfessionalForm');
    const professionalServicesChecklist = document.getElementById('professionalServicesChecklist');
    const professionalModalTitle = document.getElementById('professionalModalTitle');
    const professionalIdToEdit = document.getElementById('professionalIdToEdit');
    const clientsList = document.getElementById('clientsList');
    const addClientModal = document.getElementById('addClientModal');
    const addClientForm = document.getElementById('addClientForm');
    const clientModalTitle = document.getElementById('clientModalTitle');
    const clientIdToEdit = document.getElementById('clientIdToEdit');
    const clientProfileModal = document.getElementById('clientProfileModal');
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
    const addAppointmentForm = document.getElementById('addAppointmentForm');
    const appointmentModalTitle = document.getElementById('appointmentModalTitle');
    const appointmentIdToEdit = document.getElementById('appointmentIdToEdit');
    const deleteAppointmentBtn = document.getElementById('deleteAppointmentBtn');
    const startAppointmentBtn = document.getElementById('startAppointmentBtn');
    const invoiceAppointmentBtn = document.getElementById('invoiceAppointmentBtn');
    const cancelAppointmentBtn = document.getElementById('cancelAppointmentBtn');
    const openBlockTimeModalBtn = document.getElementById('openBlockTimeModalBtn');
    const blockTimeModal = document.getElementById('blockTimeModal');
    const blockTimeForm = document.getElementById('blockTimeForm');
    const blockIdToEdit = document.getElementById('blockIdToEdit');
    const deleteBlockBtn = document.getElementById('deleteBlockBtn');
    const actionChoiceModal = document.getElementById('actionChoiceModal');
    const newAppointmentChoiceBtn = document.getElementById('newAppointmentChoiceBtn');
    const blockTimeChoiceBtn = document.getElementById('blockTimeChoiceBtn');
    const observationModal = document.getElementById('observationModal');
    const observationForm = document.getElementById('observationForm');
    const invoiceWithoutObservationBtn = document.getElementById('invoiceWithoutObservationBtn');
    const confirmModal = document.getElementById('confirmModal');
    const confirmModalOk = document.getElementById('confirmModalOk');
    const faturamentoHojeEl = document.getElementById('faturamentoHoje');
    const agendamentosHojeEl = document.getElementById('agendamentosHoje');
    const totalClientesEl = document.getElementById('totalClientes');
    const totalServicosEl = document.getElementById('totalServicos');
    const proximosAgendamentosEl = document.getElementById('proximosAgendamentos');
    const financeiroPrevMonthBtn = document.getElementById('financeiroPrevMonthBtn');
    const financeiroNextMonthBtn = document.getElementById('financeiroNextMonthBtn');
    const financeiroCurrentMonthYear = document.getElementById('financeiroCurrentMonthYear');
    const faturamentoTotalMesEl = document.getElementById('faturamentoTotalMes');
    const detalhesFinanceiroEl = document.getElementById('detalhesFinanceiro');
    const ganhosProfissionalMesEl = document.getElementById('ganhosProfissionalMes');
    const whatsappMessageModal = document.getElementById('whatsappMessageModal');
    const whatsappMessagesList = document.getElementById('whatsappMessagesList');
    const reminderModal = document.getElementById('reminderModal');
    const reminderText = document.getElementById('reminderText');
    const reminderInvoiceBtn = document.getElementById('reminderInvoiceBtn');
    const reminderRescheduleBtn = document.getElementById('reminderRescheduleBtn');
    const anamnesisModal = document.getElementById('anamnesisModal');
    const anamnesisForm = document.getElementById('anamnesisForm');
    const clearSignatureBtn = document.getElementById('clearSignatureBtn');
    signaturePad = new SignaturePad(document.getElementById('signature-pad'));
    const blockDayModal = document.getElementById('blockDayModal');
    const blockDayForm = document.getElementById('blockDayForm');
    const contasPrevMonthBtn = document.getElementById('contasPrevMonthBtn');
    const contasNextMonthBtn = document.getElementById('contasNextMonthBtn');
    const contasCurrentMonthYear = document.getElementById('contasCurrentMonthYear');
    const totalAPagarMes = document.getElementById('totalAPagarMes');
    const totalPagoMes = document.getElementById('totalPagoMes');
    const balancoMes = document.getElementById('balancoMes');
    const expensesList = document.getElementById('expensesList');
    const openExpenseModalBtn = document.getElementById('openExpenseModalBtn');
    const addExpenseModal = document.getElementById('addExpenseModal');
    const addExpenseForm = document.getElementById('addExpenseForm');
    const expenseModalTitle = document.getElementById('expenseModalTitle');
    const isInstallmentCheckbox = document.getElementById('isInstallmentCheckbox');
    const installmentsSection = document.getElementById('installmentsSection');
    
    const refreshAllViews = () => {
        renderServices(servicesList);
        renderProfessionals(professionalsList);
        renderClients(clientsList);
        renderDashboard(agendamentosHojeEl, faturamentoHojeEl, totalClientesEl, totalServicosEl, proximosAgendamentosEl);
        renderCalendar(calendarDays, currentMonthYear);
        renderAppointmentsForDay(appointmentsForDay, appointmentsTitle, state.selectedDate);
        renderFinanceiro(financeiroCurrentMonthYear, detalhesFinanceiroEl, faturamentoTotalMesEl, ganhosProfissionalMesEl);
        renderExpenses(expensesList, contasCurrentMonthYear, totalAPagarMes, totalPagoMes, balancoMes);
        if (!dailyView.classList.contains('hidden')) {
            renderDailyView(dailyViewTimeSlots, dailyViewTitle, state.selectedDate, openActionChoiceModal);
        }
    };

    registerButton.addEventListener('click', async () => {
        const email = emailInput.value, password = passwordInput.value; authError.textContent = '';
        if (!email || !password) { authError.textContent = "Preencha e-mail e senha."; return; }
        try {
            const q = query(collection(db, 'professionals'), where("email", "==", email));
            const professionalSnapshot = await getDocs(q);
            if (professionalSnapshot.empty) { authError.textContent = "E-mail não autorizado."; return; }
            if (professionalSnapshot.docs[0].data().userId) { authError.textContent = "Este profissional já possui uma conta."; return; }
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateDoc(doc(db, 'professionals', professionalSnapshot.docs[0].id), { userId: userCredential.user.uid });
        } catch (error) { authError.textContent = "Ocorreu um erro. Verifique a senha (mínimo 6 caracteres)."; console.error("Erro no registro:", error); }
    });
    loginButton.addEventListener('click', () => signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value).catch(() => authError.textContent = "E-mail ou senha inválidos."));
    logoutButton.addEventListener('click', () => signOut(auth));
    
    monthViewBtn.addEventListener('click', () => { monthlyView.style.display = 'block'; dailyView.classList.add('hidden'); monthViewBtn.classList.add('active'); dayViewBtn.classList.remove('active'); renderCalendar(calendarDays, currentMonthYear); });
    dayViewBtn.addEventListener('click', () => { monthlyView.style.display = 'none'; dailyView.classList.remove('hidden'); monthViewBtn.classList.remove('active'); dayViewBtn.classList.add('active'); renderDailyView(dailyViewTimeSlots, dailyViewTitle, state.selectedDate, openActionChoiceModal); renderCalendar(calendarDays, currentMonthYear); });

    calendarDays.addEventListener('click', (e) => {
        const dayEl = e.target.closest('.calendar-day');
        if (dayEl?.dataset.date) {
            document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('day-selected'));
            dayEl.classList.add('day-selected');
            state.selectedDate = dayEl.dataset.date;
            renderAppointmentsForDay(appointmentsForDay, appointmentsTitle, state.selectedDate);
            dayViewBtn.click();
        }
    });

    const changeMonth = (offset) => { state.currentDate.setMonth(state.currentDate.getMonth() + offset); refreshAllViews(); };
    const changeDay = (offset) => { const d = new Date(state.selectedDate + 'T00:00:00'); d.setDate(d.getDate() + offset); state.selectedDate = d.toISOString().split('T')[0]; state.currentDate = d; refreshAllViews(); };
    prevMonthBtn.addEventListener('click', () => !dailyView.classList.contains('hidden') ? changeDay(-1) : changeMonth(-1));
    nextMonthBtn.addEventListener('click', () => !dailyView.classList.contains('hidden') ? changeDay(1) : changeMonth(1));
    financeiroPrevMonthBtn.addEventListener('click', () => changeMonth(-1));
    financeiroNextMonthBtn.addEventListener('click', () => changeMonth(1));
    contasPrevMonthBtn.addEventListener('click', () => changeMonth(-1));
    contasNextMonthBtn.addEventListener('click', () => changeMonth(1));

    document.querySelectorAll('.modal .bg-gray-200, .modal [id^="close"]').forEach(el => el.addEventListener('click', () => el.closest('.modal').classList.add('hidden')));
    
    openServiceModalBtn.addEventListener('click', () => { serviceModalTitle.textContent = 'Adicionar Serviço'; addServiceForm.reset(); serviceIdToEdit.value = ''; addServiceModal.classList.remove('hidden'); });
    addServiceForm.addEventListener('submit', async (e) => {
        e.preventDefault(); const id = serviceIdToEdit.value;
        const data = { name: document.getElementById('serviceName').value, price: parseFloat(document.getElementById('servicePrice').value), duration: parseInt(document.getElementById('serviceDuration').value), salonId: state.userSalonId };
        try { if (id) await updateDoc(doc(db, 'services', id), data); else await addDoc(collection(db, 'services'), data); addServiceModal.classList.add('hidden'); } catch (err) { console.error(err); }
    });

    openProfessionalModalBtn.addEventListener('click', () => {
        professionalModalTitle.textContent = 'Adicionar Profissional'; addProfessionalForm.reset(); professionalIdToEdit.value = ''; document.getElementById('professionalEmail').readOnly = false;
        professionalServicesChecklist.innerHTML = ''; state.services.forEach(s => professionalServicesChecklist.innerHTML += `<div class="flex items-center"><input id="s-add-${s.id}" name="services-add" value="${s.id}" type="checkbox" class="h-4 w-4 text-blue-600 rounded"><label for="s-add-${s.id}" class="ml-2 text-sm">${s.name}</label></div>`);
        addProfessionalModal.classList.remove('hidden');
    });
    addProfessionalForm.addEventListener('submit', async (e) => {
        e.preventDefault(); const id = professionalIdToEdit.value; const name = id ? 'services-edit' : 'services-add';
        const data = { name: document.getElementById('professionalName').value, email: document.getElementById('professionalEmail').value, commission: parseInt(document.getElementById('professionalCommission').value), serviceIds: Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value), salonId: state.userSalonId };
        try { if (id) { const { salonId, email, ...updateData } = data; await updateDoc(doc(db, 'professionals', id), updateData); } else await addDoc(collection(db, 'professionals'), data); addProfessionalModal.classList.add('hidden'); } catch (err) { console.error(err); }
    });

    document.getElementById('openClientModalBtn').addEventListener('click', () => { clientModalTitle.textContent = 'Adicionar Cliente'; addClientForm.reset(); clientIdToEdit.value = ''; addClientModal.classList.remove('hidden'); });
    addClientForm.addEventListener('submit', async (e) => {
        e.preventDefault(); const id = clientIdToEdit.value;
        const data = { name: document.getElementById('clientName').value, phone: document.getElementById('clientPhone').value, address: document.getElementById('clientAddress').value, observations: document.getElementById('clientObservations').value, salonId: state.userSalonId };
        try { if (id) await updateDoc(doc(db, 'clients', id), data); else await addDoc(collection(db, 'clients'), data); addClientModal.classList.add('hidden'); } catch (err) { console.error(err); }
    });
    
    function openAppointmentModal(date, appointmentId = null) {
        addAppointmentForm.reset(); document.getElementById('appointmentDate').value = date;
        ['deleteAppointmentBtn', 'editAppointmentActions', 'startAppointmentAction', 'appointmentObservationDisplay'].forEach(id => document.getElementById(id).classList.add('hidden'));
        const clientSelect = document.getElementById('appointmentClient'); clientSelect.innerHTML = '<option value="">Selecione cliente</option>'; state.clients.forEach(c => clientSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`);
        const profSelect = document.getElementById('appointmentProfessional'); profSelect.innerHTML = '<option value="">Selecione profissional</option>'; state.professionals.forEach(p => profSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`);
        const serviceSelect = document.getElementById('appointmentService'); serviceSelect.innerHTML = '<option value="">Selecione serviço</option>'; state.services.forEach(s => serviceSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`);
        
        if (appointmentId) {
            const app = state.appointments.find(a => a.id === appointmentId);
            appointmentModalTitle.textContent = 'Editar Agendamento'; appointmentIdToEdit.value = app.id;
            document.getElementById('appointmentTime').value = app.date.toTimeString().substring(0, 5);
            clientSelect.value = app.clientId; profSelect.value = app.professionalId; serviceSelect.value = app.serviceId;
            deleteAppointmentBtn.classList.remove('hidden');
            if (app.status === 'agendado') document.getElementById('startAppointmentAction').classList.remove('hidden');
            else if (app.status === 'concluido') document.getElementById('editAppointmentActions').classList.remove('hidden');
            if (app.observation) { document.getElementById('appointmentObservationText').textContent = app.observation; document.getElementById('appointmentObservationDisplay').classList.remove('hidden'); }
        } else { appointmentModalTitle.textContent = 'Novo Agendamento'; appointmentIdToEdit.value = ''; }
        addAppointmentModal.classList.remove('hidden');
    }
    
    addAppointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault(); const id = appointmentIdToEdit.value; const dateTime = new Date(`${document.getElementById('appointmentDate').value}T${document.getElementById('appointmentTime').value}`);
        const professionalId = document.getElementById('appointmentProfessional').value, serviceId = document.getElementById('appointmentService').value;
        if (hasScheduleConflict({ id, professionalId, date: dateTime, serviceId })) { alert("Conflito de agenda! Este profissional já tem um horário neste período."); return; }
        const data = { date: Timestamp.fromDate(dateTime), clientId: document.getElementById('appointmentClient').value, professionalId, serviceId, type: 'booking', status: 'agendado', salonId: state.userSalonId };
        try { if (id) await updateDoc(doc(db, 'appointments', id), data); else await addDoc(collection(db, 'appointments'), data); addAppointmentModal.classList.add('hidden'); } catch (err) { console.error(err); }
    });
    deleteAppointmentBtn.addEventListener('click', () => { if (appointmentIdToEdit.value) showConfirmModal('Tem certeza que deseja excluir este agendamento?', () => deleteDoc(doc(db, 'appointments', appointmentIdToEdit.value)).then(() => addAppointmentModal.classList.add('hidden'))); });
    
    const updateAppointmentStatus = async (status, id, observation = null) => {
        if (!id) return;
        try { const dataToUpdate = { status }; if (observation) dataToUpdate.observation = observation; await updateDoc(doc(db, 'appointments', id), dataToUpdate); [addAppointmentModal, observationModal].forEach(m => m.classList.add('hidden')); } catch(err) { console.error(err); }
    };
    function openObservationModal(appointmentId) { document.getElementById('observationAppointmentId').value = appointmentId; observationForm.reset(); [addAppointmentModal, reminderModal].forEach(m => m.classList.add('hidden')); observationModal.classList.remove('hidden'); }
    invoiceAppointmentBtn.addEventListener('click', () => openObservationModal(appointmentIdToEdit.value));
    reminderInvoiceBtn.addEventListener('click', (e) => openObservationModal(e.target.dataset.id));
    observationForm.addEventListener('submit', (e) => { e.preventDefault(); updateAppointmentStatus('faturado', document.getElementById('observationAppointmentId').value, document.getElementById('observationText').value); });
    invoiceWithoutObservationBtn.addEventListener('click', () => updateAppointmentStatus('faturado', document.getElementById('observationAppointmentId').value));
    cancelAppointmentBtn.addEventListener('click', () => showConfirmModal('Tem certeza que deseja cancelar este atendimento?', () => updateAppointmentStatus('cancelado', appointmentIdToEdit.value)));
    
    function openBlockTimeModal(blockId = null) {
        blockTimeForm.reset(); blockIdToEdit.value = ''; deleteBlockBtn.classList.add('hidden'); document.getElementById('blockDate').value = state.selectedDate;
        const profSelectContainer = document.getElementById('blockProfessionalAdminView'), profNameContainer = document.getElementById('blockProfessionalUserView');
        if (state.role === 'salonOwner') {
            profSelectContainer.style.display = 'block'; profNameContainer.style.display = 'none';
            const profSelect = document.getElementById('blockProfessional'); profSelect.innerHTML = '<option value="">Selecione um profissional</option>';
            state.professionals.forEach(p => profSelect.innerHTML += `<option value="${p.id}">${p.name}</option>`);
        } else {
            profSelectContainer.style.display = 'none'; profNameContainer.style.display = 'block';
            document.getElementById('blockProfessionalName').textContent = state.professionalProfile.name;
        }
        if (blockId) {
            const block = state.appointments.find(b => b.id === blockId);
            document.getElementById('blockTimeModalTitle').textContent = 'Editar Bloqueio'; blockIdToEdit.value = block.id;
            if (state.role === 'salonOwner') document.getElementById('blockProfessional').value = block.professionalId;
            document.getElementById('blockStartTime').value = block.date.toTimeString().substring(0, 5);
            const endTime = new Date(block.date.getTime() + block.duration * 60000);
            document.getElementById('blockEndTime').value = endTime.toTimeString().substring(0, 5);
            document.getElementById('blockReason').value = block.reason;
            deleteBlockBtn.classList.remove('hidden');
        } else { document.getElementById('blockTimeModalTitle').textContent = 'Bloquear Horário'; }
        blockTimeModal.classList.remove('hidden');
    }
    blockTimeForm.addEventListener('submit', async (e) => {
        e.preventDefault(); const id = blockIdToEdit.value, date = document.getElementById('blockDate').value, startTime = document.getElementById('blockStartTime').value, endTime = document.getElementById('blockEndTime').value, professionalId = state.role === 'salonOwner' ? document.getElementById('blockProfessional').value : state.professionalProfile.id;
        if (!startTime || !endTime || !professionalId || endTime <= startTime) { alert('Por favor, preencha os campos e verifique os horários.'); return; }
        const startDateTime = new Date(`${date}T${startTime}`), duration = (new Date(`${date}T${endTime}`) - startDateTime) / 60000;
        if (hasScheduleConflict({ id, professionalId, date: startDateTime, duration })) { alert("Conflito de agenda! Já existe um agendamento ou bloqueio neste período."); return; }
        const data = { date: Timestamp.fromDate(startDateTime), professionalId, duration, reason: document.getElementById('blockReason').value || 'Bloqueado', type: 'block', salonId: state.userSalonId };
        try { if (id) await updateDoc(doc(db, 'appointments', id), data); else await addDoc(collection(db, 'appointments'), data); blockTimeModal.classList.add('hidden'); } catch(err) { console.error(err); }
    });
    deleteBlockBtn.addEventListener('click', () => { if (blockIdToEdit.value) showConfirmModal('Tem certeza que deseja excluir este bloqueio?', () => deleteDoc(doc(db, 'appointments', blockIdToEdit.value)).then(() => blockTimeModal.classList.add('hidden'))); });
    
    openBlockTimeModalBtn.addEventListener('click', () => {
        document.getElementById('blockDayDate').textContent = new Date(state.selectedDate + 'T00:00:00').toLocaleDateString('pt-BR');
        const adminView = document.getElementById('blockDayProfessionalAdminView'), userView = document.getElementById('blockDayProfessionalUserView');
        if (state.role === 'salonOwner') {
            adminView.style.display = 'block'; userView.style.display = 'none';
            const selectEl = document.getElementById('blockDayProfessional'); selectEl.innerHTML = '<option value="">Selecione...</option>';
            state.professionals.forEach(p => selectEl.innerHTML += `<option value="${p.id}">${p.name}</option>`);
        } else {
            adminView.style.display = 'none'; userView.style.display = 'block';
            document.getElementById('blockDayProfessionalName').textContent = state.professionalProfile.name;
        }
        blockDayModal.classList.remove('hidden');
    });
    blockDayForm.addEventListener('submit', (e) => {
        e.preventDefault(); let professionalId, professionalName;
        if (state.role === 'salonOwner') {
            const selectEl = document.getElementById('blockDayProfessional'); professionalId = selectEl.value;
            if (!professionalId) { alert('Por favor, selecione um profissional.'); return; }
            professionalName = selectEl.options[selectEl.selectedIndex].text;
        } else { professionalId = state.professionalProfile.id; professionalName = state.professionalProfile.name; }
        const dayHasAppointments = state.appointments.some(app => app.professionalId === professionalId && app.date.toISOString().split('T')[0] === state.selectedDate && app.type === 'booking' && app.status !== 'cancelado');
        if (dayHasAppointments) { alert(`Não é possível bloquear o dia para ${professionalName}, pois já existem agendamentos. Cancele-os primeiro.`); return; }
        showConfirmModal(`Tem certeza que deseja bloquear o dia inteiro para ${professionalName}?`, async () => {
            const data = { date: Timestamp.fromDate(new Date(`${state.selectedDate}T08:00:00`)), professionalId, duration: (19-8)*60, reason: 'Dia bloqueado', type: 'block', salonId: state.userSalonId };
            try { await addDoc(collection(db, 'appointments'), data); blockDayModal.classList.add('hidden'); } catch (err) { console.error("Erro ao bloquear o dia:", err); }
        });
    });
    
    function openActionChoiceModal(date, time) { state.tempSlot = { date, time }; actionChoiceModal.classList.remove('hidden'); }
    newAppointmentChoiceBtn.addEventListener('click', () => { actionChoiceModal.classList.add('hidden'); openAppointmentModal(state.tempSlot.date); document.getElementById('appointmentTime').value = state.tempSlot.time; });
    blockTimeChoiceBtn.addEventListener('click', () => { actionChoiceModal.classList.add('hidden'); openBlockTimeModal(); document.getElementById('blockStartTime').value = state.tempSlot.time; });
    
    function openWhatsAppMessageModal(clientId) {
        const client = state.clients.find(c => c.id === clientId); if (!client) return;
        state.tempClient = client; whatsappMessagesList.innerHTML = '';
        const professionalName = state.role === 'professional' ? state.professionalProfile.name : "Nós do Salão";
        whatsappMessages.forEach(msg => {
            const finalMsg = msg.replace('{cliente}', client.name.split(' ')[0]).replace('{profissional}', professionalName);
            const el = document.createElement('button'); el.className = 'w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm';
            el.textContent = finalMsg; el.dataset.message = finalMsg; whatsappMessagesList.appendChild(el);
        });
        whatsappMessageModal.classList.remove('hidden');
    }
    whatsappMessagesList.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-message]');
        if (btn) {
            const phone = state.tempClient.phone.replace(/\D/g, '');
            window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(btn.dataset.message)}`, '_blank');
            whatsappMessageModal.classList.add('hidden');
        }
    });
    
    function showReminderModal(app) {
        const client = state.clients.find(c => c.id === app.clientId);
        reminderText.textContent = `Atendimento de ${client?.name || 'Cliente'} finalizou. Deseja faturar ou reagendar?`;
        reminderInvoiceBtn.dataset.id = app.id; reminderRescheduleBtn.dataset.id = app.id;
        reminderModal.classList.remove('hidden');
        const remindedApp = state.appointments.find(a => a.id === app.id);
        if (remindedApp) remindedApp.reminderSent = true;
    }
    reminderRescheduleBtn.addEventListener('click', (e) => {
        const appId = e.target.dataset.id;
        const app = state.appointments.find(a => a.id === appId);
        if (app) openAppointmentModal(app.date.toISOString().split('T')[0], appId);
        reminderModal.classList.add('hidden');
    });
    function checkAppointmentsForReminders() {
        if (state.role !== 'professional') return;
        const now = new Date();
        for (const app of state.appointments) {
            if (app.status !== 'agendado' || app.type !== 'booking' || app.reminderSent) continue;
            const service = state.services.find(s => s.id === app.serviceId); if (!service) continue;
            const endTime = new Date(app.date.getTime() + service.duration * 60000);
            const reminderTime = new Date(endTime.getTime() + 10 * 60000);
            if (now > reminderTime) { showReminderModal(app); break; }
        }
    }
    
    function openAnamnesisModal(appointmentId) {
        const app = state.appointments.find(a => a.id === appointmentId), client = state.clients.find(c => c.id === app.clientId);
        if (!app || !client) return;
        anamnesisForm.reset(); signaturePad.clear();
        document.getElementById('anamnesisAppointmentId').value = app.id; document.getElementById('anamnesisClientId').value = client.id;
        document.getElementById('anamnesisClientName').textContent = client.name; document.getElementById('anamnesisClientPhone').textContent = client.phone;
        if (client.anamnesisHistory?.length > 0) {
            const lastRecord = client.anamnesisHistory[client.anamnesisHistory.length - 1];
            Object.keys(lastRecord.answers).forEach(key => {
                const value = lastRecord.answers[key];
                const input = anamnesisForm.querySelector(`[name="${key}"][value="${value}"]`);
                if (input?.type === 'radio') input.checked = true;
                else { const textInput = anamnesisForm.querySelector(`[name="${key}"]`); if (textInput) textInput.value = value; }
            });
        }
        addAppointmentModal.classList.add('hidden'); anamnesisModal.classList.remove('hidden');
    }
    startAppointmentBtn.addEventListener('click', () => openAnamnesisModal(appointmentIdToEdit.value));
    clearSignatureBtn.addEventListener('click', () => signaturePad.clear());
    anamnesisForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (signaturePad.isEmpty()) { alert('A assinatura do cliente é obrigatória.'); return; }
        const clientId = document.getElementById('anamnesisClientId').value, appointmentId = document.getElementById('anamnesisAppointmentId').value;
        const answers = Object.fromEntries(new FormData(anamnesisForm));
        const newRecord = { date: Timestamp.now(), answers, signature: signaturePad.toDataURL() };
        try {
            const clientRef = doc(db, 'clients', clientId); const clientSnap = await getDoc(clientRef);
            if (clientSnap.exists()) {
                await updateDoc(clientRef, { anamnesisHistory: [...(clientSnap.data().anamnesisHistory || []), newRecord] });
                await updateDoc(doc(db, 'appointments', appointmentId), { status: 'concluido' });
                anamnesisModal.classList.add('hidden');
            }
        } catch (err) { console.error("Erro ao salvar ficha:", err); }
    });
    
    function openClientProfileModal(clientId) {
        const client = state.clients.find(c => c.id === clientId); if (!client) return;
        document.getElementById('profileClientName').textContent = client.name; document.getElementById('profileClientPhone').textContent = client.phone;
        document.getElementById('profileClientAddress').textContent = client.address || 'Não informado';
        document.getElementById('profileClientObservations').textContent = client.observations || 'Nenhuma observação.';
        const historyContainer = document.getElementById('anamnesisHistoryContainer'); historyContainer.innerHTML = '';
        if (client.anamnesisHistory?.length > 0) {
            [...client.anamnesisHistory].reverse().forEach(record => {
                const el = document.createElement('details'); el.className = 'bg-gray-100 p-2 rounded-lg text-sm';
                const answers = record.answers; const formatYesNo = (v) => (v || 'nao').replace('nao', 'Não').replace('sim', 'Sim');
                el.innerHTML = `
                    <summary class="font-semibold cursor-pointer flex justify-between items-center">
                        <span>Ficha de ${record.date.toDate().toLocaleDateString('pt-BR')}</span>
                        <button class="export-pdf-btn bg-red-500 text-white px-2 py-1 text-xs rounded hover:bg-red-600"><i class="fas fa-file-pdf mr-1"></i> Exportar</button>
                    </summary>
                    <div class="mt-2 pt-2 border-t text-xs space-y-1">
                        <p><strong>1. Alergias:</strong> ${answers.alergia === 'sim' ? `Sim - ${answers.alergia_qual || 'N/A'}` : 'Não'}</p>
                        <p><strong>2. Doenças de Pele:</strong> ${answers.doenca_pele === 'sim' ? `Sim - ${answers.doenca_pele_qual || 'N/A'}` : 'Não'}</p>
                        <p><strong>3. Coagulação:</strong> ${formatYesNo(answers.coagulacao)}</p>
                        <p><strong>4. Diabetes:</strong> ${formatYesNo(answers.diabetes)}</p>
                        <p><strong>5. Infecção Prévia:</strong> ${formatYesNo(answers.infeccao)}</p>
                        <p><strong>6. Gestante:</strong> ${formatYesNo(answers.gestante)}</p>
                        <p class="mt-2"><strong>Assinatura:</strong></p>
                        <img src="${record.signature}" class="border rounded">
                    </div>`;
                el.querySelector('.export-pdf-btn').onclick = (e) => { e.preventDefault(); exportAnamnesisToPDF(client, record); };
                historyContainer.appendChild(el);
            });
        } else { historyContainer.innerHTML = `<p class="text-sm text-gray-500">Nenhum histórico encontrado.</p>`; }
        clientProfileModal.classList.remove('hidden');
    }
    
    confirmModalOk.addEventListener('click', () => { if (typeof confirmAction === 'function') confirmAction(); confirmModal.classList.add('hidden'); });
    document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', (e) => {
        const pageId = e.currentTarget.dataset.page;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(pageId)?.classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(nav => { nav.classList.remove('text-pink-500','font-bold'); nav.classList.add('text-gray-400'); nav.querySelector('p').classList.remove('font-bold'); });
        e.currentTarget.classList.add('text-pink-500'); e.currentTarget.querySelector('p').classList.add('font-bold');
    }));
    
    openExpenseModalBtn.addEventListener('click', () => {
        expenseModalTitle.textContent = 'Nova Conta'; addExpenseForm.reset(); document.getElementById('expenseIdToEdit').value = '';
        installmentsSection.classList.add('hidden'); document.getElementById('expenseDueDate').value = new Date().toISOString().split('T')[0];
        addExpenseModal.classList.remove('hidden');
    });
    addExpenseForm.querySelector('button[type="button"]').addEventListener('click', () => addExpenseModal.classList.add('hidden'));
    isInstallmentCheckbox.addEventListener('change', (e) => installmentsSection.classList.toggle('hidden', !e.target.checked));
    addExpenseForm.addEventListener('submit', async (e) => {
        e.preventDefault(); const isInstallment = isInstallmentCheckbox.checked, totalInstallments = parseInt(document.getElementById('expenseInstallments').value) || 1, description = document.getElementById('expenseDescription').value, amount = parseFloat(document.getElementById('expenseAmount').value), type = document.getElementById('expenseType').value, dueDate = new Date(`${document.getElementById('expenseDueDate').value}T00:00:00`);
        if (isInstallment && totalInstallments <= 1) { alert('Para parcelamento, o número de parcelas deve ser maior que 1.'); return; }
        try {
            if (isInstallment) {
                const installmentGroupId = doc(collection(db, 'expenses')).id, promises = [];
                for (let i = 1; i <= totalInstallments; i++) {
                    const installmentDueDate = new Date(dueDate); installmentDueDate.setMonth(dueDate.getMonth() + (i - 1));
                    const data = { description, amount, type, paid: false, salonId: state.userSalonId, dueDate: Timestamp.fromDate(installmentDueDate), isInstallment: true, installmentGroupId, currentInstallment: i, totalInstallments };
                    promises.push(addDoc(collection(db, 'expenses'), data));
                }
                await Promise.all(promises);
            } else {
                const data = { description, amount, type, paid: false, salonId: state.userSalonId, dueDate: Timestamp.fromDate(dueDate), isInstallment: false };
                await addDoc(collection(db, 'expenses'), data);
            }
            addExpenseModal.classList.add('hidden');
        } catch (err) { console.error("Erro ao salvar despesa: ", err); }
    });
    expensesList.addEventListener('click', (e) => {
        const payBtn = e.target.closest('.pay-expense-btn'), deleteBtn = e.target.closest('.delete-expense-btn');
        if (payBtn) showConfirmModal('Confirmar o pagamento desta conta?', () => updateDoc(doc(db, 'expenses', payBtn.dataset.id), { paid: true, paymentDate: Timestamp.now() }));
        if (deleteBtn) { const expenseId = deleteBtn.dataset.id; if (deleteBtn.dataset.groupid) showConfirmModal('Deseja excluir apenas esta parcela?', () => deleteDoc(doc(db, 'expenses', expenseId))); else showConfirmModal('Tem certeza que deseja excluir esta conta?', () => deleteDoc(doc(db, 'expenses', expenseId))); }
    });

    onAuthStateChanged(auth, async (user) => {
        if (reminderInterval) clearInterval(reminderInterval);
        unsubscribes.forEach(unsub => unsub()); unsubscribes = [];
        if (user) {
            state.user = user; let foundRole = false;
            const profQuery = query(collection(db, 'professionals'), where("userId", "==", user.uid)); const profSnap = await getDocs(profQuery);
            if (!profSnap.empty) { const profDoc = profSnap.docs[0]; state.professionalProfile = { id: profDoc.id, ...profDoc.data() }; state.role = 'professional'; state.userSalonId = profDoc.data().salonId; reminderInterval = setInterval(checkAppointmentsForReminders, 60000); foundRole = true; }
            if (!foundRole) { const salonQuery = query(collection(db, 'salons'), where("ownerId", "==", user.uid)); const salonSnap = await getDocs(salonQuery); if (!salonSnap.empty) { state.role = 'salonOwner'; state.userSalonId = salonSnap.docs[0].id; foundRole = true; } }
            if (!foundRole) { signOut(auth); return; }
            if (state.userSalonId) { const salonSnap = await getDoc(doc(db, 'salons', state.userSalonId)); if (salonSnap.exists()) { state.salonInfo = salonSnap.data(); } else { signOut(auth); return; } }
            
            const collectionsToListen = { services: "services", clients: "clients", professionals: "professionals", appointments: "appointments", expenses: "expenses" };
            Object.keys(collectionsToListen).forEach(key => {
                const q = query(collection(db, collectionsToListen[key]), where("salonId", "==", state.userSalonId));
                unsubscribes.push(onSnapshot(q, (snapshot) => { state[key] = snapshot.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate(), dueDate: d.data().dueDate?.toDate() })); refreshAllViews(); }));
            });
            updateUIVisibility(); appContainer.classList.remove('hidden'); loginPage.classList.add('hidden');
        } else {
            state = { ...state, user: null, role: 'client', userSalonId: null, professionalProfile: null, salonInfo: null, appointments: [], professionals: [], clients: [], services: [], expenses: [] };
            appContainer.classList.add('hidden'); loginPage.classList.remove('hidden');
        }
        loadingOverlay.classList.add('hidden');
    });

    const setupListListeners = (list, editSelector, deleteSelector, openEditModal, collectionName) => {
        list.addEventListener('click', (e) => {
            if (state.role !== 'salonOwner') return;
            const editBtn = e.target.closest(editSelector), deleteBtn = e.target.closest(deleteSelector);
            if (editBtn) openEditModal(editBtn.dataset.id);
            if (deleteBtn) showConfirmModal(`Tem certeza que deseja excluir este item?`, () => deleteDoc(doc(db, collectionName, deleteBtn.dataset.id)));
        });
    };
    setupListListeners(servicesList, '.edit-service-btn', '.delete-service-btn', (id) => { const s = state.services.find(s => s.id === id); if (s) { serviceModalTitle.textContent = 'Editar Serviço'; serviceIdToEdit.value = id; document.getElementById('serviceName').value = s.name; document.getElementById('servicePrice').value = s.price; document.getElementById('serviceDuration').value = s.duration; addServiceModal.classList.remove('hidden'); } }, 'services');
    setupListListeners(clientsList, '.edit-client-btn', '.delete-client-btn', (id) => { const c = state.clients.find(c => c.id === id); if (c) { clientModalTitle.textContent = 'Editar Cliente'; clientIdToEdit.value = id; document.getElementById('clientName').value = c.name; document.getElementById('clientPhone').value = c.phone; document.getElementById('clientAddress').value = c.address || ''; document.getElementById('clientObservations').value = c.observations || ''; addClientModal.classList.remove('hidden'); } }, 'clients');
    setupListListeners(professionalsList, '.edit-professional-btn', '.delete-professional-btn', (id) => { const p = state.professionals.find(p => p.id === id); if (p) { professionalModalTitle.textContent = 'Editar Profissional'; professionalIdToEdit.value = id; document.getElementById('professionalName').value = p.name; document.getElementById('professionalEmail').value = p.email || ''; document.getElementById('professionalEmail').readOnly = true; document.getElementById('professionalCommission').value = p.commission; professionalServicesChecklist.innerHTML = ''; state.services.forEach(s => professionalServicesChecklist.innerHTML += `<div class="flex items-center"><input id="s-edit-${s.id}" name="services-edit" value="${s.id}" type="checkbox" ${p.serviceIds?.includes(s.id) ? 'checked' : ''} class="h-4 w-4 text-blue-600 rounded"><label for="s-edit-${s.id}" class="ml-2 text-sm">${s.name}</label></div>`); addProfessionalModal.classList.remove('hidden'); } }, 'professionals');
    
    clientsList.addEventListener('click', (e) => {
        if (e.target.closest('.whatsapp-btn')) openWhatsAppMessageModal(e.target.closest('.whatsapp-btn').dataset.id);
        if (e.target.closest('.client-profile-btn')) openClientProfileModal(e.target.closest('.client-profile-btn').dataset.id);
    });
    
    const handleAgendaClick = (e) => {
        if (e.target.closest('.whatsapp-btn')) { e.stopPropagation(); openWhatsAppMessageModal(e.target.closest('.whatsapp-btn').dataset.id); return; }
        const itemCard = e.target.closest('[data-id]');
        if (itemCard) {
            const app = state.appointments.find(a => a.id === itemCard.dataset.id);
            if (app) app.type === 'block' ? openBlockTimeModal(app.id) : openAppointmentModal(app.date.toISOString().split('T')[0], app.id);
        }
    };
    appointmentsForDay.addEventListener('click', handleAgendaClick);
    dailyViewTimeSlots.addEventListener('click', handleAgendaClick);
}

document.addEventListener('DOMContentLoaded', main);

