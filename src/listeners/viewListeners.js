// src/listeners/viewListeners.js

import { state } from '../state.js';
import * as DOMElements from '../ui/domElements.js';
import * as Renderer from '../ui/renderer.js';
import * as ModalManager from '../ui/modalManager.js';
import * as FirestoreService from '../services/firestoreService.js';

// --- Funções Auxiliares ---
function refreshAllViews() {
    Renderer.renderCalendar();
    Renderer.renderAppointmentsForDay();
    Renderer.renderFinanceiro();
    if (!DOMElements.dailyView.classList.contains('hidden')) {
        // A função que abre o modal de escolha precisa ser passada para o renderer
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
        nav.classList.remove('text-pink-500');
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

    if (target.id === 'prevMonthBtn') {
        if (isDailyView) {
            const currentDate = new Date(state.selectedDate + 'T00:00:00');
            currentDate.setDate(currentDate.getDate() - 1);
            state.selectedDate = currentDate.toISOString().split('T')[0];
            state.currentDate = currentDate; 
        } else {
            state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        }
    } else if (target.id === 'nextMonthBtn') {
        if (isDailyView) {
            const currentDate = new Date(state.selectedDate + 'T00:00:00');
            currentDate.setDate(currentDate.getDate() + 1);
            state.selectedDate = currentDate.toISOString().split('T')[0];
            state.currentDate = currentDate;
        } else {
            state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        }
    } else if (target.id === 'financeiroPrevMonthBtn') {
        state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    } else if (target.id === 'financeiroNextMonthBtn') {
        state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    }

    refreshAllViews();
}

function handleCalendarViewToggle(e) {
    const target = e.target.closest('button');
    if (!target) return;

    if (target.id === 'monthViewBtn') {
        DOMElements.monthlyView.style.display = 'block';
        DOMElements.dailyView.classList.add('hidden');
        DOMElements.monthViewBtn.classList.add('active');
        DOMElements.dayViewBtn.classList.remove('active');
    } else if (target.id === 'dayViewBtn') {
        DOMElements.monthlyView.style.display = 'none';
        DOMElements.dailyView.classList.remove('hidden');
        DOMElements.monthViewBtn.classList.remove('active');
        DOMElements.dayViewBtn.classList.add('active');
    }
    refreshAllViews();
}

function handleCalendarDayClick(e) {
    const dayEl = e.target.closest('.calendar-day');
    if (dayEl && dayEl.dataset.date) {
        document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('day-selected'));
        dayEl.classList.add('day-selected');
        state.selectedDate = dayEl.dataset.date;
        Renderer.renderAppointmentsForDay();
        DOMElements.dayViewBtn.click(); // Simula o clique para mudar para a visualização diária
    }
}

async function handleListClick(e) {
    const target = e.target.closest('button');
    if (!target) return;

    const id = target.dataset.id;
    if (!id) return;
    
    // Ações de Edição
    if (target.matches('.edit-service-btn')) {
        const service = state.services.find(s => s.id === id);
        ModalManager.openServiceModal(service);
    }
    if (target.matches('.edit-client-btn')) {
        const client = state.clients.find(c => c.id === id);
        ModalManager.openClientModal(client);
    }
    if (target.matches('.edit-professional-btn')) {
        const prof = state.professionals.find(p => p.id === id);
        ModalManager.openProfessionalModal(prof);
    }

    // Ações de Exclusão
    if (target.matches('.delete-service-btn')) {
        if (await ModalManager.showConfirmModal('Tem certeza que deseja excluir este serviço?')) {
            FirestoreService.deleteService(id).catch(err => console.error(err));
        }
    }
    if (target.matches('.delete-client-btn')) {
        if (await ModalManager.showConfirmModal('Tem certeza que deseja excluir este cliente?')) {
            FirestoreService.deleteClient(id).catch(err => console.error(err));
        }
    }
    if (target.matches('.delete-professional-btn')) {
        if (await ModalManager.showConfirmModal('Tem certeza que deseja excluir este profissional?')) {
            FirestoreService.deleteProfessional(id).catch(err => console.error(err));
        }
    }

    // Outras ações
    if (target.matches('.whatsapp-btn')) {
        const client = state.clients.find(c => c.id === id);
        ModalManager.openWhatsAppMessageModal(client);
    }
    
    // O clique no perfil do cliente pode não ser um botão
    const profileBtn = e.target.closest('.client-profile-btn');
    if (profileBtn) {
        // ModalManager.openClientProfileModal(profileBtn.dataset.id);
        alert('Abertura do perfil do cliente a ser implementada.');
    }
}

function handleAgendaClick(e) {
    // Impede que o clique em um botão de whatsapp dentro do agendamento abra o modal de edição
    if (e.target.closest('.whatsapp-btn')) {
        return;
    }

    const itemCard = e.target.closest('[data-id]');
    if (itemCard) {
        const appId = itemCard.dataset.id;
        const app = state.appointments.find(a => a.id === appId);
        if (app) {
            if (app.type === 'block') {
                // Abre o modal de edição de bloqueio
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

    if (target.id === 'newAppointmentChoiceBtn') {
        ModalManager.hideAllModals();
        document.getElementById('appointmentTime').value = state.tempSlot.time;
        ModalManager.openAppointmentModal(null, state.tempSlot.date);
    }
    
    if (target.id === 'blockTimeChoiceBtn') {
        ModalManager.hideAllModals();
        ModalManager.openBlockTimeModal(); 
    }
    
    if (target.id === 'cancelActionChoiceBtn') {
        ModalManager.hideAllModals();
    }
}



// --- Função de Inicialização ---

export function initializeViewListeners() {
    // Navegação Principal
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', handleNavClick);
    });

    // Controles do Calendário e Financeiro
    DOMElements.agendaPage.addEventListener('click', handleCalendarControls);
    DOMElements.financeiroPage.addEventListener('click', handleCalendarControls);
    document.querySelector('.view-toggle').addEventListener('click', handleCalendarViewToggle);
    DOMElements.calendarDays.addEventListener('click', handleCalendarDayClick);

    // Cliques em Listas (Delegação de Eventos)
    DOMElements.servicesList.addEventListener('click', handleListClick);
    DOMElements.clientsList.addEventListener('click', handleListClick);
    DOMElements.professionalsList.addEventListener('click', handleListClick);

    // Cliques na Agenda
    DOMElements.appointmentsForDay.addEventListener('click', handleAgendaClick);
    DOMElements.dailyViewTimeSlots.addEventListener('click', handleAgendaClick);

    // Botões para abrir modais
    DOMElements.openServiceModalBtn.addEventListener('click', () => ModalManager.openServiceModal());
    DOMElements.openClientModalBtn.addEventListener('click', () => ModalManager.openClientModal());
    DOMElements.openProfessionalModalBtn.addEventListener('click', () => ModalManager.openProfessionalModal());
    DOMElements.openBlockTimeModalBtn.addEventListener('click', () => {
        state.tempSlot = { date: state.selectedDate, time: '' };
        ModalManager.openBlockTimeModal();
    });

    // Listener para o modal de escolha de ação
    DOMElements.actionChoiceModal.addEventListener('click', handleActionChoice);
}
