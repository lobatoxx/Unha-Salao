// src/listeners/authListener.js

import { onAuthStateChanged, query, collection, where, getDocs, doc, getDoc, signOut } from '../firebase.js';
import { auth, db } from '../firebase.js';
import { state } from '../state.js';
import * as DOMElements from '../ui/domElements.js';
import * as Renderer from '../ui/renderer.js';
import * as FirestoreService from '../services/firestoreService.js';

/**
 * Função central que renderiza todos os componentes da UI.
 * É chamada sempre que os dados do state são atualizados.
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
        // 1. Limpa listeners antigos para evitar memory leaks
        state.unsubscribes.forEach(unsub => unsub());
        state.unsubscribes.length = 0;

        if (user) {
            state.user = user;
            let foundRole = false;

            // 2. Tenta encontrar o usuário como um Profissional
            const professionalsQuery = query(collection(db, 'professionals'), where("userId", "==", user.uid));
            const professionalSnapshot = await getDocs(professionalsQuery);
            
            if (!professionalSnapshot.empty) {
                const professionalDoc = professionalSnapshot.docs[0];
                state.professionalProfile = { id: professionalDoc.id, ...professionalDoc.data() };
                state.role = 'professional';
                state.userSalonId = professionalDoc.data().salonId;
                foundRole = true;
            }

            // 3. Se não for profissional, tenta encontrar como Dono de Salão
            if (!foundRole) {
                const salonsQuery = query(collection(db, 'salons'), where("ownerId", "==", user.uid));
                const salonSnapshot = await getDocs(salonsQuery);

                if (!salonSnapshot.empty) {
                    const salonDoc = salonSnapshot.docs[0];
                    state.role = 'salonOwner';
                    state.userSalonId = salonDoc.id;
                    foundRole = true;
                }
            }
            
            // 4. Se nenhum papel foi encontrado, desloga o usuário
            if (!foundRole) {
                console.log("Usuário sem papel definido. Deslogando.");
                signOut(auth);
                return;
            }

            // 5. Se encontrou um salão, busca os dados e ativa os listeners de dados
            if (state.userSalonId) {
                const salonSnap = await getDoc(doc(db, 'salons', state.userSalonId));
                if (salonSnap.exists()) {
                    state.salonInfo = salonSnap.data();
                } else {
                     console.error("Salão não encontrado para o ID:", state.userSalonId);
                     signOut(auth);
                     return;
                }
                
                // Ativa os listeners em tempo real e armazena as funções de unsubscribe
                state.unsubscribes.push(FirestoreService.listenToServices(state.userSalonId, data => { state.services = data; renderAll(); }));
                state.unsubscribes.push(FirestoreService.listenToClients(state.userSalonId, data => { state.clients = data; renderAll(); }));
                state.unsubscribes.push(FirestoreService.listenToProfessionals(state.userSalonId, data => { state.professionals = data; renderAll(); }));
                state.unsubscribes.push(FirestoreService.listenToAppointments(state.userSalonId, data => { state.appointments = data; renderAll(); }));
            }
            
            // 6. Exibe a aplicação
            DOMElements.appContainer.classList.remove('hidden'); 
            DOMElements.loginPage.classList.add('hidden');

        } else {
            // 7. Se o usuário deslogou, reseta o estado e exibe a página de login
            Object.assign(state, {
                user: null, role: 'client', userSalonId: null, professionalProfile: null, salonInfo: null,
                appointments: [], professionals: [], clients: [], services: []
            });
            DOMElements.appContainer.classList.add('hidden'); 
            DOMElements.loginPage.classList.remove('hidden');
        }

        // 8. Esconde a tela de loading
        setTimeout(() => DOMElements.loadingOverlay.classList.add('hidden'), 500);
    });
}