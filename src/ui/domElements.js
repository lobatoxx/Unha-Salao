// src/ui/domElements.js

// --- Overlays e Contêineres Principais ---
export const loadingOverlay = document.getElementById('loadingOverlay');
export const loginPage = document.getElementById('loginPage');
export const appContainer = document.getElementById('appContainer');

// --- Páginas ---
export const painelPage = document.getElementById('painelPage');
export const servicosPage = document.getElementById('servicosPage');
export const equipePage = document.getElementById('equipePage');
export const clientesPage = document.getElementById('clientesPage');
export const agendaPage = document.getElementById('agendaPage');
export const financeiroPage = document.getElementById('financeiroPage');

// --- Autenticação ---
export const emailInput = document.getElementById('emailInput');
export const passwordInput = document.getElementById('passwordInput');
export const loginButton = document.getElementById('loginButton');
export const registerButton = document.getElementById('registerButton');
export const logoutButton = document.getElementById('logoutButton');
export const authError = document.getElementById('authError');

// --- Header ---
export const salonLogo = document.getElementById('salonLogo');
export const salonTitle = document.getElementById('salonTitle');

// --- Dashboard (Painel) ---
export const faturamentoHoje = document.getElementById('faturamentoHoje');
export const agendamentosHoje = document.getElementById('agendamentosHoje');
export const totalClientes = document.getElementById('totalClientes');
export const totalServicos = document.getElementById('totalServicos');
export const proximosAgendamentos = document.getElementById('proximosAgendamentos');
export const totalClientesCard = document.getElementById('totalClientesCard');
export const totalServicosCard = document.getElementById('totalServicosCard');

// --- Listas ---
export const servicesList = document.getElementById('servicesList');
export const professionalsList = document.getElementById('professionalsList');
export const clientsList = document.getElementById('clientsList');
export const appointmentsForDay = document.getElementById('appointmentsForDay');
export const dailyViewTimeSlots = document.getElementById('dailyViewTimeSlots');
export const detalhesFinanceiro = document.getElementById('detalhesFinanceiro');

// --- Botões de Ação Principais ---
export const openServiceModalBtn = document.getElementById('openServiceModalBtn');
export const openProfessionalModalBtn = document.getElementById('openProfessionalModalBtn');
export const openClientModalBtn = document.getElementById('openClientModalBtn');
export const openBlockDayModalBtn = document.getElementById('openBlockDayModalBtn');

// --- Modais ---
export const addServiceModal = document.getElementById('addServiceModal');
export const addProfessionalModal = document.getElementById('addProfessionalModal');
export const addClientModal = document.getElementById('addClientModal');
export const addAppointmentModal = document.getElementById('addAppointmentModal');
export const clientProfileModal = document.getElementById('clientProfileModal');
export const blockTimeModal = document.getElementById('blockTimeModal');
export const blockDayModal = document.getElementById('blockDayModal');
export const observationModal = document.getElementById('observationModal');
export const whatsappMessageModal = document.getElementById('whatsappMessageModal');
export const reminderModal = document.getElementById('reminderModal');
export const anamnesisModal = document.getElementById('anamnesisModal');
export const actionChoiceModal = document.getElementById('actionChoiceModal');
export const confirmModal = document.getElementById('confirmModal');
export const confirmModalText = document.getElementById('confirmModalText');
export const confirmModalOk = document.getElementById('confirmModalOk');
export const confirmModalCancel = document.getElementById('confirmModalCancel');


// --- Formulários ---
export const addServiceForm = document.getElementById('addServiceForm');
export const addProfessionalForm = document.getElementById('addProfessionalForm');
export const addClientForm = document.getElementById('addClientForm');
export const addAppointmentForm = document.getElementById('addAppointmentForm');
export const blockTimeForm = document.getElementById('blockTimeForm');
export const blockDayForm = document.getElementById('blockDayForm');
export const observationForm = document.getElementById('observationForm');
export const anamnesisForm = document.getElementById('anamnesisForm');

