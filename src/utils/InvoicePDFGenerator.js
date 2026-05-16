import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * InvoicePDFGenerator
 * Moteur de génération PDF "Luxury" pour les Factures et Devis (Nexus Cockpit)
 */
export const generateCommercialDocument = (record, type) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Design System Colors
  const primaryColor = [6, 78, 59]; // Emerald 900
  const secondaryColor = [100, 116, 139]; // Slate 500
  const textColor = [15, 23, 42]; // Slate 900

  const isInvoice = type === 'invoices';
  const docTitle = isInvoice ? 'FACTURE' : 'DEVIS';
  const docNumber = record.id
    ? record.id.substring(0, 8).toUpperCase()
    : `REF-${Date.now().toString(36).toUpperCase()}`;

  // ════════ 1. HEADER (LUXURY STYLE) ════════
  
  // Top accent bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 8, 'F');

  // Company Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...primaryColor);
  doc.text('I.P.C', 15, 28);
  
  // Company Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...secondaryColor);
  doc.text('INTELLIGENCE & PERFORMANCE COMPANY', 15, 34);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Abidjan, Côte d\'Ivoire', 15, 39);
  doc.text('contact@ipc-ci.com | +225 00 00 00 00 00', 15, 44);

  // Document Type & Number (Right Aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(36);
  doc.setTextColor(...primaryColor);
  doc.text(docTitle, pageWidth - 15, 30, { align: 'right' });
  
  doc.setFontSize(12);
  doc.setTextColor(...secondaryColor);
  doc.text(`N° ${docNumber}`, pageWidth - 15, 38, { align: 'right' });
  doc.text(`Date : ${new Date().toLocaleDateString()}`, pageWidth - 15, 44, { align: 'right' });

  // Divider Line
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.setLineWidth(0.5);
  doc.line(15, 55, pageWidth - 15, 55);


  // ════════ 2. CLIENT INFO ════════
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...secondaryColor);
  doc.text('ADRESSÉ À :', 15, 68);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...textColor);
  doc.text(record.client || 'Client Inconnu', 15, 76);

  // Dates & Status
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...secondaryColor);
  
  if (isInvoice) {
    const echeance = record.dateEcheance ? new Date(record.dateEcheance).toLocaleDateString() : 'À réception';
    doc.text(`Date d'échéance : ${echeance}`, 15, 83);
  } else {
    const validite = record.valideJusquau ? new Date(record.valideJusquau).toLocaleDateString() : '30 jours';
    doc.text(`Valable jusqu'au : ${validite}`, 15, 83);
  }


  // ════════ 3. ITEMS TABLE (AutoTable) ════════
  
  // Extraction des montants
  const amountTTC = Number(record.montant) || 0;
  const amountHT = amountTTC / 1.18; 
  const tvaAmount = amountTTC - amountHT; 

  doc.autoTable({
    startY: 95,
    head: [['Description', 'Quantité', 'Prix Unitaire HT', 'Total HT']],
    body: [
      ['Prestations et Services contractuels', '1', `${Math.round(amountHT).toLocaleString()} FCFA`, `${Math.round(amountHT).toLocaleString()} FCFA`]
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [248, 250, 252], // Slate 50
      textColor: [100, 116, 139],
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 6,
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 10,
      cellPadding: 8,
    },
    alternateRowStyles: {
      fillColor: [255, 255, 255]
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    },
    didDrawCell: (data) => {
      // Bottom border for the header
      if (data.row.section === 'head') {
        doc.setDrawColor(226, 232, 240);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
      // Bottom border for body rows
      if (data.row.section === 'body') {
        doc.setDrawColor(241, 245, 249);
        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
      }
    }
  });


  // ════════ 4. TOTALS (Aligned Right) ════════
  
  const finalY = doc.lastAutoTable.finalY + 15;
  const rightColX = pageWidth - 65;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...secondaryColor);
  doc.text('Total HT', rightColX, finalY);
  doc.text(`${Math.round(amountHT).toLocaleString()} FCFA`, pageWidth - 15, finalY, { align: 'right' });

  doc.text('TVA (18%)', rightColX, finalY + 8);
  doc.text(`${Math.round(tvaAmount).toLocaleString()} FCFA`, pageWidth - 15, finalY + 8, { align: 'right' });

  // Big Total Bar
  doc.setFillColor(248, 250, 252);
  doc.rect(rightColX - 5, finalY + 12, 70, 12, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...primaryColor);
  doc.text('TOTAL TTC', rightColX, finalY + 20);
  doc.text(`${Math.round(amountTTC).toLocaleString()} FCFA`, pageWidth - 15, finalY + 20, { align: 'right' });


  // ════════ 5. FOOTER & PAYMENT TERMS ════════
  
  const footerY = pageHeight - 40;
  
  doc.setDrawColor(226, 232, 240);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text('Modalités de Paiement & Notes', 15, footerY + 2);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...secondaryColor);
  doc.text('Virement bancaire au compte : CI000 00000 00000000000 00', 15, footerY + 8);
  doc.text(`Ce document est soumis aux conditions générales de vente de I.P.C.`, 15, footerY + 13);
  
  // Watermark / Auto-gen text
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Généré automatiquement par Nexus Command Center - I.P.C', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // ════════ DOWNLOAD TRIGGER ════════
  
  const filename = `IPC_${docTitle}_${docNumber}.pdf`;
  doc.save(filename);
};
