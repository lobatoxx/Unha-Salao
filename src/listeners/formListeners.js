// src/listeners/formListeners.js

import { state } from '../state.js';
import * as DOMElements from '../ui/domElements.js';
import * as FirestoreService from '../services/firestoreService.js';
import * as ModalManager from '../ui/modalManager.js';
import { refreshAllViews } from './viewListeners.js'; // <-- IMPORTAÇÃO ADICIONADA

// --- Lógica de Validação (Regras de Negócio) ---
function hasScheduleConflict({ id, professionalId, date, serviceId, duration: blockDuration }) {
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
        if (id && existingApp.id === id) continue;

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


// --- Handlers de Submissão de Formulário ---

async function handleServiceSubmit(e) {
    e.preventDefault();
    const id = DOMElements.serviceIdToEdit.value;
    const data = { 
        name: document.getElementById('serviceName').value,
        price: parseFloat(document.getElementById('servicePrice').value), 
        duration: parseInt(document.getElementById('serviceDuration').value),
        salonId: state.userSalonId
    };

    try {
        if (id) {
            await FirestoreService.updateService(id, data);
        } else {
            await FirestoreService.addService(data);
        }
        ModalManager.hideAllModals();
        refreshAllViews(); // <-- ATUALIZAÇÃO ADICIONADA
    } catch (err) {
        console.error("Erro ao salvar serviço:", err);
        alert("Não foi possível salvar o serviço.");
    }
}

async function handleProfessionalSubmit(e) {
    e.preventDefault();
    const id = DOMElements.professionalIdToEdit.value;
    const name = id ? 'services-edit' : 'services-add';
    const data = { 
        name: document.getElementById('professionalName').value, 
        email: document.getElementById('professionalEmail').value,
        commission: parseInt(document.getElementById('professionalCommission').value), 
        serviceIds: Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value),
        salonId: state.userSalonId
    };
    if (!data.name || !data.commission || !data.email) {
        alert('Preencha nome, e-mail e comissão.');
        return;
    }
    
    try {
        if (id) {
            const { salonId, email, ...updateData } = data;
            await FirestoreService.updateProfessional(id, updateData);
        } else {
            await FirestoreService.addProfessional(data);
        }
        ModalManager.hideAllModals();
        refreshAllViews(); // <-- ATUALIZAÇÃO ADICIONADA
    } catch (err) {
        console.error("Erro ao salvar profissional:", err);
        alert("Não foi possível salvar o profissional.");
    }
}

async function handleClientSubmit(e) {
    e.preventDefault();
    const id = DOMElements.clientIdToEdit.value;
    const data = { 
        name: document.getElementById('clientName').value, 
        phone: document.getElementById('clientPhone').value,
        address: document.getElementById('clientAddress').value,
        observations: document.getElementById('clientObservations').value,
        salonId: state.userSalonId
    };
    if (!data.name || !data.phone) {
        alert('Nome e telefone são obrigatórios.');
        return;
    }
    
    try {
        if (id) {
            await FirestoreService.updateClient(id, data);
        } else {
            await FirestoreService.addClient(data);
        }
        ModalManager.hideAllModals();
        refreshAllViews(); // <-- ATUALIZAÇÃO ADICIONADA
    } catch (err) {
        console.error("Erro ao salvar cliente:", err);
        alert("Não foi possível salvar o cliente.");
    }
}

async function handleAppointmentSubmit(e) {
    e.preventDefault();
    const id = DOMElements.appointmentIdToEdit.value;
    const dateValue = DOMElements.appointmentDate.value;
    const timeValue = DOMElements.appointmentTime.value;
    const dateTime = new Date(`${dateValue}T${timeValue}`);

    const professionalId = DOMElements.appointmentProfessional.value;
    const serviceId = DOMElements.appointmentService.value;

    if (hasScheduleConflict({ id, professionalId, date: dateTime, serviceId })) {
        alert("Conflito de agenda! Este profissional já está ocupado neste horário.");
        return;
    }

    const data = {
        date: dateTime,
        clientId: DOMElements.appointmentClient.value,
        professionalId: professionalId,
        serviceId: serviceId,
        type: 'booking',
        status: id ? state.appointments.find(a => a.id === id).status : 'agendado',
        salonId: state.userSalonId
    };

    if (!data.clientId || !data.professionalId || !data.serviceId) {
        alert('Preencha todos os campos.');
        return;
    }

    try {
        if (id) {
            await FirestoreService.updateAppointment(id, data);
        } else {
            await FirestoreService.addAppointment(data);
        }
        ModalManager.hideAllModals();
        refreshAllViews(); // <-- ATUALIZAÇÃO ADICIONADA
    } catch (err) {
        console.error("Erro ao salvar agendamento:", err);
        alert("Não foi possível salvar o agendamento.");
    }
}

