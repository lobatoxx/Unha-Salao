import { onAuthStateChanged, doc, getDoc, signOut, query, collection, where, setDoc, getDocs } from '../firebase.js';
import { auth, db } from '../firebase.js';
import { state } from '../state.js';
import * as DOMElements from '../ui/domElements.js';
import * as Renderer from '../ui/renderer.js';
import * as FirestoreService from '../services/firestoreService.js';

function renderAll() {
    Renderer.updateSalonHeader();
    Renderer.renderServices();
    Renderer.renderProfessionals();
    Renderer.renderClients();
    Renderer.renderDashboard();
    Renderer.renderCalendar();
    Renderer.renderAppointmentsForDay();
    Renderer.renderFinanceiro();
    Renderer.updateUIVisibility();
}

/**
 * Adiciona uma pequena pausa para resolver condições de corrida.
 * @param {number} ms - Milissegundos para esperar.
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function initializeAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        state.unsubscribes.forEach(unsub => unsub());
        state.unsubscribes.length = 0;

        if (user) {
            try {
                let userContext = null;
                const userDocRef = doc(db, 'users', user.uid);
                let userDocSnap = await getDoc(userDocRef);

                // --- INÍCIO DA CORREÇÃO DA CONDIÇÃO DE CORRIDA ---
                // Se o documento do usuário não existe na primeira tentativa (durante o registro),
                // esperamos um pouco e tentamos novamente.
                if (!userDocSnap.exists()) {
                    console.log("Documento de utilizador não encontrado, tentando novamente em 1 segundo...");
                    await sleep(1000); // Espera 1 segundo
                    userDocSnap = await getDoc(userDocRef); // Tenta buscar o documento de novo
                }
                // --- FIM DA CORREÇÃO ---

                if (userDocSnap.exists()) {
                    // Caminho Rápido: O utilizador já tem um perfil de índice.
                    userContext = userDocSnap.data();
                } else {
                    // Caminho de Migração: Pode ser um dono de salão não migrado.
                    console.log("Perfil de utilizador não encontrado, tentando migrar como dono de salão...");
                    const salonsQuery = query(collection(db, 'salons'), where("ownerId", "==", user.uid));
                    const salonSnapshot = await getDocs(salonsQuery);

                    if (!salonSnapshot.empty) {
                        const salonDoc = salonSnapshot.docs[0];
                        userContext = {
                            salonId: salonDoc.id,
                            role: 'salonOwner'
                        };
                        await setDoc(userDocRef, userContext);
                        console.log("Dono de salão migrado com sucesso.");
                    } else {
                        // Se mesmo após a retentativa e a verificação de migração não encontrar nada, aí sim é um erro.
                        throw new Error("Utilizador não está associado a nenhum salão.");
                    }
                }

                state.user = user;
                state.userSalonId = userContext.salonId;
                state.role = userContext.role;

                const salonDocRef = doc(db, 'salons', state.userSalonId);
                const salonDocSnap = await getDoc(salonDocRef);
                if (!salonDocSnap.exists()) throw new Error("Salão associado não encontrado.");
                state.salonInfo = salonDocSnap.data();

                if (state.role === 'professional') {
                    if (!userContext.professionalId) throw new Error("Índice do utilizador profissional está incompleto. Falta o professionalId.");
                    const profDocRef = doc(db, 'professionals', userContext.professionalId);
                    const profDocSnap = await getDoc(profDocRef);
                    if (!profDocSnap.exists()) throw new Error("Perfil profissional não encontrado.");
                    state.professionalProfile = { id: profDocSnap.id, ...profDocSnap.data() };
                }

                state.unsubscribes.push(FirestoreService.listenToServices(state.userSalonId, data => { state.services = data; renderAll(); }));
                state.unsubscribes.push(FirestoreService.listenToClients(state.userSalonId, data => { state.clients = data; renderAll(); }));
                state.unsubscribes.push(FirestoreService.listenToProfessionals(state.userSalonId, data => { state.professionals = data; renderAll(); }));
                state.unsubscribes.push(FirestoreService.listenToAppointments(state.userSalonId, data => { state.appointments = data; renderAll(); }));
                
                DOMElements.appContainer.classList.remove('hidden'); 
                DOMElements.loginPage.classList.add('hidden');

            } catch (error) {
                console.error("Erro ao carregar dados do utilizador:", error);
                signOut(auth);
            }
        } else {
            Object.assign(state, {
                user: null, role: 'client', userSalonId: null, professionalProfile: null, salonInfo: null,
                appointments: [], professionals: [], clients: [], services: []
            });
            DOMElements.appContainer.classList.add('hidden'); 
            DOMElements.loginPage.classList.remove('hidden');
        }

        setTimeout(() => DOMElements.loadingOverlay.classList.add('hidden'), 500);
    });
}
