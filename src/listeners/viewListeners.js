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
        DOMElements.dayViewBtn.click();
    }
}

async function handleListClick(e) {
    const target = e.target.closest('button');
    const profileBtn = e.target.closest('.client-profile-btn');

    if (!target && !profileBtn) return;
    
    const id = target?.dataset.id || profileBtn?.dataset.id;
    if (!id) return;
    
    if (target?.matches('.edit-service-btn')) ModalManager.openServiceModal(state.services.find(s => s.id === id));
    if (target?.matches('.edit-client-btn')) ModalManager.openClientModal(state.clients.find(c => c.id === id));
    if (target?.matches('.edit-professional-btn')) ModalManager.openProfessionalModal(state.professionals.find(p => p.id === id));

    if (target?.matches('.delete-service-btn')) {
        if (await ModalManager.showConfirmModal('Tem certeza que deseja excluir este serviço?')) {
            FirestoreService.deleteService(id).catch(err => console.error("Erro ao excluir serviço:", err));
        }
    }
    if (target?.matches('.delete-client-btn')) {
        if (await ModalManager.showConfirmModal('Tem certeza que deseja excluir este cliente?')) {
            FirestoreService.deleteClient(id).catch(err => console.error("Erro ao excluir cliente:", err));
        }
    }
    if (target?.matches('.delete-professional-btn')) {
        if (await ModalManager.showConfirmModal('Tem certeza que deseja excluir este profissional?')) {
            FirestoreService.deleteProfessional(id).catch(err => console.error("Erro ao excluir profissional:", err));
        }
    }

    if (target?.matches('.whatsapp-btn')) ModalManager.openWhatsAppMessageModal(state.clients.find(c => c.id === id));
    
    if (profileBtn) ModalManager.openClientProfileModal(id);
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

    const { date, time } = state.tempSlot;

    if (target.id === 'newAppointmentChoiceBtn') {
        ModalManager.hideAllModals();
        ModalManager.openAppointmentModal(null, date, time);
    } else if (target.id === 'blockTimeChoiceBtn') {
        ModalManager.hideAllModals();
        ModalManager.openBlockTimeModal();
    } else if (target.id === 'cancelActionChoiceBtn') {
        ModalManager.hideAllModals();
    }
}

async function handleAppointmentModalActions(e) {
    const target = e.target.closest('button');
    if (!target) return;

    const appointmentId = DOMElements.appointmentIdToEdit.value;
    if (!appointmentId) return;

    const appointment = state.appointments.find(a => a.id === appointmentId);
    if (!appointment) return;

    // Iniciar Atendimento -> Abre Anamnese
    if (target.id === 'startAppointmentBtn') {
        ModalManager.openAnamnesisModal(appointment);
    }
    
    // Faturar -> Abre modal de observação
    if (target.id === 'invoiceAppointmentBtn') {
        ModalManager.openObservationModal(appointment);
    }

    // Cancelar Agendamento
    if (target.id === 'cancelAppointmentBtn') {
        if (await ModalManager.showConfirmModal('Tem certeza que deseja cancelar este atendimento?')) {
            try {
                await FirestoreService.updateAppointmentStatus(appointmentId, 'cancelado');
                ModalManager.hideAllModals();
            } catch (err) {
                console.error("Erro ao cancelar agendamento:", err);
                alert("Não foi possível cancelar o agendamento.");
            }
        }
    }

    // Excluir Agendamento
    if (target.id === 'deleteAppointmentBtn') {
        if (await ModalManager.showConfirmModal('Tem certeza que deseja EXCLUIR permanentemente este agendamento? Esta ação não pode ser desfeita.')) {
            try {
                await FirestoreService.deleteAppointment(appointmentId);
                ModalManager.hideAllModals();
            } catch (err) {
                console.error("Erro ao excluir agendamento:", err);
                alert("Não foi possível excluir o agendamento.");
            }
        }
    }
}

async function handleBlockModalActions(e) {
    const target = e.target.closest('button');
    if (!target || !target.matches('#deleteBlockBtn')) return;

    const blockId = DOMElements.blockIdToEdit.value;
    if (!blockId) return;

    if (await ModalManager.showConfirmModal('Tem certeza que deseja excluir este bloqueio?')) {
        try {
            await FirestoreService.deleteBlock(blockId);
            ModalManager.hideAllModals();
        } catch (err) {
            console.error("Erro ao excluir bloqueio:", err);
            alert("Não foi possível excluir o bloqueio.");
        }
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
    DOMElements.clientsList.addEventListener('click', handleListClick);
    DOMElements.professionalsList.addEventListener('click', handleListClick);

    DOMElements.appointmentsForDay.addEventListener('click', handleAgendaClick);
    DOMElements.dailyViewTimeSlots.addEventListener('click', handleAgendaClick);
    
    DOMElements.actionChoiceModal.addEventListener('click', handleActionChoice);
    DOMElements.addAppointmentModal.addEventListener('click', handleAppointmentModalActions);
    DOMElements.blockTimeModal.addEventListener('click', handleBlockModalActions);

    DOMElements.openServiceModalBtn.addEventListener('click', () => ModalManager.openServiceModal());
    DOMElements.openClientModalBtn.addEventListener('click', () => ModalManager.openClientModal());
    DOMElements.openProfessionalModalBtn.addEventListener('click', () => ModalManager.openProfessionalModal());
    DOMElements.openBlockDayModalBtn.addEventListener('click', () => ModalManager.openBlockDayModal());
}

