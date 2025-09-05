import { addDoc, updateDoc, doc, collection, Timestamp } from '../firebase.js';

const addExpenseModal = document.getElementById('addExpenseModal');
const addExpenseForm = document.getElementById('addExpenseForm');
const expenseModalTitle = document.getElementById('expenseModalTitle');
const expenseIdToEdit = document.getElementById('expenseIdToEdit');
const expenseDescription = document.getElementById('expenseDescription');
const expenseValue = document.getElementById('expenseValue');
const expenseDueDate = document.getElementById('expenseDueDate');

/**
 * Abre o modal de despesas para edição, preenchendo com os dados existentes.
 * @param {object} expense - O objeto da despesa a ser editada.
 */
export function openExpenseModalForEdit(expense) {
    addExpenseForm.reset();
    expenseModalTitle.textContent = 'Editar Despesa';
    expenseIdToEdit.value = expense.id;
    expenseDescription.value = expense.description;
    expenseValue.value = expense.value;
    // Formata a data do Firebase para o formato YYYY-MM-DD do input
    expenseDueDate.value = expense.dueDate.toISOString().split('T')[0];
    addExpenseModal.classList.remove('hidden');
}

/**
 * Inicializa a lógica do modal de despesas (abrir, fechar, salvar).
 * @param {object} state - O objeto de estado global da aplicação.
 * @param {object} db - A instância do Firestore.
 */
export function initializeExpensesModal(state, db) {
    const openExpenseModalBtn = document.getElementById('openExpenseModalBtn');
    const closeExpenseModalBtn = document.getElementById('closeExpenseModalBtn');
    const cancelExpenseBtn = document.getElementById('cancelExpenseBtn');

    if (!addExpenseModal || !openExpenseModalBtn) return;

    openExpenseModalBtn.addEventListener('click', () => {
        addExpenseForm.reset();
        expenseModalTitle.textContent = 'Adicionar Despesa';
        expenseIdToEdit.value = ''; // Garante que não está em modo de edição
        expenseDueDate.value = new Date().toISOString().split('T')[0];
        addExpenseModal.classList.remove('hidden');
    });

    const closeModal = () => addExpenseModal.classList.add('hidden');
    closeExpenseModalBtn.addEventListener('click', closeModal);
    cancelExpenseBtn.addEventListener('click', closeModal);

    addExpenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = expenseIdToEdit.value;
        const data = {
            description: expenseDescription.value,
            value: parseFloat(expenseValue.value),
            dueDate: Timestamp.fromDate(new Date(expenseDueDate.value + 'T00:00:00')),
        };

        if (!data.description || !data.value || !data.dueDate) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        try {
            if (id) {
                // Modo de Edição: Atualiza o documento existente
                await updateDoc(doc(db, 'expenses', id), data);
            } else {
                // Modo de Criação: Adiciona um novo documento
                const newData = {
                    ...data,
                    isPaid: false,
                    type: 'Variável',
                    salonId: state.userSalonId,
                    createdAt: Timestamp.now()
                };
                await addDoc(collection(db, 'expenses'), newData);
            }
            closeModal();
        } catch (error) {
            console.error("Erro ao salvar despesa:", error);
            alert("Ocorreu um erro ao salvar a despesa.");
        }
    });
}