async function handleAnamnesisSubmit(e) {
    e.preventDefault();
    if (state.signaturePad.isEmpty()) {
        alert('A assinatura do cliente é obrigatória.');
        return;
    }

    const clientId = document.getElementById('anamnesisClientId').value;
    const appointmentId = document.getElementById('anamnesisAppointmentId').value;
    const client = state.clients.find(c => c.id === clientId);
    if (!client) {
        alert("Cliente não encontrado!");
        return;
    }

    const formData = new FormData(DOMElements.anamnesisForm);
    const answers = Object.fromEntries(formData.entries());
    
    const newRecord = {
        date: new Date(),
        answers: answers,
        signature: state.signaturePad.toDataURL()
    };
    
    const updatedHistory = [...(client.anamnesisHistory || []), newRecord];

    try {
        await FirestoreService.updateClientAnamnesis(clientId, updatedHistory);
        await FirestoreService.updateAppointmentStatus(appointmentId, 'concluido');
        ModalManager.hideAllModals();
        refreshAllViews(); // <-- ATUALIZAÇÃO ADICIONADA
    } catch (err) {
        console.error("Erro ao salvar ficha de anamnese:", err);
        alert("Ocorreu um erro ao salvar a ficha. Tente novamente.");
    }
}

async function handleBlockTimeSubmit(e) {
    e.preventDefault();
    const id = DOMElements.blockIdToEdit.value;
    const dateValue = DOMElements.blockDate.value;
    const startTimeValue = document.getElementById('blockStartTime').value;
    const endTimeValue = document.getElementById('blockEndTime').value;

    const startDateTime = new Date(`${dateValue}T${startTimeValue}`);
    const endDateTime = new Date(`${dateValue}T${endTimeValue}`);
    
    if (endDateTime <= startDateTime) {
        alert("O horário de término deve ser posterior ao de início.");
        return;
    }

    const duration = (endDateTime.getTime() - startDateTime.getTime()) / 60000;
    
    const professionalId = (state.role === 'salonOwner') 
        ? document.getElementById('blockProfessional').value 
        : state.professionalProfile.id;

    if (!professionalId) {
        alert("Selecione um profissional.");
        return;
    }

    if (hasScheduleConflict({ id, professionalId, date: startDateTime, duration: duration })) {
        alert("Conflito de agenda! Este profissional já tem um compromisso neste horário.");
        return;
    }

    const data = {
        date: startDateTime,
        duration: duration,
        professionalId: professionalId,
        reason: document.getElementById('blockReason').value,
        type: 'block',
        salonId: state.userSalonId,
        status: 'bloqueado'
    };

    try {
        if (id) {
            await FirestoreService.updateAppointment(id, data);
        } else {
            await FirestoreService.addAppointment(data);
        }
        ModalManager.hideAllModals();
        refreshAllViews(); // <-- ATUALIZAÇÃO ADICIONADA
    } catch (err) {
        console.error("Erro ao salvar bloqueio:", err);
        alert("Não foi possível salvar o bloqueio.");
    }
}

async function handleBlockDaySubmit(e) {
    e.preventDefault();
    const dateValue = new Date(state.selectedDate + 'T00:00:00');
    
    let professionalIds = [];
    if (state.role === 'salonOwner') {
        const selectedProfId = document.getElementById('blockDayProfessional').value;
        if (selectedProfId) {
            professionalIds.push(selectedProfId);
        } else {
            professionalIds = state.professionals.map(p => p.id);
        }
    } else {
        professionalIds.push(state.professionalProfile.id);
    }

    if (professionalIds.length === 0) {
        alert("Nenhum profissional selecionado para o bloqueio.");
        return;
    }

    const promises = professionalIds.map(profId => {
        const data = {
            date: new Date(dateValue.setHours(8, 0, 0, 0)),
            duration: 660, // 11 horas (das 8h às 19h)
            professionalId: profId,
            reason: 'Dia bloqueado',
            type: 'block',
            salonId: state.userSalonId,
            status: 'bloqueado'
        };
        return FirestoreService.addAppointment(data);
    });

    try {
        await Promise.all(promises);
        ModalManager.hideAllModals();
        refreshAllViews(); // <-- ATUALIZAÇÃO ADICIONADA
    } catch (err) {
        console.error("Erro ao bloquear o dia:", err);
        alert("Não foi possível bloquear o dia para um ou mais profissionais.");
    }
}

// --- Função de Inicialização ---

export function initializeFormListeners() {
    DOMElements.addServiceForm.addEventListener('submit', handleServiceSubmit);
    DOMElements.addProfessionalForm.addEventListener('submit', handleProfessionalSubmit);
    DOMElements.addClientForm.addEventListener('submit', handleClientSubmit);
    DOMElements.addAppointmentForm.addEventListener('submit', handleAppointmentSubmit);
    DOMElements.anamnesisForm.addEventListener('submit', handleAnamnesisSubmit);
    DOMElements.blockTimeForm.addEventListener('submit', handleBlockTimeSubmit);
    DOMElements.blockDayForm.addEventListener('submit', handleBlockDaySubmit);
}

