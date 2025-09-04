// src/ui/modalManager.js

import { state } from '../state.js';
import * as DOMElements from './domElements.js';
import { exportAnamnesisToPDF } from '../utils/pdfGenerator.js';

// --- Funções Genéricas de Modal ---

export function hideAllModals() {
    DOMElements.addServiceModal.classList.add('hidden');
    DOMElements.addProfessionalModal.classList.add('hidden');
    DOMElements.addClientModal.classList.add('hidden');
    DOMElements.addAppointmentModal.classList.add('hidden');
    DOMElements.clientProfileModal.classList.add('hidden');
    DOMElements.blockTimeModal.classList.add('hidden');
    DOMElements.blockDayModal.classList.add('hidden');
    DOMElements.observationModal.classList.add('hidden');
    DOMElements.whatsappMessageModal.classList.add('hidden');
    DOMElements.reminderModal.classList.add('hidden');
    DOMElements.anamnesisModal.classList.add('hidden');
    DOMElements.actionChoiceModal.classList.add('hidden');
    DOMElements.confirmModal.classList.add('hidden');
}

export function showConfirmModal(message) {
    return new Promise((resolve) => {
        DOMElements.confirmModalText.textContent = message;
        DOMElements.confirmModal.classList.remove('hidden');

        const onOk = () => {
            cleanup();
            resolve(true);
        };
        const onCancel = () => {
            cleanup();
            resolve(false);
        };
        
        const cleanup = () => {
            DOMElements.confirmModalOk.removeEventListener('click', onOk);
            DOMElements.confirmModalCancel.removeEventListener('click', onCancel);
            DOMElements.confirmModal.classList.add('hidden');
        };

        DOMElements.confirmModalOk.addEventListener('click', onOk, { once: true });
        DOMElements.confirmModalCancel.addEventListener('click', onCancel, { once: true });
    });
}


// --- Gerenciadores de Modais Específicos ---

export function openServiceModal(service = null) {
    DOMElements.addServiceForm.reset();
    DOMElements.serviceModalTitle.textContent = service ? 'Editar Serviço' : 'Adicionar Serviço';
    DOMElements.serviceIdToEdit.value = service ? service.id : '';
    document.getElementById('serviceName').value = service ? service.name : '';
    document.getElementById('servicePrice').value = service ? service.price : '';
    document.getElementById('serviceDuration').value = service ? service.duration : '';
    DOMElements.addServiceModal.classList.remove('hidden');
}

export function openClientModal(client = null) {
    DOMElements.addClientForm.reset();
    DOMElements.clientModalTitle.textContent = client ? 'Editar Cliente' : 'Adicionar Cliente';
    DOMElements.clientIdToEdit.value = client ? client.id : '';
    document.getElementById('clientName').value = client ? client.name : '';
    document.getElementById('clientPhone').value = client ? client.phone : '';
    document.getElementById('clientAddress').value = client ? client.address || '' : '';
    document.getElementById('clientObservations').value = client ? client.observations || '' : '';
    DOMElements.addClientModal.classList.remove('hidden');
}

export function openProfessionalModal(professional = null) {
    DOMElements.addProfessionalForm.reset();
    const emailInput = document.getElementById('professionalEmail');
    
    DOMElements.professionalServicesChecklist.innerHTML = '';
    const serviceChecklistName = professional ? 'services-edit' : 'services-add';
    state.services.forEach(service => {
        const isChecked = professional?.serviceIds?.includes(service.id) ? 'checked' : '';
        DOMElements.professionalServicesChecklist.innerHTML += `
            <div class="flex items-center">
                <input id="service-${serviceChecklistName}-${service.id}" name="${serviceChecklistName}" value="${service.id}" type="checkbox" ${isChecked} class="h-4 w-4 text-blue-600 rounded">
                <label for="service-${serviceChecklistName}-${service.id}" class="ml-2 text-sm">${service.name}</label>
            </div>`;
    });

    DOMElements.professionalModalTitle.textContent = professional ? 'Editar Profissional' : 'Adicionar Profissional';
    DOMElements.professionalIdToEdit.value = professional ? professional.id : '';
    document.getElementById('professionalName').value = professional ? professional.name : '';
    emailInput.value = professional ? professional.email || '' : '';
    emailInput.readOnly = !!professional;
    emailInput.classList.toggle('bg-gray-100', !!professional);
    document.getElementById('professionalCommission').value = professional ? professional.commission : '';
    DOMElements.addProfessionalModal.classList.remove('hidden');
}

