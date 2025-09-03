// src/app.js - O Maestro

import { state } from './state.js';
import * as DOMElements from './ui/domElements.js';
import { initializeAuthListeners } from './listeners/authListeners.js';
import { initializeFormListeners } from './listeners/formListeners.js';
import { initializeViewListeners } from './listeners/viewListeners.js';
import { initializeAuthListener } from './listeners/authListener.js';

/**
 * Função principal que inicializa a aplicação.
 * Ela configura todos os listeners e módulos necessários.
 */
function initializeApp() {
    // Inicializa o SignaturePad uma única vez e o armazena no state
    // A biblioteca SignaturePad está disponível globalmente a partir do script no index.html
    state.signaturePad = new SignaturePad(DOMElements.signaturePadCanvas);

    // Chama os inicializadores de todos os nossos listeners
    initializeAuthListener(); // Ouve as mudanças de login/logout (o mais importante)
    initializeAuthListeners(); // Ouve os cliques nos botões de login/registro
    initializeFormListeners(); // Ouve os submits de todos os formulários
    initializeViewListeners(); // Ouve todos os outros cliques na interface
}

// Inicia a aplicação!
initializeApp();