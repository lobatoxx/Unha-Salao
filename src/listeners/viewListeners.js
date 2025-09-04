// src/listeners/viewListeners.js

import { state } from '../state.js';
import * as DOMElements from '../ui/domElements.js';
import * as Renderer from '../ui/renderer.js';
import * as ModalManager from '../ui/modalManager.js';
import * as FirestoreService from '../services/firestoreService.js';
import { exportAnamnesisToPDF } from '../utils/pdfGenerator.js';

// --- Funções Auxiliares ---
function refreshAllViews() {
    Renderer.renderCalendar();
    Renderer.renderAppointmentsForDay();
    Renderer.renderFinanceiro();
    if (!DOMElements.dailyView.classList.contains('hidden')) {
        Renderer.renderDailyView((date, time) => {
            state.tempSlot = { date, time };
            ModalManager.openActionChoiceModal();
        });
    }
}

// --- Handlers de Eventos ---

function handleNavClick(e) {
    const pageId = e.currentTarget.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId)?.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(nav => {
        nav.classList.remove('text-pink-500', 'font-bold');
        nav.classList.add('text-gray-400');
        nav.querySelector('p').classList.remove('font-bold');
    });
    e.currentTarget.classList.add('text-pink-500');
    e.currentTarget.classList.remove('text-gray-400');
    e.currentTarget.querySelector('p').classList.add('font-bold');
}

function handleCalendarControls(e) {
    const target = e.target.closest('button');
    if (!target) return;

    const isDailyView = !DOMElements.dailyView.classList.contains('hidden');
    let dateToUpdate = isDailyView ? new Date(state.selectedDate + 'T00:00:00') : state.currentDate;

    if (target.id === 'prevMonthBtn') {
        if (isDailyView) {
            dateToUpdate.setDate(dateToUpdate.getDate() - 1);
            state.selectedDate = dateToUpdate.toISOString().split('T')[0];
        } else {
            dateToUpdate.setMonth(dateToUpdate.getMonth() - 1);
        }
    } else if (target.id === 'nextMonthBtn') {
        if (isDailyView) {
            dateToUpdate.setDate(dateToUpdate.getDate() + 1);
            state.selectedDate = dateToUpdate.toISOString().split('T')[0];
        } else {
            dateToUpdate.setMonth(dateToUpdate.getMonth() + 1);
        }
    } else if (target.id === 'financeiroPrevMonthBtn') {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    } else if (target.id === 'financeiroNextMonthBtn') {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    }
    state.currentDate = new Date(dateToUpdate); // Sincroniza currentDate
    refreshAllViews();
}

function handleCalendarViewToggle(e) {
    const target = e.target.closest('button');
    if (!target) return;

    DOMElements.monthlyView.style.display = (target.id === 'monthViewBtn') ? 'block' : 'none';
    DOMElements.dailyView.classList.toggle('hidden', target.id === 'monthViewBtn');
    DOMElements.monthViewBtn.classList.toggle('active', target.id === 'monthViewBtn');
    DOMElements.dayViewBtn.classList.toggle('active', target.id === 'dayViewBtn');
    
    refreshAllViews();
}

function handleCalendarDayClick(e) {
    const dayEl = e.target.closest('.calendar-day[data-date]');
    if (dayEl) {
        state.selectedDate = dayEl.dataset.date;
        DOMElements.dayViewBtn.click();
    }
}

async function handleListClick(e) {
    const button = e.target.closest('button');
    if (!button || !button.dataset.id) return;

    const id = button.dataset.id;
    const action = Array.from(button.classList).find(cls => cls.startsWith('edit-') || cls.startsWith('delete-'));

    if (!action) return;

    const [type, entity] = action.replace('-btn', '').split('-');

    const actions = {
        'edit': {
            'service': () => ModalManager.openServiceModal(state.services.find(s => s.id === id)),
            'client': () => ModalManager.openClientModal(state.clients.find(c => c.id === id)),
            'professional': () => ModalManager.openProfessionalModal(state.professionals.find(p => p.id === id)),
        },
        'delete': {
            'service': () => FirestoreService.deleteService(id),
            'client': () => FirestoreService.deleteClient(id),
            'professional': () => FirestoreService.deleteProfessional(id),
        }
    };
    
    if (actions[type] && actions[type][entity]) {
        if (type === 'delete') {
            if (await ModalManager.showConfirmModal(`Tem certeza que deseja excluir este ${entity}?`)) {
                actions[type][entity]().catch(err => console.error(err));
            }
        } else {
            actions[type][entity]();
        }
    }
}

