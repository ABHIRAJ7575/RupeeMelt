import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { LedgerTransaction } from './supabase';


export const generateLedgerReport = (roomName: string, transactions: LedgerTransaction[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(44, 62, 80); // #2C3E50 Crisp deep charcoal-slate
  doc.text(`RupeeMelt Ledger Report`, 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(90, 108, 125);
  doc.text(`Room: ${roomName}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

  // Table Data
  const tableData = transactions.map(item => [
    new Date(item.created_at).toLocaleDateString(),
    item.description || 'N/A',
    item.transaction_direction,
    item.category,
    '₹' + (item.amount_paisa / 100).toFixed(2)
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Date', 'Description', 'Type', 'Category', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [39, 174, 96], // #27AE60 Vibrant emerald-mint
      textColor: [255, 255, 255]
    },
    styles: {
      font: 'helvetica',
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [244, 247, 246] // #F4F7F6 Ultra-light mint-ceramic white
    }
  });

  doc.save(`RupeeMelt_${roomName.replace(/\s+/g, '_')}_Report.pdf`);
};
