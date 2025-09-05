// src/ui/domElements.js

// --- Overlays e Contêineres Principais ---
export const loadingOverlay = document.getElementById('loadingOverlay') || null;
export const loginPage = document.getElementById('loginPage') || null;
export const appContainer = document.getElementById('appContainer') || null;

// --- Páginas ---
export const painelPage = document.getElementById('painelPage') || null;
export const servicosPage = document.getElementById('servicosPage') || null;
export const equipePage = document.getElementById('equipePage') || null;
export const clientesPage = document.getElementById('clientesPage') || null;
export const agendaPage = document.getElementById('agendaPage') || null;
export const financeiroPage = document.getElementById('financeiroPage') || null;

// --- Autenticação ---
export const emailInput = document.getElementById('emailInput') || null;
export const passwordInput = document.getElementById('passwordInput') || null;
export const loginButton = document.getElementById('loginButton') || null;
export const registerButton = document.getElementById('registerButton') || null;
export const logoutButton = document.getElementById('logoutButton') || null;
export const authError = document.getElementById('authError') || null;

// --- Header ---
export const salonLogo = document.getElementById('salonLogo') || null;
export const salonTitle = document.getElementById('salonTitle') || null;

// --- Dashboard (Painel) ---
export const faturamentoHoje = document.getElementById('faturamentoHoje') || null;
export const agendamentosHoje = document.getElementById('agendamentosHoje') || null;
export const totalClientes = document.getElementById('totalClientes') || null;
export const totalServicos = document.getElementById('totalServicos') || null;
export const proximosAgendamentos = document.getElementById('proximosAgendamentos') || null;
export const totalClientesCard = document.getElementById('totalClientesCard') || null;
export const totalServicosCard = document.getElementById('totalServicosCard') || null;

// --- Listas ---
export const servicesList = document.getElementById('servicesList') || null;
export const professionalsList = document.getElementById('professionalsList') || null;
export const clientsList = document.getElementById('clientsList') || null;
export const appointmentsForDay = document.getElementById('appointmentsForDay') || null;
export const dailyViewTimeSlots = document.getElementById('dailyViewTimeSlots') || null;
export const detalhesFinanceiro = document.getElementById('detalhesFinanceiro') || null;

// --- Botões de Ação Principais ---
export const openServiceModalBtn = document.getElementById('openServiceModalBtn') || null;
export const openProfessionalModalBtn = document.getElementById('openProfessionalModalBtn') || null;
export const openClientModalBtn = document.getElementById('openClientModalBtn') || null;
export const openBlockDayModalBtn = document.getElementById('openBlockDayModalBtn') || null;

// --- Modais ---
export const addServiceModal = document.getElementById('addServiceModal') || null;
export const addProfessionalModal = document.getElementById('addProfessionalModal') || null;
export const addClientModal = document.getElementById('addClientModal') || null;
export const addAppointmentModal = document.getElementById('addAppointmentModal') || null;
export const clientProfileModal = document.getElementById('clientProfileModal') || null;
export const blockTimeModal = document.getElementById('blockTimeModal') || null;
export const blockDayModal = document.getElementById('blockDayModal') || null;
export const observationModal = document.getElementById('observationModal') || null;
export const whatsappMessageModal = document.getElementById('whatsappMessageModal') || null;
export const reminderModal = document.getElementById('reminderModal') || null;
export const anamnesisModal = document.getElementById('anamnesisModal') || null;
export const actionChoiceModal = document.getElementById('actionChoiceModal') || null;
export const confirmModal = document.getElementById('confirmModal') || null;

// --- Formulários ---
export const addServiceForm = document.getElementById('addServiceForm') || null;
export const addProfessionalForm = document.getElementById('addProfessionalForm') || null;
export const addClientForm = document.getElementById('addClientForm') || null;
export const addAppointmentForm = document.getElementById('addAppointmentForm') || null;
export const blockTimeForm = document.getElementById('blockTimeForm') || null;
export const blockDayForm = document.getElementById('blockDayForm') || null;
export const observationForm = document.getElementById('observationForm') || null;
export const anamnesisForm = document.getElementById('anamnesisForm') || null;

