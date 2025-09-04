/**
 * Retorna o nome do mês e o ano de uma data. Ex: "Setembro de 2025"
 * @param {Date} date - A data a ser formatada.
 * @returns {string}
 */
export function getMonthYear(date) {
    return date.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
}

/**
 * Retorna o primeiro dia do mês de uma data.
 * @param {Date} date - A data de referência.
 * @returns {Date}
 */
export function getStartOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Retorna o último dia do mês de uma data.
 * @param {Date} date - A data de referência.
 * @returns {Date}
 */
export function getEndOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
}

/**
 * Retorna uma nova data que é um mês após a data fornecida.
 * @param {Date} date - A data de referência.
 * @returns {Date}
 */
export function getNextMonth(date) {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + 1);
    return newDate;
}

