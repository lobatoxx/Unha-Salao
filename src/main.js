import './style.css';
import './app.js';
import { registerSW } from 'virtual:pwa-register';

// Esta linha chama a função para registrar o Service Worker e ativar o PWA
registerSW({ immediate: true });