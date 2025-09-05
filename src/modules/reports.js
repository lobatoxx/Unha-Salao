// Esta função será chamada a partir do app.js
// Ela recebe o 'state' para poder acessar os dados da aplicação, como a lista de clientes.
export function initializeReports(state) {
  // Encontra o lugar no HTML onde queremos adicionar o botão
  const dashboard = document.getElementById('clientesPage');
  if (!dashboard) return; // Se não encontrar o painel, não faz nada

  // Cria um novo botão de relatório
  const reportButton = document.createElement('button');
  reportButton.textContent = 'Gerar Relatório de Clientes';
  reportButton.className = 'w-full bg-green-600 text-white py-2 mt-4 rounded-lg font-semibold hover:bg-green-700 transition';

  // Adiciona um evento de clique ao botão
  reportButton.addEventListener('click', () => {
    console.log("--- Relatório de Clientes ---");
    if (state.clients.length === 0) {
      console.log("Nenhum cliente cadastrado.");
    } else {
      state.clients.forEach(client => {
        console.log(`Nome: ${client.name}, Telefone: ${client.phone}`);
      });
    }
    alert('Relatório gerado! Verifique o console do navegador (F12).');
  });

  // Adiciona o botão ao final da página do painel
  dashboard.appendChild(reportButton);
}