export function openAppointmentModal(appointment = null, dateStr = null, timeStr = null) {
    DOMElements.addAppointmentForm.reset();
    const deleteBtn = document.getElementById('deleteAppointmentBtn');
    const startAction = document.getElementById('startAppointmentAction');
    const editActions = document.getElementById('editAppointmentActions');
    
    DOMElements.appointmentClient.innerHTML = '<option value="">Selecione um cliente</option>' + state.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    DOMElements.appointmentProfessional.innerHTML = '<option value="">Selecione um profissional</option>' + state.professionals.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    DOMElements.appointmentService.innerHTML = '<option value="">Selecione um serviço</option>' + state.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    DOMElements.appointmentModalTitle.textContent = appointment ? 'Editar Agendamento' : 'Novo Agendamento';
    DOMElements.appointmentIdToEdit.value = appointment ? appointment.id : '';
    DOMElements.appointmentDate.value = appointment ? appointment.date.toISOString().split('T')[0] : (dateStr || state.selectedDate);
    DOMElements.appointmentTime.value = appointment ? appointment.date.toTimeString().substring(0, 5) : (timeStr || '');
    DOMElements.appointmentClient.value = appointment ? appointment.clientId : '';
    DOMElements.appointmentProfessional.value = appointment ? appointment.professionalId : '';
    DOMElements.appointmentService.value = appointment ? appointment.serviceId : '';
    
    deleteBtn.classList.toggle('hidden', !appointment);
    startAction.classList.toggle('hidden', !appointment || appointment.status !== 'agendado');
    editActions.classList.toggle('hidden', !appointment || appointment.status !== 'concluido');
    
    const observationDisplay = document.getElementById('appointmentObservationDisplay');
    if (appointment?.observation) {
        document.getElementById('appointmentObservationText').textContent = appointment.observation;
        observationDisplay.classList.remove('hidden');
    } else {
        observationDisplay.classList.add('hidden');
    }

    DOMElements.addAppointmentModal.classList.remove('hidden');
}

export function openWhatsAppMessageModal(client) {
    if (!client) return;
    state.tempClient = client;
    const list = document.getElementById('whatsappMessagesList');
    list.innerHTML = '';

    const professionalName = state.role === 'professional' ? state.professionalProfile.name : "Nós do Salão";
    const whatsappMessages = [
        `Olá ${client.name.split(' ')[0]}! Tudo bem? Estou passando para confirmar seu agendamento conosco. Podemos contar com sua presença?`,
        `Oi ${client.name.split(' ')[0]}! Lembrete do seu horário amanhã. Qualquer imprevisto, por favor, nos avise com antecedência.`,
        `Olá ${client.name.split(' ')[0]}, tudo joia? Vi que faz um tempo que não nos visita. Que tal agendar um horário e renovar a beleza? 😊`,
        `Olá ${client.name.split(' ')[0]}! Agradecemos a sua visita e preferência. Esperamos te ver em breve! Atenciosamente, ${professionalName}.`,
    ];

    whatsappMessages.forEach(msg => {
        const el = document.createElement('button');
        el.className = 'w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm';
        el.textContent = msg;
        el.dataset.message = msg;
        el.addEventListener('click', () => {
            const phone = client.phone.replace(/\D/g, '');
            const encodedMsg = encodeURIComponent(msg);
            window.open(`https://wa.me/55${phone}?text=${encodedMsg}`, '_blank');
            hideAllModals();
        });
        list.appendChild(el);
    });

    DOMElements.whatsappMessageModal.classList.remove('hidden');
}

export function openActionChoiceModal() {
    DOMElements.actionChoiceModal.classList.remove('hidden');
}

