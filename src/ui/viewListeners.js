// src/listeners/viewListeners.js
import * as DOMElements from '../ui/domElements.js';
import { refreshAllViews } from '../ui/renderer.js';

export function initializeViewListeners() {
    // Toggle visualizações da agenda
    DOMElements.monthViewBtn?.addEventListener('click', () => {
        DOMElements.monthlyView && DOMElements.monthlyView.classList.remove('hidden');
        DOMElements.dailyView && DOMElements.dailyView.classList.add('hidden');
        refreshAllViews();
    });

    DOMElements.dayViewBtn?.addEventListener('click', () => {
        DOMElements.dailyView && DOMElements.dailyView.classList.remove('hidden');
        DOMElements.monthlyView && DOMElements.monthlyView.classList.add('hidden');
        refreshAllViews();
    });

    // Navegação por páginas
    document.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            const pageId = btn.getAttribute('data-page');
            const pageEl = document.getElementById(pageId);
            pageEl?.classList.add('active');
        });
    });
}