// --- Campos de Formulário e Títulos de Modal (Inputs, selects, etc.) ---
export const serviceModalTitle = document.getElementById('serviceModalTitle');
export const serviceIdToEdit = document.getElementById('serviceIdToEdit');
export const professionalModalTitle = document.getElementById('professionalModalTitle');
export const professionalIdToEdit = document.getElementById('professionalIdToEdit');
export const professionalServicesChecklist = document.getElementById('professionalServicesChecklist');
export const clientModalTitle = document.getElementById('clientModalTitle');
export const clientIdToEdit = document.getElementById('clientIdToEdit');
export const appointmentModalTitle = document.getElementById('appointmentModalTitle');
export const appointmentIdToEdit = document.getElementById('appointmentIdToEdit');
export const appointmentDate = document.getElementById('appointmentDate');
export const appointmentTime = document.getElementById('appointmentTime');
export const appointmentClient = document.getElementById('appointmentClient');
export const appointmentProfessional = document.getElementById('appointmentProfessional');
export const appointmentService = document.getElementById('appointmentService');

// Campos do Modal de Bloqueio de Horário
export const blockIdToEdit = document.getElementById('blockIdToEdit');
export const deleteBlockBtn = document.getElementById('deleteBlockBtn');
export const blockDate = document.getElementById('blockDate');
export const blockStartTime = document.getElementById('blockStartTime');
export const blockEndTime = document.getElementById('blockEndTime');
export const blockReason = document.getElementById('blockReason');
export const blockProfessionalAdminView = document.getElementById('blockProfessionalAdminView');
export const blockProfessionalUserView = document.getElementById('blockProfessionalUserView');
export const blockProfessional = document.getElementById('blockProfessional');
export const blockProfessionalName = document.getElementById('blockProfessionalName');

// Campos do Modal de Bloqueio de Dia
export const blockDayDate = document.getElementById('blockDayDate');
export const blockDayProfessionalAdminView = document.getElementById('blockDayProfessionalAdminView');
export const blockDayProfessionalUserView = document.getElementById('blockDayProfessionalUserView');
export const blockDayProfessional = document.getElementById('blockDayProfessional');
export const blockDayProfessionalName = document.getElementById('blockDayProfessionalName');


// --- Agenda e Calendário ---
export const appointmentsTitle = document.getElementById('appointmentsTitle');
export const prevMonthBtn = document.getElementById('prevMonthBtn');
export const nextMonthBtn = document.getElementById('nextMonthBtn');
export const currentMonthYear = document.getElementById('currentMonthYear');
export const calendarDays = document.getElementById('calendarDays');
export const monthViewBtn = document.getElementById('monthViewBtn');
export const dayViewBtn = document.getElementById('dayViewBtn');
export const monthlyView = document.getElementById('monthlyView');
export const dailyView = document.getElementById('dailyView');
export const dailyViewTitle = document.getElementById('dailyViewTitle');

// --- Financeiro ---
export const financeiroPrevMonthBtn = document.getElementById('financeiroPrevMonthBtn');
export const financeiroNextMonthBtn = document.getElementById('financeiroNextMonthBtn');
export const financeiroCurrentMonthYear = document.getElementById('financeiroCurrentMonthYear');
export const faturamentoTotalMes = document.getElementById('faturamentoTotalMes');
export const ganhosProfissionalMes = document.getElementById('ganhosProfissionalMes');
export const adminFinancialSummary = document.getElementById('adminFinancialSummary');
export const adminFinancialDetails = document.getElementById('adminFinancialDetails');
export const professionalFinancialSummary = document.getElementById('professionalFinancialSummary');

// --- Anamnese e Assinatura ---
export const anamnesisClientName = document.getElementById('anamnesisClientName');
export const anamnesisClientPhone = document.getElementById('anamnesisClientPhone');
export const signaturePadCanvas = document.getElementById('signature-pad');
export const clearSignatureBtn = document.getElementById('clearSignatureBtn');

// --- Perfil do Cliente ---
export const profileClientName = document.getElementById('profileClientName');
export const profileClientPhone = document.getElementById('profileClientPhone');
export const profileClientAddress = document.getElementById('profileClientAddress');
export const profileClientObservations = document.getElementById('profileClientObservations');
export const anamnesisHistoryContainer = document.getElementById('anamnesisHistoryContainer');

