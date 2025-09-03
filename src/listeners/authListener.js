import { onAuthStateChanged, doc, getDoc, signOut } from '../firebase.js';
import { auth, db } from '../firebase.js';
import { state } from '../state.js';
import * as DOMElements from '../ui/domElements.js';
import * as Renderer from '../ui/renderer.js';
import * as FirestoreService from '../services/firestoreService.js';

/**
 * Função central que renderiza todos os componentes da UI.
 */
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
 * Inicializa o listener principal de autenticação.
 */
export function initializeAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        state.unsubscribes.forEach(unsub => unsub());
        state.unsubscribes.length = 0;

        if (user) {
            try {
                // 1. Busca o "documento de índice" do usuário para saber seu salão e papel.
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (!userDocSnap.exists()) {
                    throw new Error("Perfil de usuário não encontrado.");
                }

                const userData = userDocSnap.data();
                state.user = user;
                state.userSalonId = userData.salonId;
                state.role = userData.role; // 'salonOwner' ou 'professional'

                // 2. Com o salonId, busca as informações do salão e do perfil profissional (se aplicável).
                const salonDocRef = doc(db, 'salons', state.userSalonId);
                const salonDocSnap = await getDoc(salonDocRef);
                if (!salonDocSnap.exists()) {
                    throw new Error("Salão associado não encontrado.");
                }
                state.salonInfo = salonDocSnap.data();

                if (state.role === 'professional') {
                    const profDocRef = doc(db, 'professionals', userData.professionalId);
                    const profDocSnap = await getDoc(profDocRef);
                    if (!profDocSnap.exists()) {
                        throw new Error("Perfil profissional não encontrado.");
                    }
                    state.professionalProfile = { id: profDocSnap.id, ...profDocSnap.data() };
                }

                // 3. Ativa os listeners em tempo real para as coleções do salão.
                state.unsubscribes.push(FirestoreService.listenToServices(state.userSalonId, data => { state.services = data; renderAll(); }));
                state.unsubscribes.push(FirestoreService.listenToClients(state.userSalonId, data => { state.clients = data; renderAll(); }));
                state.unsubscribes.push(FirestoreService.listenToProfessionals(state.userSalonId, data => { state.professionals = data; renderAll(); }));
                state.unsubscribes.push(FirestoreService.listenToAppointments(state.userSalonId, data => { state.appointments = data; renderAll(); }));
                
                DOMElements.appContainer.classList.remove('hidden'); 
                DOMElements.loginPage.classList.add('hidden');

            } catch (error) {
                console.error("Erro ao carregar dados do usuário:", error);
                signOut(auth); // Desloga o usuário se os dados essenciais não puderem ser carregados
            }
        } else {
            // Se o usuário deslogou, reseta o estado.
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
