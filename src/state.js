// src/state.js

const state = {
  user: null,
  role: 'client',
  userSalonId: null,
  salonInfo: null,
  professionalProfile: null,
  appointments: [],
  professionals: [],
  clients: [],
  services: [],
  
  // --- NOVO ESTADO FINANCEIRO ---
  expenses: [],
  recurringExpenses: [],
  
  // --- ESTADO EXISTENTE ---
  currentDate: new Date(),
  selectedDate: new Date().toISOString().split('T')[0],
  tempSlot: { date: null, time: null },
  tempClient: { id: null, name: null, phone: null },
  signaturePad: null,
  unsubscribes: [],
  reminderInterval: null
};

// Agora, exportamos apenas o objeto state
export { state };
