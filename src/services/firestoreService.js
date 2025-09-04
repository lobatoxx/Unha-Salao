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
    Timestamp,
    writeBatch
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
            date: doc.data().date?.toDate(),
            dueDate: doc.data().dueDate?.toDate(),
            paymentDate: doc.data().paymentDate?.toDate()
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

// --- NOVA: API de Despesas ---

export const listenToExpenses = (salonId, callback) => createCollectionListener('expenses', salonId, callback);

export const addExpense = (data) => {
    const { isInstallment, installments, ...expenseData } = data;
    const numInstallments = parseInt(installments);

    if (isInstallment && numInstallments > 1) {
        const batch = writeBatch(db);
        const installmentValue = parseFloat(expenseData.value) / numInstallments;
        const firstDate = new Date(expenseData.dueDate + 'T12:00:00Z'); // Usar UTC para evitar problemas de fuso horário

        for (let i = 0; i < numInstallments; i++) {
            const dueDate = new Date(firstDate);
            dueDate.setUTCMonth(firstDate.getUTCMonth() + i);

            const installmentDocRef = doc(collection(db, 'expenses'));
            batch.set(installmentDocRef, {
                ...expenseData,
                value: parseFloat(installmentValue.toFixed(2)),
                dueDate: Timestamp.fromDate(dueDate),
                description: `${expenseData.description} (${i + 1}/${numInstallments})`,
                status: 'unpaid',
                paymentDate: null
            });
        }
        return batch.commit();
    } else {
        return addDoc(collection(db, 'expenses'), {
            ...expenseData,
            value: parseFloat(expenseData.value),
            dueDate: Timestamp.fromDate(new Date(expenseData.dueDate + 'T12:00:00Z')),
            status: 'unpaid',
            paymentDate: null
        });
    }
};

export const updateExpense = (id, data) => {
    const dataToUpdate = { ...data, value: parseFloat(data.value) };
    if (data.dueDate) {
        dataToUpdate.dueDate = Timestamp.fromDate(new Date(data.dueDate + 'T12:00:00Z'));
    }
    return updateDoc(doc(db, 'expenses', id), dataToUpdate);
};

export const deleteExpense = (id) => deleteDoc(doc(db, 'expenses', id));

export const toggleExpenseStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    const paymentDate = newStatus === 'paid' ? Timestamp.now() : null;
    return updateDoc(doc(db, 'expenses', id), { status: newStatus, paymentDate });
};


// --- NOVA: API de Despesas Recorrentes ---

export const listenToRecurringExpenses = (salonId, callback) => createCollectionListener('recurringExpenses', salonId, callback);
export const addRecurringExpense = (data) => addDoc(collection(db, 'recurringExpenses'), { ...data, value: parseFloat(data.value), dueDay: parseInt(data.dueDay) });
export const updateRecurringExpense = (id, data) => updateDoc(doc(db, 'recurringExpenses', id), { ...data, value: parseFloat(data.value), dueDay: parseInt(data.dueDay) });
export const deleteRecurringExpense = (id) => deleteDoc(doc(db, 'recurringExpenses', id));
