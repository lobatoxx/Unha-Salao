// src/ui/renderer.js
import { state } from '../state.js';
import * as DOMElements from './domElements.js';

// --- Renderização do Header e UI Geral ---
export function updateSalonHeader() {
    if (state.salonInfo && state.salonInfo.logoUrl && DOMElements.salonLogo && DOMElements.salonTitle) {
        DOMElements.salonLogo.src = state.salonInfo.logoUrl;
        DOMElements.salonLogo.classList.remove('hidden');
        DOMElements.salonTitle.classList.add('hidden');
    } else if (state.salonInfo && state.salonInfo.name && DOMElements.salonTitle) {
        DOMElements.salonLogo?.classList.add('hidden');
        DOMElements.salonTitle.textContent = state.salonInfo.name;
        DOMElements.salonTitle.classList.remove('hidden');
    } else {
        if (DOMElements.salonLogo) DOMElements.salonLogo.classList.add('hidden');
        if (DOMElements.salonTitle) {
            DOMElements.salonTitle.textContent = 'Painel';
            DOMElements.salonTitle.classList.remove('hidden');
        }
    }
}

// (... restante do renderer.js corrigido com checagens ...)
