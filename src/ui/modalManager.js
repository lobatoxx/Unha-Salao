import { state } from '../state.js';
import * as DOMElements from './domElements.js';
// A função de exportar PDF será criada num passo futuro, por agora comentamos a importação
// import { exportAnamnesisToPDF } from '../utils/pdfGenerator.js'; 

// --- Funções Genéricas de Modal ---

export function hideAllModals() {
    // Esconde todos os modais da aplicação
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.classList.add('hidden'));
}

export function showConfirmModal(message) {
    return new Promise((resolve) => {
        DOMElements.confirmModalText.textContent = message;
        DOMElements.confirmModal.classList.remove('hidden');

        // Usamos .cloneNode para remover event listeners antigos e evitar chamadas múltiplas
        const newOkButton = DOMElements.confirmModalOk.cloneNode(true);
        DOMElements.confirmModalOk.parentNode.replaceChild(newOkButton, DOMElements.confirmModalOk);

        const newCancelButton = DOMElements.confirmModalCancel.cloneNode(true);
        DOMElements.confirmModalCancel.parentNode.replaceChild(newCancelButton, DOMElements.confirmModalCancel);

        const handleOk = () => {
            hideAllModals();
            resolve(true);
        };

        const handleCancel = () => {
            hideAllModals();
            resolve(false);
        };

        newOkButton.addEventListener('click', handleOk, { once: true });
        newCancelButton.addEventListener('click', handleCancel, { once: true });
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

export function openAppointmentModal(appointment = null, dateStr = null) {
    DOMElements.addAppointmentForm.reset();
    const deleteBtn = document.getElementById('deleteAppointmentBtn');
    const startAction = document.getElementById('startAppointmentAction');
    const editActions = document.getElementById('editAppointmentActions');
    
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
    state.tempClient = client;
    
    const list = document.getElementById('whatsappMessagesList');
    list.innerHTML = '';

    const professionalName = state.role === 'professional' ? state.professionalProfile.name : "Nós do Salão";
    const whatsappMessages = [
        `Olá ${client.name.split(' ')[0]}! Tudo bem? Estou a passar para confirmar o seu agendamento connosco. Podemos contar com a sua presença?`,
        `Olá ${client.name.split(' ')[0]}! Lembrete do seu horário amanhã. Qualquer imprevisto, por favor, avise-nos com antecedência.`,
        `Olá ${client.name.split(' ')[0]}, tudo joia? Vi que faz um tempo que não nos visita. Que tal agendar um horário e renovar a beleza? 😊`,
        `Olá ${client.name.split(' ')[0]}! Agradecemos a sua visita e preferência. Esperamos vê-lo(a) em breve! Atenciosamente, ${professionalName}.`,
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


// --- NOVOS GERENCIADORES DE MODAIS FINANCEIROS ---

export function openExpenseModal(expense = null) {
    const form = DOMElements.expenseForm;
    form.reset();
    DOMElements.expenseInstallmentsGroup.classList.remove('hidden'); // Mostra por defeito

    if (expense) {
        DOMElements.expenseModalTitle.textContent = 'Editar Despesa';
        form.querySelector('[name="id"]').value = expense.id;
        form.querySelector('[name="description"]').value = expense.description;
        form.querySelector('[name="value"]').value = expense.value;
        form.querySelector('[name="category"]').value = expense.category;
        form.querySelector('[name="dueDate"]').value = expense.dueDate;
        DOMElements.expenseInstallmentsGroup.classList.add('hidden'); // Esconde para edições
    } else {
        DOMElements.expenseModalTitle.textContent = 'Nova Despesa';
        form.querySelector('[name="id"]').value = '';
    }
    DOMElements.expenseModal.classList.remove('hidden');
}

export function openRecurringExpenseModal(expense = null) {
    const form = DOMElements.recurringExpenseForm;
    form.reset();

    if (expense) {
        DOMElements.recurringExpenseModalTitle.textContent = 'Editar Despesa Recorrente';
        form.querySelector('[name="id"]').value = expense.id;
        form.querySelector('[name="description"]').value = expense.description;
        form.querySelector('[name="value"]').value = expense.value;
        form.querySelector('[name="category"]').value = expense.category;
        form.querySelector('[name="dueDay"]').value = expense.dueDay;
    } else {
        DOMElements.recurringExpenseModalTitle.textContent = 'Nova Despesa Recorrente';
        form.querySelector('[name="id"]').value = '';
    }
    DOMElements.recurringExpenseModal.classList.remove('hidden');
}

