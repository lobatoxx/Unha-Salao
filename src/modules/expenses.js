import { addDoc, collection, Timestamp } from '../firebase.js';

/**
 * Inicializa a lógica do modal de despesas (abrir, fechar, salvar).
 * @param {object} state - O objeto de estado global da aplicação.
 * @param {object} db - A instância do Firestore.
 */
export function initializeExpensesModal(state, db) {
    const addExpenseModal = document.getElementById('addExpenseModal');
    const openExpenseModalBtn = document.getElementById('openExpenseModalBtn');
    const closeExpenseModalBtn = document.getElementById('closeExpenseModalBtn');
    const cancelExpenseBtn = document.getElementById('cancelExpenseBtn');
    const addExpenseForm = document.getElementById('addExpenseForm');

    if (!addExpenseModal || !openExpenseModalBtn) return;

    openExpenseModalBtn.addEventListener('click', () => {
        addExpenseForm.reset();
        // Sugere a data atual como padrão para o vencimento
        document.getElementById('expenseDueDate').value = new Date().toISOString().split('T')[0];
        addExpenseModal.classList.remove('hidden');
    });

    const closeModal = () => addExpenseModal.classList.add('hidden');
    closeExpenseModalBtn.addEventListener('click', closeModal);
    cancelExpenseBtn.addEventListener('click', closeModal);

    addExpenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const description = document.getElementById('expenseDescription').value;
        const value = parseFloat(document.getElementById('expenseValue').value);
        const dueDate = document.getElementById('expenseDueDate').value;

        if (!description || !value || !dueDate) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        const expenseData = {
            description,
            value,
            dueDate: Timestamp.fromDate(new Date(dueDate + 'T00:00:00')),
            isPaid: false,
            type: 'Variável', // Por enquanto, todas são variáveis
            salonId: state.userSalonId,
            createdAt: Timestamp.now()
        };

        try {
            await addDoc(collection(db, 'expenses'), expenseData);
            closeModal();
        } catch (error) {
            console.error("Erro ao adicionar despesa:", error);
            alert("Ocorreu um erro ao salvar a despesa. Verifique o console para mais detalhes.");
        }
    });
}