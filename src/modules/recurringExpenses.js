import { addDoc, updateDoc, deleteDoc, doc, collection } from '../firebase.js';

// Elementos do DOM para o modal de custos recorrentes
const modal = document.getElementById('recurringExpensesModal');
const form = document.getElementById('recurringExpenseForm');
const formTitle = document.getElementById('recurringExpenseFormTitle');
const listContainer = document.getElementById('recurringExpensesList');
const idToEditInput = document.getElementById('recurringExpenseIdToEdit');
const descriptionInput = document.getElementById('recurringDescription');
const valueInput = document.getElementById('recurringValue');
const dayInput = document.getElementById('recurringDay');

/**
 * Renderiza a lista de modelos de custos fixos dentro do modal.
 * @param {Array} recurringExpenses - A lista de custos fixos do estado.
 */
function renderList(recurringExpenses) {
    listContainer.innerHTML = '';
    if (recurringExpenses.length === 0) {
        listContainer.innerHTML = `<p class="text-sm text-gray-500 text-center">Nenhum custo fixo cadastrado.</p>`;
        return;
    }

    recurringExpenses.forEach(item => {
        const el = document.createElement('div');
        el.className = 'bg-white p-3 rounded-lg shadow-sm border flex justify-between items-center';
        el.innerHTML = `
            <div>
                <p class="font-semibold">${item.description}</p>
                <p class="text-sm text-gray-600">Valor Padrão: R$ ${item.defaultValue.toFixed(2).replace('.', ',')} | Dia: ${item.startDay}</p>
            </div>
            <div>
                <button class="edit-recurring-btn text-blue-500 hover:text-blue-700 mr-2" data-id="${item.id}"><i class="fas fa-pencil-alt"></i></button>
                <button class="delete-recurring-btn text-red-500 hover:text-red-700" data-id="${item.id}"><i class="fas fa-trash"></i></button>
            </div>
        `;
        listContainer.appendChild(el);
    });
}

/**
 * Reseta o formulário para o modo de adição.
 */
function resetForm() {
    form.reset();
    idToEditInput.value = '';
    formTitle.textContent = 'Adicionar Novo Custo';
    document.getElementById('cancelRecurringEditBtn').classList.add('hidden');
}

/**
 * Prepara o formulário para editar um item existente.
 * @param {object} expense - O custo fixo a ser editado.
 */
function prepareFormForEdit(expense) {
    formTitle.textContent = 'Editar Custo Fixo';
    idToEditInput.value = expense.id;
    descriptionInput.value = expense.description;
    valueInput.value = expense.defaultValue;
    dayInput.value = expense.startDay;
    document.getElementById('cancelRecurringEditBtn').classList.remove('hidden');
    descriptionInput.focus();
}

/**
 * Inicializa toda a funcionalidade do modal de custos fixos.
 * @param {object} state - O objeto de estado da aplicação.
 * @param {object} db - A instância do Firestore.
 * @param {Function} showConfirmModal - Função para mostrar o modal de confirmação.
 */
export function initializeRecurringExpenses(state, db, showConfirmModal) {
    const openBtn = document.getElementById('manageRecurringBtn');
    const closeBtn = document.getElementById('closeRecurringExpensesModalBtn');
    const cancelEditBtn = document.getElementById('cancelRecurringEditBtn');

    if (!modal || !openBtn) return;

    openBtn.addEventListener('click', () => {
        renderList(state.recurringExpenses);
        resetForm();
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    cancelEditBtn.addEventListener('click', resetForm);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = idToEditInput.value;
        const data = {
            description: descriptionInput.value,
            defaultValue: parseFloat(valueInput.value),
            startDay: parseInt(dayInput.value),
            isActive: true,
            salonId: state.userSalonId,
        };

        try {
            if (id) {
                // Modo de Edição
                await updateDoc(doc(db, 'recurringExpenses', id), data);
            } else {
                // Modo de Criação
                await addDoc(collection(db, 'recurringExpenses'), data);
            }
            resetForm();
            // A lista será atualizada automaticamente pelo onSnapshot do app.js
        } catch (error) {
            console.error("Erro ao salvar custo fixo:", error);
            alert('Falha ao salvar o custo fixo.');
        }
    });

    listContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-recurring-btn');
        const deleteBtn = e.target.closest('.delete-recurring-btn');

        if (editBtn) {
            const expenseId = editBtn.dataset.id;
            const expenseToEdit = state.recurringExpenses.find(exp => exp.id === expenseId);
            if (expenseToEdit) {
                prepareFormForEdit(expenseToEdit);
            }
        }

        if (deleteBtn) {
            const expenseId = deleteBtn.dataset.id;
            showConfirmModal('Tem certeza que deseja excluir este custo fixo? Ele não será mais sugerido nos próximos meses.', () => {
                deleteDoc(doc(db, 'recurringExpenses', expenseId));
            });
        }
    });

    // Re-renderiza a lista sempre que os dados do estado mudarem
    window.addEventListener('stateUpdate', () => {
        if (!modal.classList.contains('hidden')) {
            renderList(state.recurringExpenses);
        }
    });
}