// src/ui/modalManager.js
import { state } from '../state.js';
import * as DOMElements from './domElements.js';
import { exportAnamnesisToPDF } from '../utils/pdfGenerator.js';

// --- Funções Genéricas de Modal ---
export function hideAllModals() {
    [
        DOMElements.addServiceModal,
        DOMElements.addProfessionalModal,
        DOMElements.addClientModal,
        DOMElements.addAppointmentModal,
        DOMElements.clientProfileModal,
        DOMElements.blockTimeModal,
        DOMElements.blockDayModal,
        DOMElements.observationModal,
        DOMElements.whatsappMessageModal,
        DOMElements.reminderModal,
        DOMElements.anamnesisModal,
        DOMElements.actionChoiceModal,
        DOMElements.confirmModal,
    ].forEach(modal => modal && modal.classList.add('hidden'));
}

export function showConfirmModal(message) {
    return new Promise((resolve) => {
        if (!DOMElements.confirmModalText || !DOMElements.confirmModal) {
            console.error("Confirm modal não encontrado no DOM.");
            return resolve(false);
        }

        DOMElements.confirmModalText.textContent = message;
        DOMElements.confirmModal.classList.remove('hidden');

        const cleanup = () => {
            if (DOMElements.confirmModalOk) {
                DOMElements.confirmModalOk.replaceWith(DOMElements.confirmModalOk.cloneNode(true));
            }
            if (DOMElements.confirmModalCancel) {
                DOMElements.confirmModalCancel.replaceWith(DOMElements.confirmModalCancel.cloneNode(true));
            }
            DOMElements.confirmModal.classList.add('hidden');
        };

        DOMElements.confirmModalOk?.addEventListener('click', () => {
            cleanup();
            resolve(true);
        }, { once: true });

        DOMElements.confirmModalCancel?.addEventListener('click', () => {
            cleanup();
            resolve(false);
        }, { once: true });
    });
}

// (... restante do modalManager.js corrigido com checagens ...)
