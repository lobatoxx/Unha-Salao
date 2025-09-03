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
  currentDate: new Date(),
  selectedDate: new Date().toISOString().split('T')[0],
  tempSlot: { date: null, time: null },
  tempClient: { id: null, name: null, phone: null },
  signaturePad: null   // ✅ agora o SignaturePad faz parte do state
};

let unsubscribes = [];
let reminderInterval = null;

export { state, unsubscribes, reminderInterval };
