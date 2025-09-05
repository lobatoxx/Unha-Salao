/**
 * Gera um PDF com a lista de todos os clientes.
 * @param {object} state - O objeto de estado global da aplicação.
 */
async function generateClientReportPDF(state) {
    // Inicializa a biblioteca jsPDF que já está carregada no index.html
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Tenta adicionar o logo do salão, igual à ficha de anamnese
    try {
        if (state.salonInfo && state.salonInfo.logoUrl) {
            const toDataURL = url => fetch(url)
                .then(response => response.blob())
                .then(blob => new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }));
            const logoDataUrl = await toDataURL(state.salonInfo.logoUrl);
            doc.addImage(logoDataUrl, 'PNG', 15, 10, 40, 0);
        }
    } catch (e) {
        console.error("Erro ao carregar o logo para o PDF:", e);
    }

    // Título do Documento
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('Relatório de Clientes', 105, 45, { align: 'center' });

    // Data de emissão
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const today = new Date().toLocaleDateString('pt-BR');
    doc.text(`Data de Emissão: ${today}`, 15, 55);

    // Linha separadora
    doc.line(15, 60, 195, 60);

    // Cabeçalho da Lista
    doc.setFont("helvetica", "bold");
    doc.text('Nome do Cliente', 15, 68);
    doc.text('Telefone', 130, 68);
    doc.setFont("helvetica", "normal");

    let yPosition = 75; // Posição inicial para a lista de clientes

    if (state.clients.length === 0) {
        doc.text("Nenhum cliente cadastrado.", 15, yPosition);
    } else {
        // Itera sobre cada cliente para adicionar ao PDF
        state.clients.forEach(client => {
            // Verifica se a página precisa ser pulada (se a lista for muito grande)
            if (yPosition > 270) {
                doc.addPage();
                yPosition = 20; // Reseta a posição na nova página
            }

            doc.text(client.name, 15, yPosition);
            doc.text(client.phone, 130, yPosition);
            yPosition += 7; // Incrementa a posição para a próxima linha
        });
    }

    // Gera um nome para o arquivo e força o download
    const fileName = `Relatorio_Clientes_${today.replace(/\//g, '-')}.pdf`;
    doc.save(fileName);
}


// Esta função que inicializa o botão permanece a mesma
export function initializeReports(state) {
  const clientsPage = document.getElementById('clientesPage');
  if (!clientsPage) return;

  // Evita adicionar o botão múltiplas vezes se a função for chamada de novo
  if (document.getElementById('reportButton')) return;

  const reportButton = document.createElement('button');
  reportButton.id = 'reportButton'; // Adiciona um ID para evitar duplicação
  reportButton.textContent = 'Gerar Relatório de Clientes (PDF)';
  reportButton.className = 'w-full bg-green-600 text-white py-2 mt-4 rounded-lg font-semibold hover:bg-green-700 transition';

  // CORREÇÃO: O evento de clique agora chama a nossa nova função de gerar PDF
  reportButton.addEventListener('click', () => {
    generateClientReportPDF(state);
  });

  clientsPage.appendChild(reportButton);
}