export function openBlockTimeModal(block = null) {
    DOMElements.blockTimeForm.reset();
    const deleteBtn = document.getElementById('deleteBlockBtn');
    
    const isAdminView = state.role === 'salonOwner';
    document.getElementById('blockProfessionalAdminView').style.display = isAdminView ? 'block' : 'none';
    document.getElementById('blockProfessionalUserView').style.display = !isAdminView ? 'block' : 'none';

    if (isAdminView) {
        document.getElementById('blockProfessional').innerHTML = '<option value="">Selecione um profissional</option>' + state.professionals.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    } else {
        document.getElementById('blockProfessionalName').textContent = state.professionalProfile?.name || '';
    }

    if (block) {
        DOMElements.blockTimeModalTitle.textContent = 'Editar Bloqueio';
        DOMElements.blockIdToEdit.value = block.id;
        DOMElements.blockDate.value = block.date.toISOString().split('T')[0];
        DOMElements.blockStartTime.value = block.date.toTimeString().substring(0, 5);
        const endTime = new Date(block.date.getTime() + block.duration * 60000);
        DOMElements.blockEndTime.value = endTime.toTimeString().substring(0, 5);
        DOMElements.blockReason.value = block.reason || '';
        if (isAdminView) {
            document.getElementById('blockProfessional').value = block.professionalId;
        }
        deleteBtn.classList.remove('hidden');
    } else {
        DOMElements.blockTimeModalTitle.textContent = 'Bloquear Horário';
        DOMElements.blockIdToEdit.value = '';
        DOMElements.blockDate.value = state.tempSlot.date;
        DOMElements.blockStartTime.value = state.tempSlot.time;
        DOMElements.blockEndTime.value = '';
        DOMElements.blockReason.value = '';
        deleteBtn.classList.add('hidden');
    }
    DOMElements.blockTimeModal.classList.remove('hidden');
}

export function openClientProfileModal(client) {
    if (!client) return;
    DOMElements.profileClientName.textContent = client.name;
    DOMElements.profileClientPhone.textContent = client.phone;
    DOMElements.profileClientAddress.textContent = client.address || 'Não informado';
    DOMElements.profileClientObservations.textContent = client.observations || 'Nenhuma observação.';
    
    DOMElements.anamnesisHistoryContainer.innerHTML = '';
    if (client.anamnesisHistory && client.anamnesisHistory.length > 0) {
        const sortedHistory = [...client.anamnesisHistory].sort((a, b) => b.date.toDate() - a.date.toDate());
        sortedHistory.forEach(record => {
            const recordDate = record.date.toDate();
            const el = document.createElement('div');
            el.className = 'p-3 bg-gray-50 rounded-lg border';
            el.innerHTML = `
                <p class="font-semibold text-sm">Data: ${recordDate.toLocaleDateString('pt-BR')}</p>
                <button class="export-anamnesis-btn text-blue-500 text-sm hover:underline mt-1" data-client-id="${client.id}" data-record-date="${recordDate.toISOString()}">
                    Ver / Exportar PDF
                </button>
            `;
            DOMElements.anamnesisHistoryContainer.appendChild(el);
        });
    } else {
        DOMElements.anamnesisHistoryContainer.innerHTML = '<p class="text-sm text-gray-500">Nenhum histórico encontrado.</p>';
    }

    DOMElements.clientProfileModal.classList.remove('hidden');
}

export function openBlockDayModal() {
    DOMElements.blockDayForm.reset();
    const date = new Date(state.selectedDate + 'T00:00:00');
    DOMElements.blockDayDate.textContent = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const isAdminView = state.role === 'salonOwner';
    document.getElementById('blockDayProfessionalAdminView').style.display = isAdminView ? 'block' : 'none';
    document.getElementById('blockDayProfessionalUserView').style.display = !isAdminView ? 'block' : 'none';

    if (isAdminView) {
        document.getElementById('blockDayProfessional').innerHTML = '<option value="">Todos os Profissionais</option>' + state.professionals.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    } else {
        document.getElementById('blockDayProfessionalName').textContent = state.professionalProfile?.name || '';
    }

    DOMElements.blockDayModal.classList.remove('hidden');
}

