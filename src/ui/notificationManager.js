/**
 * Ficheiro para gerir a exibição de notificações "toast".
 */

const notificationContainer = document.getElementById('notification-container');

/**
 * Exibe uma notificação toast.
 * @param {string} message - A mensagem a ser exibida.
 * @param {boolean} [isError=false] - Se a notificação é de erro (vermelha) ou sucesso (verde).
 */
export function showToast(message, isError = false) {
    if (!notificationContainer) return;

    const toast = document.createElement('div');
    const icon = isError ? 'fa-times-circle' : 'fa-check-circle';
    const color = isError ? 'bg-red-500' : 'bg-green-500';

    toast.className = `flex items-center gap-3 ${color} text-white px-4 py-3 rounded-lg shadow-lg mb-2 transform transition-all duration-300 opacity-0 -translate-x-12`;
    toast.innerHTML = `<i class="fas ${icon}"></i><p>${message}</p>`;
    
    notificationContainer.appendChild(toast);

    // Animação de entrada
    setTimeout(() => {
        toast.classList.remove('opacity-0', '-translate-x-12');
        toast.classList.add('opacity-100', 'translate-x-0');
    }, 10);

    // Animação de saída
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-x-0');
        toast.classList.add('opacity-0', 'translate-x-12');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, 4000); // A notificação desaparece após 4 segundos
}

