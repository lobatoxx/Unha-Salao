// state.js
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
  expenses: [], // <-- ADICIONE ESTA LINHA
  currentDate: new Date(),
  selectedDate: new Date().toISOString().split('T')[0],
  tempSlot: { date: null, time: null },
  tempClient: { id: null, name: null, phone: null },
  signaturePad: null,
  // Variáveis movidas para dentro do objeto state:
  unsubscribes: [],
  reminderInterval: null
};

// Agora, exportamos apenas o objeto state
export { state };