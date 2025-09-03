// src/listeners/authListeners.js

import * as DOMElements from '../ui/domElements.js';
import * as AuthService from '../services/authService.js';

async function handleLogin(e) {
    e.preventDefault();
    const email = DOMElements.emailInput.value;
    const password = DOMElements.passwordInput.value;
    DOMElements.authError.textContent = '';

    try {
        await AuthService.loginUser(email, password);
        // O sucesso do login será tratado pelo onAuthStateChanged, que vamos criar depois
    } catch (error) {
        DOMElements.authError.textContent = "E-mail ou senha inválidos.";
        console.error("Erro no login:", error);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = DOMElements.emailInput.value;
    const password = DOMElements.passwordInput.value;
    DOMElements.authError.textContent = '';

    if (!email || !password) {
        DOMElements.authError.textContent = "Preencha e-mail e senha.";
        return;
    }

    try {
        await AuthService.registerUser(email, password);
        // O sucesso do registro também será tratado pelo onAuthStateChanged
    } catch (error) {
        DOMElements.authError.textContent = error.message; // Usamos a mensagem de erro que o nosso serviço preparou
        console.error("Erro no registro:", error);
    }
}

function handleLogout() {
    AuthService.logoutUser().catch(error => {
        console.error("Erro ao fazer logout:", error);
        alert("Ocorreu um erro ao sair.");
    });
}

export function initializeAuthListeners() {
    DOMElements.loginButton.addEventListener('click', handleLogin);
    DOMElements.registerButton.addEventListener('click', handleRegister);
    DOMElements.logoutButton.addEventListener('click', handleLogout);
}