function handleClientsListClick(e) {
    const profileBtn = e.target.closest('.client-profile-btn');
    const whatsappBtn = e.target.closest('.whatsapp-btn');
    
    if (profileBtn) {
        const client = state.clients.find(c => c.id === profileBtn.dataset.id);
        ModalManager.openClientProfileModal(client);
    } else if (whatsappBtn) {
        const client = state.clients.find(c => c.id === whatsappBtn.dataset.id);
        ModalManager.openWhatsAppMessageModal(client);
    } else {
        handleListClick(e);
    }
}

function handleAgendaClick(e) {
    if (e.target.closest('.whatsapp-btn')) return;

    const itemCard = e.target.closest('[data-id]');
    if (itemCard) {
        const appId = itemCard.dataset.id;
        const app = state.appointments.find(a => a.id === appId);
        if (app) {
            if (app.type === 'block') {
                ModalManager.openBlockTimeModal(app);
            } else {
                ModalManager.openAppointmentModal(app);
            }
        }
    }
}

function handleActionChoice(e) {
    const target = e.target.closest('button');
    if (!target) return;
    ModalManager.hideAllModals();

    if (target.id === 'newAppointmentChoiceBtn') {
        ModalManager.openAppointmentModal(null, state.tempSlot.date, state.tempSlot.time);
    } else if (target.id === 'blockTimeChoiceBtn') {
        ModalManager.openBlockTimeModal(); 
    }
}

function handleAnamnesisHistoryClick(e) {
    const exportBtn = e.target.closest('.export-anamnesis-btn');
    if (exportBtn) {
        const { clientId, recordDate } = exportBtn.dataset;
        const client = state.clients.find(c => c.id === clientId);
        const record = client?.anamnesisHistory?.find(rec => rec.date.toDate().toISOString() === recordDate);
        if (client && record) exportAnamnesisToPDF(client, record);
    }
}

// --- Função de Inicialização ---

export function initializeViewListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', handleNavClick));
    
    DOMElements.agendaPage.addEventListener('click', handleCalendarControls);
    DOMElements.financeiroPage.addEventListener('click', handleCalendarControls);
    document.querySelector('.view-toggle').addEventListener('click', handleCalendarViewToggle);
    DOMElements.calendarDays.addEventListener('click', handleCalendarDayClick);

    DOMElements.servicesList.addEventListener('click', handleListClick);
    DOMElements.professionalsList.addEventListener('click', handleListClick);
    DOMElements.clientsList.addEventListener('click', handleClientsListClick);

    DOMElements.appointmentsForDay.addEventListener('click', handleAgendaClick);
    DOMElements.dailyViewTimeSlots.addEventListener('click', handleAgendaClick);
    DOMElements.actionChoiceModal.addEventListener('click', handleActionChoice);
    DOMElements.anamnesisHistoryContainer.addEventListener('click', handleAnamnesisHistoryClick);

    DOMElements.openServiceModalBtn.addEventListener('click', () => ModalManager.openServiceModal());
    DOMElements.openClientModalBtn.addEventListener('click', () => ModalManager.openClientModal());
    DOMElements.openProfessionalModalBtn.addEventListener('click', () => ModalManager.openProfessionalModal());
    DOMElements.openBlockTimeModalBtn.addEventListener('click', () => {
        state.tempSlot = { date: state.selectedDate, time: '' };
        ModalManager.openBlockTimeModal();
    });
    DOMElements.openBlockDayModalBtn.addEventListener('click', ModalManager.openBlockDayModal);
}

