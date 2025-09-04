import { state } from '../state.js';
import * as DOMElements from '../ui/domElements.js';
import * as FirestoreService from '../services/firestoreService.js';
import * as ModalManager from '../ui/modalManager.js';
import { showToast } from '../ui/notificationManager.js';
import { getNextMonth } from '../utils/dateUtils.js';

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
        showToast('Serviço guardado com sucesso!');
    } catch (err) {
        console.error("Erro ao guardar serviço:", err);
        showToast('Não foi possível guardar o serviço.', true);
    }
}

async function handleProfessionalSubmit(e) {
    e.preventDefault();
    const id = DOMElements.professionalIdToEdit.value;
    const formName = id ? 'services-edit' : 'services-add';
    const data = { 
        name: document.getElementById('professionalName').value, 
        email: document.getElementById('professionalEmail').value,
        commission: parseInt(document.getElementById('professionalCommission').value), 
        serviceIds: Array.from(document.querySelectorAll(`input[name="${formName}"]:checked`)).map(cb => cb.value),
        salonId: state.userSalonId
    };
    if (!data.name || !data.commission || !data.email) {
        showToast('Preencha nome, e-mail e comissão.', true);
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
        showToast('Profissional guardado com sucesso!');
    } catch (err) {
        console.error("Erro ao guardar profissional:", err);
        showToast('Não foi possível guardar o profissional.', true);
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
        showToast('Nome e telefone são obrigatórios.', true);
        return;
    }
    
    try {
        if (id) {
            await FirestoreService.updateClient(id, data);
        } else {
            await FirestoreService.addClient(data);
        }
        ModalManager.hideAllModals();
        showToast('Cliente guardado com sucesso!');
    } catch (err) {
        console.error("Erro ao guardar cliente:", err);
        showToast('Não foi possível guardar o cliente.', true);
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
        showToast("Conflito de agenda! Este profissional já está ocupado neste horário.", true);
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
        showToast('Preencha todos os campos.', true);
        return;
    }

    try {
        if (id) {
            await FirestoreService.updateAppointment(id, data);
        } else {
            await FirestoreService.addAppointment(data);
        }
        ModalManager.hideAllModals();
        showToast('Agendamento guardado com sucesso!');
    } catch (err) {
        console.error("Erro ao guardar agendamento:", err);
        showToast('Não foi possível guardar o agendamento.', true);
    }
}

async function handleExpenseSubmit(e) {
    e.preventDefault();
    const form = DOMElements.expenseForm;
    const id = form.querySelector('[name="id"]').value;
    const description = form.querySelector('[name="description"]').value;
    const value = parseFloat(form.querySelector('[name="value"]').value);
    const category = form.querySelector('[name="category"]').value;
    const dueDate = form.querySelector('[name="dueDate"]').value;
    const installments = parseInt(form.querySelector('[name="installments"]').value) || 1;

    if (!description || !value || !category || !dueDate) {
        showToast('Por favor, preencha todos os campos da despesa.', true);
        return;
    }

    try {
        if (id) {
            const data = { description, value, category, dueDate, salonId: state.userSalonId };
            await FirestoreService.updateExpense(id, data);
            showToast('Despesa atualizada com sucesso!');
        } else {
            const valuePerInstallment = value / installments;
            let currentDueDate = new Date(dueDate + 'T00:00:00');

            for (let i = 1; i <= installments; i++) {
                const installmentDescription = installments > 1 ? `${description} (${i}/${installments})` : description;
                const expenseData = {
                    description: installmentDescription,
                    value: valuePerInstallment,
                    category,
                    dueDate: currentDueDate.toISOString().split('T')[0],
                    salonId: state.userSalonId,
                };
                await FirestoreService.addExpense(expenseData);
                currentDueDate = getNextMonth(currentDueDate);
            }
            showToast(installments > 1 ? 'Despesas parceladas criadas com sucesso!' : 'Despesa criada com sucesso!');
        }
        ModalManager.hideAllModals();
    } catch (error) {
        console.error('Erro ao guardar despesa:', error);
        showToast('Ocorreu um erro ao guardar a despesa.', true);
    }
}

async function handleRecurringExpenseSubmit(e) {
    e.preventDefault();
    const form = DOMElements.recurringExpenseForm;
    const id = form.querySelector('[name="id"]').value;
    const data = {
        description: form.querySelector('[name="description"]').value,
        value: parseFloat(form.querySelector('[name="value"]').value),
        category: form.querySelector('[name="category"]').value,
        dueDay: parseInt(form.querySelector('[name="dueDay"]').value),
        salonId: state.userSalonId,
    };

    if (!data.description || !data.value || !data.category || !data.dueDay) {
        showToast('Por favor, preencha todos os campos.', true);
        return;
    }

    try {
        if (id) {
            await FirestoreService.updateRecurringExpense(id, data);
            showToast('Despesa recorrente atualizada!');
        } else {
            await FirestoreService.addRecurringExpense(data);
            showToast('Despesa recorrente criada!');
        }
        ModalManager.hideAllModals();
    } catch (error) {
        console.error('Erro ao guardar despesa recorrente:', error);
        showToast('Ocorreu um erro ao guardar a despesa.', true);
    }
}


// --- Função de Inicialização ---
export function initializeFormListeners() {
    DOMElements.addServiceForm.addEventListener('submit', handleServiceSubmit);
    DOMElements.addProfessionalForm.addEventListener('submit', handleProfessionalSubmit);
    DOMElements.addClientForm.addEventListener('submit', handleClientSubmit);
    DOMElements.addAppointmentForm.addEventListener('submit', handleAppointmentSubmit);
    
    DOMElements.expenseForm.addEventListener('submit', handleExpenseSubmit);
    DOMElements.recurringExpenseForm.addEventListener('submit', handleRecurringExpenseSubmit);
}

