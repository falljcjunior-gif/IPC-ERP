import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * IPCReportGenerator
 * Senior Architect Utility for Premium PDF Export
 */
export const IPCReportGenerator = {
  /**
   * Generates a branded header for the PDF
   */
  _drawHeader: (doc, title) => {
    const pageWidth = doc.internal.pageSize.width;
    
    // Emerald Accent Bar
    doc.setFillColor(6, 78, 59); // var(--primary-dark)
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    // Logo Text
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('I.P.C - IVORY COAST', 15, 17);
    
    // Report Title
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFontSize(24);
    doc.text(title.toUpperCase(), 15, 45);
    
    // Date & metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Généré le: ${new Date().toLocaleString()}`, 15, 52);
    doc.text('Document Officiel I.P.C Intelligence', pageWidth - 15, 52, { align: 'right' });
    
    // Divider
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.line(15, 58, pageWidth - 15, 58);
  },

  /**
   * Generates a Financial Statement
   */
  generateFinancialStatement: async (options = {}) => {
    const doc = new jsPDF();
    const { title = "Bilan Financier", metrics = [], rows = [] } = options;
    
    IPCReportGenerator._drawHeader(doc, title);
    
    // Summary Cards
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(6, 78, 59);
    doc.text('RÉSUMÉ ANALYTIQUE', 15, 70);
    
    const summaryData = metrics.map(m => [m.label, m.value]);
    
    doc.autoTable({
      startY: 75,
      head: [['Indicateur', 'Valeur']],
      body: summaryData.length > 0 ? summaryData : [['Aucune donnée', '—']],
      theme: 'striped',
      headStyles: { fillStyle: 'F', fillColor: [6, 78, 59], textColor: 255 },
      styles: { fontSize: 10, cellPadding: 5 }
    });
    
    // Details
    const nextY = doc.lastAutoTable.finalY + 15;
    doc.text('DÉTAILS DES OPÉRATIONS', 15, nextY);
    
    doc.autoTable({
      startY: nextY + 5,
      head: [['Module', 'Description', 'Statut']],
      body: rows.map(r => [r.module || '—', r.description || '—', r.status || '—']),
      headStyles: { fillColor: [15, 23, 42] },
      styles: { fontSize: 9 }
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} sur ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }
    
    doc.save(`IPC_Report_${new Date().getTime()}.pdf`);
  },

  /**
   * Generates an Inventory Report
   */
  generateStockReport: (items) => {
    const doc = new jsPDF();
    IPCReportGenerator._drawHeader(doc, 'État des Stocks & Valorisation');
    
    doc.autoTable({
      startY: 70,
      head: [['Ref', 'Désignation', 'Localisation', 'Qte', 'Unité', 'Valeur Est.']],
      body: items.map(item => [
        item.ref || '—',
        item.nom || '—',
        item.entrepot || 'Entrepôt Principal',
        item.quantite || 0,
        item.unite || 'pcs',
        { content: `${(item.quantite * (item.prixUnitaire || 0)).toLocaleString()} FCFA`, styles: { halign: 'right' } }
      ]),
      headStyles: { fillColor: [6, 78, 59] },
      styles: { fontSize: 9 }
    });
    
    doc.save(`IPC_Stock_Report_${new Date().getTime()}.pdf`);
  },

  /**
   * Generates a professional Employment Contract
   */
  generateEmploymentContract: (employee) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    IPCReportGenerator._drawHeader(doc, "Contrat de Travail");
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ENTRE LES SOUSSIGNÉS :', 15, 70);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text([
      '1. La Société I.P.C (IVORY COAST), société à responsabilité limitée, sise à Abidjan,',
      'représentée par la Direction Générale, ci-après désignée "L\'Employeur".',
      '',
      `2. ${employee.nom.toUpperCase()}, résidant à [Adresse à compléter],`,
      `ci-après désigné(e) "Le Collaborateur".`
    ], 15, 80);
    
    doc.setFont('helvetica', 'bold');
    doc.text('ARTICLE 1 : ENGAGEMENT ET FONCTIONS', 15, 110);
    doc.setFont('helvetica', 'normal');
    doc.text([
      `Le Collaborateur est engagé sous contrat à durée ${employee.contratType === 'CDD' ? 'déterminée (' + (employee.contratDuree || '12') + ' mois)' : 'indéterminée'}.`,
      `Il exercera les fonctions de ${employee.poste} au sein du département ${employee.dept}.`,
      'Il exercera ses fonctions sous l\'autorité et selon les directives de la Direction.'
    ], 15, 117);
    
    doc.setFont('helvetica', 'bold');
    doc.text('ARTICLE 2 : RÉMUNÉRATION', 15, 140);
    doc.setFont('helvetica', 'normal');
    doc.text([
      `En contrepartie de l'accomplissement de ses fonctions, le Collaborateur percevra une`,
      `rémunération brute mensuelle de ${(Number(employee.salaire) || 0).toLocaleString()} FCFA.`
    ], 15, 147);
    
    doc.setFont('helvetica', 'bold');
    doc.text('ARTICLE 3 : CONFIDENTIALITÉ ET EXCLUSIVITÉ', 15, 165);
    doc.setFont('helvetica', 'normal');
    doc.text([
      'Le Collaborateur s\'engage à observer la plus grande discrétion sur toutes les informations',
      'dont il pourrait avoir connaissance à l\'occasion de ses fonctions. Il s\'engage à consacrer',
      'l\'exclusivité de son activité professionnelle à la Société.'
    ], 15, 172);
    
    // Signatures
    const sigY = 230;
    doc.setFont('helvetica', 'bold');
    doc.text('L\'EMPLOYEUR', 40, sigY, { align: 'center' });
    doc.text('LE COLLABORATEUR', pageWidth - 40, sigY, { align: 'center' });
    
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('(Signature précédée de la mention "Lu et approuvé")', 40, sigY + 5, { align: 'center' });
    doc.text('(Signature précédée de la mention "Lu et approuvé")', pageWidth - 40, sigY + 5, { align: 'center' });
    
    // Add QR Code or Verification Marker
    doc.setDrawColor(6, 78, 59);
    doc.rect(15, 270, 180, 15, 'S');
    doc.setFont('helvetica', 'bold');
    doc.text('CERTIFIÉ PAR NEXUS OS - IVORY COAST ERP', 105, 279, { align: 'center' });
    
    doc.save(`Contrat_${employee.nom.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
    return doc.output('blob');
  }
};

/**
 * Legacy Proxy for generatePDF
 * Used by DMS, StaffPortal, and DetailOverlay
 */
export const generatePDF = (record, appId, subModule) => {
  const doc = new jsPDF();
  IPCReportGenerator._drawHeader(doc, `${appId.toUpperCase()} - ${subModule.toUpperCase()}`);
  
  const entries = Object.entries(record || {}).filter(([k]) => !k.startsWith('_'));
  
  doc.autoTable({
    startY: 70,
    head: [['Champ', 'Valeur']],
    body: entries.map(([k, v]) => [k, String(v)]),
    headStyles: { fillColor: [6, 78, 59] },
    styles: { fontSize: 10 }
  });
  
  doc.save(`IPC_${appId}_${subModule}_${new Date().getTime()}.pdf`);
};
