// src/ui/modalManager.js

import { state } from '../state.js';
import * as DOMElements from './domElements.js';
import { exportAnamnesisToPDF } from '../utils/pdfGenerator.js'; // (Criaremos este arquivo depois)

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

/**
 * Exibe um modal de confirmação e retorna uma Promise que resolve para true (se OK) ou false (se Cancelar).
 * @param {string} message - A mensagem a ser exibida no modal.
 * @returns {Promise<boolean>}
 */
export function showConfirmModal(message) {
    return new Promise((resolve) => {
        DOMElements.confirmModalText.textContent = message;
        DOMElements.confirmModal.classList.remove('hidden');

        const cleanup = () => {
            DOMElements.confirmModalOk.replaceWith(DOMElements.confirmModalOk.cloneNode(true));
            DOMElements.confirmModalCancel.replaceWith(DOMElements.confirmModalCancel.cloneNode(true));
            DOMElements.confirmModal.classList.add('hidden');
        };

        DOMElements.confirmModalOk.addEventListener('click', () => {
            cleanup();
            resolve(true);
        }, { once: true });

        DOMElements.confirmModalCancel.addEventListener('click', () => {
            cleanup();
            resolve(false);
        }, { once: true });
    });
}


// --- Gerenciadores de Modais Específicos ---

export function openServiceModal(service = null) {
    DOMElements.addServiceForm.reset();
    if (service) {
        DOMElements.serviceModalTitle.textContent = 'Editar Serviço';
        DOMElements.serviceIdToEdit.value = service.id;
        document.getElementById('serviceName').value = service.name; // Assumindo que temos IDs nos inputs
        document.getElementById('servicePrice').value = service.price;
        document.getElementById('serviceDuration').value = service.duration;
    } else {
        DOMElements.serviceModalTitle.textContent = 'Adicionar Serviço';
        DOMElements.serviceIdToEdit.value = '';
    }
    DOMElements.addServiceModal.classList.remove('hidden');
}

export function openClientModal(client = null) {
    DOMElements.addClientForm.reset();
    if (client) {
        DOMElements.clientModalTitle.textContent = 'Editar Cliente';
        DOMElements.clientIdToEdit.value = client.id;
        document.getElementById('clientName').value = client.name;
        document.getElementById('clientPhone').value = client.phone;
        document.getElementById('clientAddress').value = client.address || '';
        document.getElementById('clientObservations').value = client.observations || '';
    } else {
        DOMElements.clientModalTitle.textContent = 'Adicionar Cliente';
        DOMElements.clientIdToEdit.value = '';
    }
    DOMElements.addClientModal.classList.remove('hidden');
}

export function openProfessionalModal(professional = null) {
    DOMElements.addProfessionalForm.reset();
    const emailInput = document.getElementById('professionalEmail');
    
    // Limpa e preenche a lista de serviços
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

    if (professional) {
        DOMElements.professionalModalTitle.textContent = 'Editar Profissional';
        DOMElements.professionalIdToEdit.value = professional.id;
        document.getElementById('professionalName').value = professional.name;
        emailInput.value = professional.email || '';
        emailInput.readOnly = true;
        emailInput.classList.add('bg-gray-100');
        document.getElementById('professionalCommission').value = professional.commission;
    } else {
        DOMElements.professionalModalTitle.textContent = 'Adicionar Profissional';
        DOMElements.professionalIdToEdit.value = '';
        emailInput.readOnly = false;
        emailInput.classList.remove('bg-gray-100');
    }
    DOMElements.addProfessionalModal.classList.remove('hidden');
}


export function openAppointmentModal(appointment = null, dateStr = null) {
    DOMElements.addAppointmentForm.reset();
    const deleteBtn = document.getElementById('deleteAppointmentBtn');
    const startAction = document.getElementById('startAppointmentAction');
    const editActions = document.getElementById('editAppointmentActions');
    
    // Popula os selects
    DOMElements.appointmentClient.innerHTML = '<option value="">Selecione um cliente</option>' + state.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    DOMElements.appointmentProfessional.innerHTML = '<option value="">Selecione um profissional</option>' + state.professionals.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    DOMElements.appointmentService.innerHTML = '<option value="">Selecione um serviço</option>' + state.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    if (appointment) {
        DOMElements.appointmentModalTitle.textContent = 'Editar Agendamento';
        DOMElements.appointmentIdToEdit.value = appointment.id;
        DOMElements.appointmentDate.value = appointment.date.toISOString().split('T')[0];
        DOMElements.appointmentTime.value = appointment.date.toTimeString().substring(0, 5);
        DOMElements.appointmentClient.value = appointment.clientId;
        DOMElements.appointmentProfessional.value = appointment.professionalId;
        DOMElements.appointmentService.value = appointment.serviceId;
        
        deleteBtn.classList.remove('hidden');
        startAction.classList.toggle('hidden', appointment.status !== 'agendado');
        editActions.classList.toggle('hidden', appointment.status !== 'concluido');
        
        const observationDisplay = document.getElementById('appointmentObservationDisplay');
        if (appointment.observation) {
            document.getElementById('appointmentObservationText').textContent = appointment.observation;
            observationDisplay.classList.remove('hidden');
        } else {
            observationDisplay.classList.add('hidden');
        }

    } else {
        DOMElements.appointmentModalTitle.textContent = 'Novo Agendamento';
        DOMElements.appointmentIdToEdit.value = '';
        DOMElements.appointmentDate.value = dateStr || state.selectedDate;
        deleteBtn.classList.add('hidden');
        startAction.classList.add('hidden');
        editActions.classList.add('hidden');
    }
    
    DOMElements.addAppointmentModal.classList.remove('hidden');
}


export function openWhatsAppMessageModal(client) {
    if (!client) return;
    state.tempClient = client; // Armazena cliente temporariamente no state
    
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
    
    // Mostra/esconde view de admin vs profissional
    const isAdminView = state.role === 'salonOwner';
    document.getElementById('blockProfessionalAdminView').style.display = isAdminView ? 'block' : 'none';
    document.getElementById('blockProfessionalUserView').style.display = !isAdminView ? 'block' : 'none';

    if (isAdminView) {
        document.getElementById('blockProfessional').innerHTML = '<option value="">Selecione um profissional</option>' + state.professionals.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    } else {
        document.getElementById('blockProfessionalName').textContent = state.professionalProfile.name;
    }

    if (block) {
        // Lógica para editar um bloqueio existente
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
        // Lógica para criar um novo bloqueio
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


// ... (Poderíamos adicionar os outros gerenciadores de modais aqui, como openClientProfileModal, etc., seguindo o mesmo padrão)


// ... (Poderíamos adicionar os outros gerenciadores de modais aqui, como openBlockTimeModal, openClientProfileModal, etc., seguindo o mesmo padrão)