// --- Campos de Formulário e Títulos de Modal ---
export const serviceModalTitle = document.getElementById('serviceModalTitle') || null;
export const serviceIdToEdit = document.getElementById('serviceIdToEdit') || null;
export const professionalModalTitle = document.getElementById('professionalModalTitle') || null;
export const professionalIdToEdit = document.getElementById('professionalIdToEdit') || null;
export const professionalServicesChecklist = document.getElementById('professionalServicesChecklist') || null;
export const clientModalTitle = document.getElementById('clientModalTitle') || null;
export const clientIdToEdit = document.getElementById('clientIdToEdit') || null;
export const appointmentModalTitle = document.getElementById('appointmentModalTitle') || null;
export const appointmentIdToEdit = document.getElementById('appointmentIdToEdit') || null;
export const appointmentDate = document.getElementById('appointmentDate') || null;
export const appointmentTime = document.getElementById('appointmentTime') || null;
export const appointmentClient = document.getElementById('appointmentClient') || null;
export const appointmentProfessional = document.getElementById('appointmentProfessional') || null;
export const appointmentService = document.getElementById('appointmentService') || null;
export const blockIdToEdit = document.getElementById('blockIdToEdit') || null;
export const blockDate = document.getElementById('blockDate') || null;
export const blockStartTime = document.getElementById('blockStartTime') || null;
export const blockEndTime = document.getElementById('blockEndTime') || null;
export const blockReason = document.getElementById('blockReason') || null;
export const blockProfessional = document.getElementById('blockProfessional') || null;
export const blockProfessionalAdminView = document.getElementById('blockProfessionalAdminView') || null;
export const blockProfessionalUserView = document.getElementById('blockProfessionalUserView') || null;
export const blockProfessionalName = document.getElementById('blockProfessionalName') || null;
export const deleteBlockBtn = document.getElementById('deleteBlockBtn') || null;
export const blockDayDate = document.getElementById('blockDayDate') || null;
export const blockDayProfessional = document.getElementById('blockDayProfessional') || null;
export const blockDayProfessionalAdminView = document.getElementById('blockDayProfessionalAdminView') || null;
export const blockDayProfessionalUserView = document.getElementById('blockDayProfessionalUserView') || null;
export const blockDayProfessionalName = document.getElementById('blockDayProfessionalName') || null;
export const observationAppointmentId = document.getElementById('observationAppointmentId') || null;

// --- Agenda e Calendário ---
export const appointmentsTitle = document.getElementById('appointmentsTitle') || null;
export const prevMonthBtn = document.getElementById('prevMonthBtn') || null;
export const nextMonthBtn = document.getElementById('nextMonthBtn') || null;
export const currentMonthYear = document.getElementById('currentMonthYear') || null;
export const calendarDays = document.getElementById('calendarDays') || null;
export const monthViewBtn = document.getElementById('monthViewBtn') || null;
export const dayViewBtn = document.getElementById('dayViewBtn') || null;
export const monthlyView = document.getElementById('monthlyView') || null;
export const dailyView = document.getElementById('dailyView') || null;
export const dailyViewTitle = document.getElementById('dailyViewTitle') || null;

// --- Financeiro ---
export const financeiroPrevMonthBtn = document.getElementById('financeiroPrevMonthBtn') || null;
export const financeiroNextMonthBtn = document.getElementById('financeiroNextMonthBtn') || null;
export const financeiroCurrentMonthYear = document.getElementById('financeiroCurrentMonthYear') || null;
export const faturamentoTotalMes = document.getElementById('faturamentoTotalMes') || null;
export const ganhosProfissionalMes = document.getElementById('ganhosProfissionalMes') || null;
export const adminFinancialSummary = document.getElementById('adminFinancialSummary') || null;
export const adminFinancialDetails = document.getElementById('detalhesFinanceiro') || null; // corrigido
export const professionalFinancialSummary = document.getElementById('professionalFinancialSummary') || null;

// --- Anamnese e Assinatura ---
export const anamnesisClientName = document.getElementById('anamnesisClientName') || null;
export const anamnesisClientPhone = document.getElementById('anamnesisClientPhone') || null;
export const signaturePadCanvas = document.getElementById('signature-pad') || null;
export const clearSignatureBtn = document.getElementById('clearSignatureBtn') || null;
export const profileClientName = document.getElementById('profileClientName') || null;
export const profileClientPhone = document.getElementById('profileClientPhone') || null;
export const profileClientAddress = document.getElementById('profileClientAddress') || null;
export const profileClientObservations = document.getElementById('profileClientObservations') || null;
export const anamnesisHistoryContainer = document.getElementById('anamnesisHistoryContainer') || null;
export const anamnesisAppointmentId = document.getElementById('anamnesisAppointmentId') || null;
export const anamnesisClientId = document.getElementById('anamnesisClientId') || null;

// --- Modais Genéricos ---
export const confirmModalText = document.getElementById('confirmModalText') || null;
export const confirmModalOk = document.getElementById('confirmModalOk') || null;
export const confirmModalCancel = document.getElementById('confirmModalCancel') || null;
