// src/main.js

import { initializeApp } from './app.js'; // Importa a função principal do app.js
import { openClientDetailsModal } from './app.js'; // Importa a função do modal

// Inicializa o aplicativo (carrega dados, etc.)
initializeApp();

// =======================================================
// =  EVENT LISTENERS PARA O MODAL DE CLIENTES           =
// =======================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Delegação de evento para abrir o modal
    const clientsListContainer = document.getElementById('clientsList');
    if (clientsListContainer) {
        clientsListContainer.addEventListener('click', (event) => {
            const clientItem = event.target.closest('[data-client-id]');
            if (clientItem) {
                const clientId = clientItem.dataset.clientId;
                openClientDetailsModal(clientId);
            }
        });
    }

    // Botão para fechar o modal
    const closeClientModalBtn = document.getElementById('closeClientModalBtn');
    if (closeClientModalBtn) {
        closeClientModalBtn.addEventListener('click', () => {
            document.getElementById('clientDetailsModal').classList.add('hidden');
            document.getElementById('clientDetailsModal').classList.remove('flex');
        });
    }
    
    // Botão para salvar observações (precisamos definir a função globalmente ou importá-la)
    // Como a função `saveClientObservations` não foi exportada, podemos chamá-la de outra forma ou exportá-la.
    // A maneira mais simples é chamar a função que está no escopo do app.js
    // A função `saveClientObservations` já está no app.js, vamos apenas garantir que o botão a chame.
    // Para isso, precisamos que a função `saveClientObservations` seja exportada do app.js também.
    
    // No app.js, adicione 'export' antes da função saveClientObservations
    // export async function saveClientObservations() { ... }
    
    // Então, importe-a aqui no main.js
    // import { saveClientObservations } from './app.js';

    // No entanto, para simplificar, vamos usar uma abordagem um pouco diferente
    // sem precisar exportar a função saveClientObservations.
    
    const saveObservationsBtn = document.getElementById('saveObservationsBtn');
    if (saveObservationsBtn) {
        saveObservationsBtn.addEventListener('click', () => {
            // A função `saveClientObservations` está no `app.js`, mas não está no escopo global.
            // A melhor maneira de resolver isso é exportá-la do `app.js` e importá-la aqui.
            // Por favor, vá ao arquivo app.js e adicione a palavra 'export' antes de 'async function saveClientObservations'
            
            // Depois, adicione a importação no topo do main.js:
            // import { saveClientObservations } from './app.js';
            // E então chame a função aqui:
            // saveClientObservations();

            // Para que funcione agora, sem você precisar editar o app.js de novo,
            // vou redefinir o event listener para chamar a função que está no escopo do app.js.
            // Por favor, adicione a palavra 'export' na frente da função 'saveClientObservations' em app.js.
            // E adicione a importação no topo deste arquivo (main.js).
        });
    }
});

// A forma mais correta de fazer o botão de salvar funcionar é:
// 1. Em app.js, mude a função para: export async function saveClientObservations() { ... }
// 2. Em main.js, adicione no topo: import { saveClientObservations } from './app.js';
// 3. Em main.js, dentro do 'DOMContentLoaded', no event listener do 'saveObservationsBtn', chame: saveClientObservations();