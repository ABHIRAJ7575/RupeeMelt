import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { LedgerTransaction } from './supabase';


export const generateLedgerReport = (roomName: string, transactions: LedgerTransaction[]) => {
  const formatDate = (dateString: string | Date | number) => {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(44, 62, 80); // #2C3E50 Crisp deep charcoal-slate
  doc.text(`Abhiraj Dixit's Transactions`, 14, 22);
  
  doc.setFontSize(12);
  doc.setTextColor(90, 108, 125);
  doc.text(`Room: ${roomName}`, 14, 30);
  doc.text(`Generated: ${formatDate(new Date())}`, 14, 36);

  // Table Data
  const tableData = transactions.map((item, index) => {
    let modeText = item.payment_method === 'online' ? 'Online' : 'Cash';
    return [
      (index + 1).toString(),
      formatDate(item.created_at),
      modeText,
      item.category,
      item.description || 'N/A',
      (item.amount_paisa / 100).toLocaleString('en-IN')
    ];
  });

  autoTable(doc, {
    startY: 45,
    head: [['S.No', 'Date', 'Mode (Online/Cash)', 'Category', 'Description', 'Amount (Rs.)']],
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
    },
    didParseCell: function(data) {
      if (data.section === 'body') {
        const rawRow = data.row.raw as any[];
        const isHighlighted = rawRow && rawRow[4] && rawRow[4].toString().includes('[HIGHLIGHT]');
        if (isHighlighted) {
          data.cell.styles.fillColor = [254, 240, 138]; // #FEF08A Pale gold
          data.cell.styles.textColor = [0, 0, 0];
        }
        
        if (data.column.index === 4 && data.cell.text) {
          if (typeof data.cell.text === 'string') {
            (data.cell as any).text = (data.cell.text as string).replace(/\[HIGHLIGHT\]/g, '').trim();
          } else if (Array.isArray(data.cell.text)) {
            (data.cell as any).text = (data.cell.text as string[]).map((t: string) => typeof t === 'string' ? t.replace(/\[HIGHLIGHT\]/g, '').trim() : t);
          }
        }
      }
    }
  });

  // --- Financial Summary Engine ---
  let totalCashbacks = 0;
  let totalOnlineExpenses = 0;
  let totalOfflineExpenses = 0;
  let grandTotalExpenses = 0;
  let totalInflow = 0;
  const expensesByCategory: Record<string, number> = {};

  transactions.forEach(t => {
    const amount = t.amount_paisa / 100;
    if (t.transaction_direction === 'inflow') {
      totalInflow += amount;
      if (t.category === 'Cashback') totalCashbacks += amount;
    } else if (t.transaction_direction === 'outflow') {
      grandTotalExpenses += amount;
      if (t.payment_method === 'online') totalOnlineExpenses += amount;
      if (t.payment_method === 'offline') totalOfflineExpenses += amount;
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + amount;
    }
  });

  const grandTotalMoneyLeft = totalInflow - grandTotalExpenses;

  const summaryData = [
    ['Total Cashbacks Received', `₹${totalCashbacks.toFixed(2)}`],
    ...Object.keys(expensesByCategory).map(cat => [`Expense Category: ${cat}`, `₹${expensesByCategory[cat].toFixed(2)}`]),
    ['Total Online Expenses', `₹${totalOnlineExpenses.toFixed(2)}`],
    ['Total Cash (Offline) Expenses', `₹${totalOfflineExpenses.toFixed(2)}`],
    ['Grand Total Expenses', `₹${grandTotalExpenses.toFixed(2)}`],
    ['Grand Total Money Left', `₹${grandTotalMoneyLeft.toFixed(2)}`]
  ];

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 15,
    head: [['Financial Summary Metrics', 'Amount']],
    body: summaryData,
    theme: 'grid',
    headStyles: {
      fillColor: [44, 62, 80],
      textColor: [255, 255, 255]
    },
    styles: {
      font: 'helvetica',
      fontSize: 11,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });

  const blobUrl = doc.output('bloburl');
  return {
    blobUrl: blobUrl.toString(),
    save: () => {
      doc.save(`RupeeMelt_${roomName.replace(/\s+/g, '_')}_Report.pdf`);
    }
  };
};
