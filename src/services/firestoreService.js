// src/services/firestoreService.js

import {
    db,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    onSnapshot,
    Timestamp
} from '../firebase.js';

// --- Funções de Listener (Tempo Real) ---

/**
 * Cria um listener em tempo real para uma coleção do Firestore.
 * @param {string} collectionName - O nome da coleção.
 * @param {string} salonId - O ID do salão para filtrar os documentos.
 * @param {function} callback - A função a ser chamada com os novos dados.
 * @returns {function} A função de unsubscribe do listener.
 */
function createCollectionListener(collectionName, salonId, callback) {
    const q = query(collection(db, collectionName), where("salonId", "==", salonId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Converte Timestamps do Firebase para objetos Date do JS, se existirem
            date: doc.data().date?.toDate()
        }));
        callback(data);
    });

    return unsubscribe;
}

// --- API de Serviços ---

export const listenToServices = (salonId, callback) => createCollectionListener('services', salonId, callback);
export const addService = (data) => addDoc(collection(db, 'services'), data);
export const updateService = (id, data) => updateDoc(doc(db, 'services', id), data);
export const deleteService = (id) => deleteDoc(doc(db, 'services', id));

// --- API de Profissionais ---

export const listenToProfessionals = (salonId, callback) => createCollectionListener('professionals', salonId, callback);
export const addProfessional = (data) => addDoc(collection(db, 'professionals'), data);
export const updateProfessional = (id, data) => updateDoc(doc(db, 'professionals', id), data);
export const deleteProfessional = (id) => deleteDoc(doc(db, 'professionals', id));

// --- API de Clientes ---

export const listenToClients = (salonId, callback) => createCollectionListener('clients', salonId, callback);
export const addClient = (data) => addDoc(collection(db, 'clients'), data);
export const updateClient = (id, data) => updateDoc(doc(db, 'clients', id), data);
export const deleteClient = (id) => deleteDoc(doc(db, 'clients', id));
export const updateClientAnamnesis = (clientId, history) => {
    return updateDoc(doc(db, 'clients', clientId), { anamnesisHistory: history });
};

// --- API de Agendamentos ---

export const listenToAppointments = (salonId, callback) => createCollectionListener('appointments', salonId, callback);
export const addAppointment = (data) => {
    // Garante que a data seja salva no formato Timestamp do Firebase
    const appointmentData = { ...data, date: Timestamp.fromDate(new Date(data.date)) };
    return addDoc(collection(db, 'appointments'), appointmentData);
};
export const updateAppointment = (id, data) => {
    const appointmentData = { ...data, date: Timestamp.fromDate(new Date(data.date)) };
    return updateDoc(doc(db, 'appointments', id), appointmentData);
};
export const updateAppointmentStatus = (id, status, observation = null) => {
    const dataToUpdate = { status };
    if (observation) {
        dataToUpdate.observation = observation;
    }
    return updateDoc(doc(db, 'appointments', id), dataToUpdate);
};
export const deleteAppointment = (id) => deleteDoc(doc(db, 'appointments', id));