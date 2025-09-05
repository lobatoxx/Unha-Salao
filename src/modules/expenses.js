import { addDoc, updateDoc, doc, collection, Timestamp } from '../firebase.js';

const addExpenseModal = document.getElementById('addExpenseModal');
const addExpenseForm = document.getElementById('addExpenseForm');
const expenseModalTitle = document.getElementById('expenseModalTitle');
const expenseIdToEdit = document.getElementById('expenseIdToEdit');
const expenseDescription = document.getElementById('expenseDescription');
const expenseValue = document.getElementById('expenseValue');
const expenseDueDate = document.getElementById('expenseDueDate');
const recurringSourceIdInput = document.getElementById('recurringExpenseSourceId'); // Novo

/**
 * Abre o modal de despesas para edição, preenchendo com os dados existentes.
 * @param {object} expense - O objeto da despesa a ser editada.
 */
export function openExpenseModalForEdit(expense) {
    addExpenseForm.reset();
    expenseModalTitle.textContent = 'Editar Despesa';
    expenseIdToEdit.value = expense.id;
    recurringSourceIdInput.value = expense.recurringExpenseSourceId || '';
    expenseDescription.value = expense.description;
    expenseValue.value = expense.value;
    expenseDueDate.value = expense.dueDate.toISOString().split('T')[0];
    addExpenseModal.classList.remove('hidden');
}

/**
 * NOVO: Abre o modal de despesas para lançar um custo fixo.
 * @param {object} recurringExpense - O modelo do custo fixo.
 * @param {Date} currentDate - A data do mês atual que está sendo visualizado.
 */
export function openExpenseModalForRecurring(recurringExpense, currentDate) {
    addExpenseForm.reset();
    expenseModalTitle.textContent = 'Lançar Custo Fixo';
    expenseIdToEdit.value = ''; // É uma criação, não edição
    recurringSourceIdInput.value = recurringExpense.id; // Guarda a origem
    
    expenseDescription.value = recurringExpense.description;
    expenseValue.value = recurringExpense.defaultValue;

    // Calcula a data de vencimento correta para o mês/ano atual
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = recurringExpense.startDay;
    const dueDate = new Date(year, month, day);
    expenseDueDate.value = dueDate.toISOString().split('T')[0];

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
        expenseIdToEdit.value = '';
        recurringSourceIdInput.value = '';
        expenseDueDate.value = new Date().toISOString().split('T')[0];
        addExpenseModal.classList.remove('hidden');
    });

    const closeModal = () => addExpenseModal.classList.add('hidden');
    closeExpenseModalBtn.addEventListener('click', closeModal);
    cancelExpenseBtn.addEventListener('click', closeModal);

    addExpenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = expenseIdToEdit.value;
        const recurringSourceId = recurringSourceIdInput.value;

        const data = {
            description: expenseDescription.value,
            value: parseFloat(expenseValue.value),
            dueDate: Timestamp.fromDate(new Date(expenseDueDate.value + 'T00:00:00')),
            recurringExpenseSourceId: recurringSourceId || null,
        };

        if (!data.description || !data.value || !data.dueDate) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        try {
            if (id) {
                // Modo de Edição
                await updateDoc(doc(db, 'expenses', id), data);
            } else {
                // Modo de Criação
                const newData = {
                    ...data,
                    isPaid: false,
                    type: recurringSourceId ? 'Fixo' : 'Variável',
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