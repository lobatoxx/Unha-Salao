// src/utils/pdfGenerator.js

import { state } from '../state.js';

/**
 * Gera um PDF da ficha de anamnese e o compartilha ou baixa.
 * @param {object} client - O objeto do cliente.
 * @param {object} record - O registro de anamnese específico.
 */
export async function exportAnamnesisToPDF(client, record) {
    // A biblioteca jspdf é carregada via CDN no index.html e está disponível globalmente
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

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
        } else {
            doc.text("Logo do Salão", 15, 20);
        }
    } catch (e) {
        console.error("Erro ao carregar o logo:", e);
        doc.text("Logo não carregado", 15, 20);
    }

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('Ficha de Anamnese', 105, 45, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const recordDate = record.date.toDate ? record.date.toDate() : new Date(record.date);
    doc.text(`Data: ${recordDate.toLocaleDateString('pt-BR')}`, 15, 55);

    doc.line(15, 60, 195, 60);

    doc.setFont("helvetica", "bold");
    doc.text('Dados do Cliente', 15, 68);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${client.name}`, 15, 75);
    doc.text(`Telefone: ${client.phone}`, 15, 82);

    doc.line(15, 90, 195, 90);

    doc.setFont("helvetica", "bold");
    doc.text('Questionário', 15, 98);
    doc.setFont("helvetica", "normal");

    let yPosition = 105;
    const answers = record.answers;
    
    const addPdfLine = (label, value) => {
        if (yPosition > 260) { 
            doc.addPage();
            yPosition = 20;
        }
        const splitText = doc.splitTextToSize(`${label}: ${value}`, 180);
        doc.text(splitText, 15, yPosition);
        yPosition += (splitText.length * 5) + 3;
    };

    const formatYesNo = (value) => (value || 'nao').replace('nao', 'Não').replace('sim', 'Sim');

    addPdfLine("1. Alergias?", answers.alergia === 'sim' ? `Sim - Qual? ${answers.alergia_qual || 'Não especificado'}` : 'Não');
    addPdfLine("2. Doenças de pele?", answers.doenca_pele === 'sim' ? `Sim - Quais? ${answers.doenca_pele_qual || 'Não especificado'}` : 'Não');
    addPdfLine("3. Problemas de coagulação?", formatYesNo(answers.coagulacao));
    addPdfLine("4. Diabetes?", formatYesNo(answers.diabetes));
    addPdfLine("5. Infecção prévia?", formatYesNo(answers.infeccao));
    addPdfLine("6. Gestante?", formatYesNo(answers.gestante));
    
    yPosition += 5;
    doc.line(15, yPosition, 195, yPosition);
    yPosition += 8;
    doc.setFont("helvetica", "bold");
    doc.text('Assinatura do Cliente:', 15, yPosition);
    yPosition += 5;

    try {
        doc.addImage(record.signature, 'PNG', 15, yPosition, 80, 25);
    } catch(e) {
        console.error("Erro ao adicionar a assinatura", e);
        doc.text("Assinatura inválida", 15, yPosition + 10);
    }

    const fileName = `Anamnese_${client.name.replace(/ /g, '_')}_${recordDate.toLocaleDateString('pt-BR')}.pdf`;

    if (navigator.share) {
        const pdfBlob = doc.output('blob');
        const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
        try {
            await navigator.share({
                title: `Anamnese de ${client.name}`,
                text: `Segue a ficha de anamnese preenchida em ${recordDate.toLocaleDateString('pt-BR')}.`,
                files: [pdfFile]
            });
        } catch(e) {
            console.log('Compartilhamento cancelado ou falhou', e);
        }
    } else {
        doc.save(fileName);
    }
}