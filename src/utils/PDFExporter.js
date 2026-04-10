import { jsPDF } from "jspdf";
import "jspdf-autotable"; // Using autotable for professional look

export const generatePDF = (record, appId, subModule) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // 1. COLORS & THEME
  const primaryColor = [31, 54, 61]; // Teal/Pétrole IPC
  const accentColor = [82, 153, 144]; 
  
  // 2. HEADER BANNER
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // LOGO PLACEHOLDER (TEXT)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("I.P.C", 15, 25);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("INTELLIGENCE PLATFORM FOR COMPANIES", 15, 33);
  doc.text("Business OS - Enterprise Edition", 15, 38);
  
  // DOCUMENT TYPE & NUMBER
  const docTypeName = {
    'sales_orders': 'BON DE COMMANDE',
    'crm_leads': 'FICHE PROSPECT',
    'finance_invoices': 'FACTURE',
    'inventory_movements': 'BON DE MOUVEMENT',
    'hr_employees': 'FICHE EMPLOYÉ'
  }[`${appId}_${subModule}`] || 'DOCUMENT INTERNE';

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(docTypeName, pageWidth - 15, 25, { align: "right" });
  
  doc.setFontSize(12);
  doc.text(record.num || `#${record.id.slice(-6)}`, pageWidth - 15, 33, { align: "right" });

  // 3. ADDRESSES SECTION (Sender vs Receiver)
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("ÉMETTEUR:", 15, 60);
  doc.setFont("helvetica", "normal");
  doc.text("IPC GreenBlocks S.A.", 15, 66);
  doc.text("Siège Social - District Techno", 15, 71);
  doc.text("support@ipc-erp.pro", 15, 76);

  if (record.client || record.entreprise) {
    doc.setFont("helvetica", "bold");
    doc.text("DESTINATAIRE:", pageWidth - 80, 60);
    doc.setFont("helvetica", "normal");
    doc.text(record.client || record.entreprise || record.nom, pageWidth - 80, 66);
    doc.text("Client ID: " + (record.id || 'N/A'), pageWidth - 80, 71);
  }

  // 4. MAIN CONTENT TABLE
  const tableData = Object.entries(record)
    .filter(([key]) => !['id', 'avatar', 'subModule', 'ownerId', 'updatedAt'].includes(key))
    .map(([key, value]) => [
       key.replace(/([A-Z])/g, ' $1').toUpperCase(),
       typeof value === 'object' ? JSON.stringify(value) : String(value)
    ]);

  doc.autoTable({
    startY: 90,
    head: [['DÉSIGNATION', 'VALEUR']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: 15, right: 15 }
  });

  // 5. TOTALS (If Sales/Invoice)
  let finalY = doc.lastAutoTable.finalY + 10;
  if (record.totalHT || record.montant) {
    const total = record.totalTTC || record.montant || record.totalHT;
    doc.setDrawColor(...accentColor);
    doc.setLineWidth(0.5);
    doc.line(pageWidth - 80, finalY, pageWidth - 15, finalY);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL NET:", pageWidth - 80, finalY + 10);
    doc.text(`${total.toLocaleString()} FCFA`, pageWidth - 15, finalY + 10, { align: "right" });
  }

  // 6. FOOTER
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      "Ce document est une pièce officielle générée par IPC Business OS. Signé électroniquement.",
      pageWidth / 2,
      285,
      { align: "center" }
    );
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, 290, { align: "center" });
  }

  // SAVE
  const name = record.num || record.nom || record.id;
  doc.save(`IPC_${docTypeName.replace(/ /g, '_')}_${name}.pdf`);
};
