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
        document.getElementById('serviceName').value = service.name;
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

export function openActionChoiceModal() {
    DOMElements.actionChoiceModal.classList.remove('hidden');
}

export function openAppointmentModal(appointment = null, dateStr = null, timeStr = null) {
    DOMElements.addAppointmentForm.reset();
    
    DOMElements.appointmentClient.innerHTML = '<option value="">Selecione um cliente</option>' + state.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    DOMElements.appointmentProfessional.innerHTML = '<option value="">Selecione um profissional</option>' + state.professionals.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    DOMElements.appointmentService.innerHTML = '<option value="">Selecione um serviço</option>' + state.services.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

    if (appointment) {
        DOMElements.appointmentModalTitle.textContent = 'Detalhes do Agendamento';
        DOMElements.appointmentIdToEdit.value = appointment.id;
        DOMElements.appointmentDate.value = appointment.date.toISOString().split('T')[0];
        DOMElements.appointmentTime.value = appointment.date.toTimeString().substring(0, 5);
        DOMElements.appointmentClient.value = appointment.clientId;
        DOMElements.appointmentProfessional.value = appointment.professionalId;
        DOMElements.appointmentService.value = appointment.serviceId;
        
        DOMElements.deleteAppointmentBtn.classList.remove('hidden');
        DOMElements.startAppointmentAction.classList.toggle('hidden', appointment.status !== 'agendado');
        DOMElements.editAppointmentActions.classList.toggle('hidden', appointment.status === 'agendado' || appointment.status === 'cancelado');
        
        const observationDisplay = DOMElements.appointmentObservationDisplay;
        if (appointment.observation) {
            DOMElements.appointmentObservationText.textContent = appointment.observation;
            observationDisplay.classList.remove('hidden');
        } else {
            observationDisplay.classList.add('hidden');
        }

    } else {
        DOMElements.appointmentModalTitle.textContent = 'Novo Agendamento';
        DOMElements.appointmentIdToEdit.value = '';
        DOMElements.appointmentDate.value = dateStr || state.selectedDate;
        DOMElements.appointmentTime.value = timeStr || '';
        DOMElements.deleteAppointmentBtn.classList.add('hidden');
        DOMElements.startAppointmentAction.classList.add('hidden');
        DOMElements.editAppointmentActions.classList.add('hidden');
    }
    
    DOMElements.addAppointmentModal.classList.remove('hidden');
}


export function openBlockTimeModal(block = null) {
    DOMElements.blockTimeForm.reset();
    DOMElements.blockProfessional.innerHTML = '<option value="">Selecione...</option>' + state.professionals.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    
    if (block) {
        DOMElements.blockIdToEdit.value = block.id;
        DOMElements.blockDate.value = block.date.toISOString().split('T')[0];
        DOMElements.blockStartTime.value = block.date.toTimeString().substring(0, 5);
        const endTime = new Date(block.date.getTime() + block.duration * 60000);
        DOMElements.blockEndTime.value = endTime.toTimeString().substring(0, 5);
        DOMElements.blockReason.value = block.reason || '';
        DOMElements.blockProfessional.value = block.professionalId;
        DOMElements.deleteBlockBtn.classList.remove('hidden');
    } else {
        DOMElements.blockIdToEdit.value = '';
        DOMElements.blockDate.value = state.tempSlot.date || state.selectedDate;
        DOMElements.blockStartTime.value = state.tempSlot.time || '';
        DOMElements.deleteBlockBtn.classList.add('hidden');
    }

    if (state.role === 'salonOwner') {
        DOMElements.blockProfessionalAdminView.style.display = 'block';
        DOMElements.blockProfessionalUserView.style.display = 'none';
    } else {
        DOMElements.blockProfessionalAdminView.style.display = 'none';
        DOMElements.blockProfessionalUserView.style.display = 'block';
        DOMElements.blockProfessionalName.textContent = state.professionalProfile.name;
    }

    DOMElements.blockTimeModal.classList.remove('hidden');
}


export function openBlockDayModal() {
    if (!DOMElements.blockDayDate || !DOMElements.blockDayProfessional) {
        console.error("ERRO FATAL: Elementos do modal de bloqueio de dia não foram encontrados no DOM.");
        alert("Ocorreu um erro ao abrir o modal de bloqueio.");
        return;
    }

    const date = new Date(state.selectedDate + 'T00:00:00');
    DOMElements.blockDayDate.textContent = date.toLocaleDateString('pt-BR');
    DOMElements.blockDayProfessional.innerHTML = '<option value="">Todos os Profissionais</option>' + state.professionals.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

    if (state.role === 'salonOwner') {
        DOMElements.blockDayProfessionalAdminView.style.display = 'block';
        DOMElements.blockDayProfessionalUserView.style.display = 'none';
    } else {
        DOMElements.blockDayProfessionalAdminView.style.display = 'none';
        DOMElements.blockDayProfessionalUserView.style.display = 'block';
        DOMElements.blockDayProfessionalName.textContent = state.professionalProfile.name;
    }
    DOMElements.blockDayModal.classList.remove('hidden');
}

export function openClientProfileModal(clientId) {
    const client = state.clients.find(c => c.id === clientId);
    if (!client) return;

    DOMElements.profileClientName.textContent = client.name;
    DOMElements.profileClientPhone.textContent = client.phone;
    DOMElements.profileClientAddress.textContent = client.address || 'Não informado';
    DOMElements.profileClientObservations.textContent = client.observations || 'Nenhuma observação.';
    
    DOMElements.anamnesisHistoryContainer.innerHTML = '';
    if (client.anamnesisHistory && client.anamnesisHistory.length > 0) {
        client.anamnesisHistory.slice().reverse().forEach(record => {
            const recordDate = record.date.toDate ? record.date.toDate() : new Date(record.date);
            const el = document.createElement('div');
            el.className = 'bg-gray-50 p-3 rounded-lg border';
            el.innerHTML = `
                <div class="flex justify-between items-center">
                    <p class="font-semibold">${recordDate.toLocaleDateString('pt-BR')}</p>
                    <button class="export-anamnesis-btn text-blue-500 text-sm hover:underline">Exportar PDF</button>
                </div>
            `;
            el.querySelector('.export-anamnesis-btn').addEventListener('click', () => {
                exportAnamnesisToPDF(client, record);
            });
            DOMElements.anamnesisHistoryContainer.appendChild(el);
        });
    } else {
        DOMElements.anamnesisHistoryContainer.innerHTML = '<p class="text-sm text-gray-500">Nenhum histórico encontrado.</p>';
    }

    DOMElements.clientProfileModal.classList.remove('hidden');
}

export function openAnamnesisModal(appointment) {
    const client = state.clients.find(c => c.id === appointment.clientId);
    if (!client) {
        alert('Cliente não encontrado para este agendamento.');
        return;
    }
    DOMElements.anamnesisForm.reset();
    state.signaturePad.clear();
    DOMElements.anamnesisAppointmentId.value = appointment.id;
    DOMElements.anamnesisClientId.value = client.id;
    DOMElements.anamnesisClientName.textContent = client.name;
    DOMElements.anamnesisClientPhone.textContent = client.phone;
    DOMElements.anamnesisModal.classList.remove('hidden');
}

export function openObservationModal(appointment) {
    DOMElements.observationForm.reset();
    DOMElements.observationAppointmentId.value = appointment.id;
    DOMElements.observationModal.classList.remove('hidden');
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
        list.appendChild(el);
    });

    DOMElements.whatsappMessageModal.classList.remove('hidden');
}

