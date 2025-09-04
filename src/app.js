import { state } from './state.js';
import { DOMElements } from './ui/domElements.js'; // Note a alteração na importação
import { initializeAuthListeners } from './listeners/authListeners.js';
import { initializeFormListeners } from './listeners/formListeners.js';
import { initializeViewListeners } from './listeners/viewListeners.js';
import { initializeAuthListener } from './listeners/authListener.js';

/**
 * Preenche o objeto DOMElements com as referências aos elementos HTML.
 * Esta função SÓ DEVE ser chamada depois de o DOM estar totalmente carregado.
 */
function populateDOMElements() {
    const ids = [
        'loadingOverlay', 'loginPage', 'appContainer', 'painelPage', 'servicosPage', 'equipePage',
        'clientesPage', 'agendaPage', 'financeiroPage', 'emailInput', 'passwordInput', 'loginButton',
        'registerButton', 'logoutButton', 'authError', 'salonLogo', 'salonTitle', 'faturamentoHoje',
        'agendamentosHoje', 'totalClientes', 'totalServicos', 'proximosAgendamentos', 'totalClientesCard',
        'totalServicosCard', 'servicesList', 'professionalsList', 'clientsList', 'appointmentsForDay',
        'dailyViewTimeSlots', 'detalhesFinanceiro', 'openServiceModalBtn', 'openProfessionalModalBtn',
        'openClientModalBtn', 'addServiceModal', 'addProfessionalModal', 'addClientModal', 'addAppointmentModal',
        'clientProfileModal', 'blockTimeModal', 'blockDayModal', 'observationModal', 'whatsappMessageModal',
        'reminderModal', 'anamnesisModal', 'actionChoiceModal', 'confirmModal', 'addServiceForm',
        'addProfessionalForm', 'addClientForm', 'addAppointmentForm', 'blockTimeForm', 'blockDayForm',
        'observationForm', 'anamnesisForm', 'serviceModalTitle', 'serviceIdToEdit', 'professionalModalTitle',
        'professionalIdToEdit', 'professionalServicesChecklist', 'clientModalTitle', 'clientIdToEdit',
        'appointmentModalTitle', 'appointmentIdToEdit', 'appointmentDate', 'appointmentTime', 'appointmentClient',
        'appointmentProfessional', 'appointmentService', 'blockIdToEdit', 'appointmentsTitle', 'prevMonthBtn',
        'nextMonthBtn', 'currentMonthYear', 'calendarDays', 'monthViewBtn', 'dayViewBtn', 'monthlyView',
        'dailyView', 'dailyViewTitle', 'financeiroFaturamento', 'financeiroDespesas', 'financeiroLucro',
        'financeiroPrevMonthBtn', 'financeiroNextMonthBtn', 'financeiroCurrentMonthYear', 'financeiroAbas',
        'despesasPontuaisContent', 'despesasRecorrentesContent', 'btnNovaDespesa', 'btnNovaDespesaRecorrente',
        'expenseModal', 'expenseForm', 'expenseModalTitle', 'expenseInstallmentsGroup', 'recurringExpenseModal',
        'recurringExpenseForm', 'recurringExpenseModalTitle', 'notification-container', 'confirmModalText',
        'confirmModalOk', 'confirmModalCancel', 'deleteAppointmentBtn', 'startAppointmentAction',
        'editAppointmentActions', 'appointmentObservationDisplay', 'appointmentObservationText', 'whatsappMessagesList',
        'anamnesisClientName', 'anamnesisClientPhone', 'clearSignatureBtn'
    ];
    
    // O ID do canvas é especial por causa do hífen
    const canvas = document.getElementById('signature-pad');
    if (canvas) {
        DOMElements['signaturePadCanvas'] = canvas;
    } else {
        console.warn('[DOM Population] Elemento com ID "signature-pad" não foi encontrado no HTML.');
        DOMElements['signaturePadCanvas'] = null;
    }

    // Converte os IDs para camelCase e preenche o objeto DOMElements
    ids.forEach(id => {
        if (!id) return;
        const element = document.getElementById(id);
        if (!element) {
            // Este aviso irá dizer-lhe exatamente quais elementos estão em falta
            console.warn(`[DOM Population] Elemento com ID "${id}" não foi encontrado no HTML.`);
        }
        const camelCaseId = id.replace(/-([a-z])/g, g => g[1].toUpperCase());
        DOMElements[camelCaseId] = element;
    });
}


/**
 * Função principal que inicializa a aplicação.
 */
function initializeApp() {
    // 1. Preenche as referências do DOM. Essencial que seja o primeiro passo.
    populateDOMElements();

    // 2. Inicializa o SignaturePad de forma segura
    if (DOMElements.signaturePadCanvas) {
        // A biblioteca SignaturePad está disponível globalmente a partir do script no index.html
        state.signaturePad = new SignaturePad(DOMElements.signaturePadCanvas);
    } else {
        console.log("O SignaturePad não foi inicializado porque o elemento canvas não foi encontrado.");
    }

    // 3. Inicializa os listeners de forma defensiva
    if (DOMElements.loginButton && DOMElements.registerButton) {
        initializeAuthListener();
        initializeAuthListeners();
    } else {
        console.error("Elementos de autenticação críticos (ex: loginButton) não foram encontrados. Os listeners de autenticação não foram inicializados.");
    }

    if (DOMElements.addServiceForm) { // Verifica um formulário representativo
        initializeFormListeners();
    } else {
        console.error("Elementos de formulário principais não foram encontrados. Os listeners de formulário não foram inicializados.");
    }

    if (DOMElements.agendaPage) { // Verifica um elemento de visualização representativo
        initializeViewListeners();
    } else {
        console.error("Elementos de visualização principais não foram encontrados. Os listeners de visualização não foram inicializados.");
    }
}

// Espera que o HTML esteja totalmente carregado antes de iniciar a aplicação.
document.addEventListener('DOMContentLoaded', initializeApp);

