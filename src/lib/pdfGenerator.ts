import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { LedgerTransaction } from './supabase';
import { isInternalTransfer, getTransferMetadata } from './ledgerUtils';

export const generateLedgerReport = (roomName: string, transactions: LedgerTransaction[]) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // #0f172a Deep slate
  const title = roomName === 'Elite_Trip_Vault' ? 'Elite Trip Report' : `Abhiraj Dixit's Transactions`;
  doc.text(title, 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139); // #64748b Muted slate
  doc.text(`Room: ${roomName}`, 14, 30);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 36);

  // Ensure transactions are sorted chronologically ascending before mapping to PDF rows
  const sortedTx = [...transactions].sort((a: any, b: any) => {
    const timeA = new Date(a.date || a.timestamp || a.created_at).getTime();
    const timeB = new Date(b.date || b.timestamp || b.created_at).getTime();
    return timeA - timeB;
  });

  let cumulativeBal = 0;
  const tableRows = sortedTx.map((tx: any) => {
    const amt = Number(tx.amount !== undefined ? tx.amount : (tx.amount_paisa / 100)) || 0;
    const isCredit = tx.type === 'credit' || tx.type === 'inflow' || tx.transaction_direction === 'inflow';
    const isTransfer = isInternalTransfer(tx);

    if (isTransfer) {
      // 0-delta: internal transfers shift funds between payment modes without changing net cumulative balance
    } else if (isCredit) {
      cumulativeBal += amt;
    } else {
      cumulativeBal -= amt;
    }

    const rawDate = tx.date || tx.timestamp || tx.created_at;
    const dateStr = tx.date || (rawDate ? new Date(rawDate).toLocaleDateString('en-IN') : 'N/A');
    const desc = (tx.note || tx.description || 'Transaction')
      .replace(/\[HIGHLIGHT\]/g, '')
      .replace(/\[ELITE\]/g, '')
      .trim();

    const transferMeta = isTransfer ? getTransferMetadata(tx) : null;
    const typeLabel = isTransfer ? 'TRANSFER' : (isCredit ? 'CREDIT' : 'DEBIT');
    const amountStr = isTransfer
      ? amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : `${isCredit ? '+ ' : '- '}${amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const displayCategory = isTransfer && transferMeta ? transferMeta.primaryLabel : (tx.category || 'General');

    return [
      dateStr,
      desc || 'Transaction',
      displayCategory,
      typeLabel,
      amountStr,
      `${cumulativeBal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ];
  });

  autoTable(doc, {
    startY: 45,
    head: [['Date', 'Description / Note', 'Category', 'Type', 'Amount (INR)', 'Running Balance (INR)']],
    body: tableRows,
    foot: [
      [
        { 
          content: 'CLOSING BALANCE', 
          colSpan: 5, 
          styles: { halign: 'right', fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [56, 189, 248] } 
        },
        { 
          content: `${cumulativeBal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
          styles: { halign: 'right', fontStyle: 'bold', fillColor: cumulativeBal >= 0 ? [16, 185, 129] : [244, 63, 94], textColor: 255 }
        }
      ]
    ],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [15, 23, 42], // Slate 900
      textColor: [56, 189, 248], // Cyan 400
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'left' },   // Date
      1: { cellWidth: 'auto', halign: 'left' }, // Description / Note (expands to fill)
      2: { cellWidth: 26, halign: 'left' },   // Category
      3: { cellWidth: 16, halign: 'center' }, // Type (DEBIT/CREDIT)
      4: { cellWidth: 32, halign: 'right' },  // Amount (INR)
      5: { cellWidth: 34, halign: 'right' },  // Running Balance (INR)
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // #f8fafc slate-50
    },
    didParseCell: function(data) {
      if (data.section === 'head') {
        if (data.column.index === 3) data.cell.styles.halign = 'center';
        if (data.column.index === 4 || data.column.index === 5) data.cell.styles.halign = 'right';
      }
      if (data.section === 'body') {
        const rawRow = data.row.raw as any[];
        const typeStr = rawRow && rawRow[3];
        const isTransfer = typeStr === 'TRANSFER';
        const isCredit = typeStr === 'CREDIT';

        // Check for highlighted transactions in original record
        const descText = rawRow && rawRow[1] ? rawRow[1].toString() : '';
        const isHighlighted = descText.includes('[HIGHLIGHT]');
        if (isHighlighted) {
          data.cell.styles.fillColor = [254, 240, 138]; // #FEF08A Pale gold
          data.cell.styles.textColor = [0, 0, 0];
        } else {
          // Style credit amounts with soft green tint, debit amounts with soft red tint, and transfer with neutral cyan tint
          if (data.column.index === 4) {
            if (isTransfer) {
              data.cell.styles.textColor = [14, 116, 144]; // Cyan-700
              data.cell.styles.fillColor = [240, 253, 250]; // Cyan-50
              data.cell.styles.fontStyle = 'bold';
            } else if (isCredit) {
              data.cell.styles.textColor = [5, 150, 105]; // Emerald-600
              data.cell.styles.fillColor = [236, 253, 245]; // Emerald-50 soft green tint
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [225, 29, 72]; // Rose-600
              data.cell.styles.fillColor = [255, 241, 242]; // Rose-50 soft red tint
              data.cell.styles.fontStyle = 'bold';
            }
          } else if (data.column.index === 3) {
            if (isTransfer) {
              data.cell.styles.textColor = [14, 116, 144]; // Cyan-700
              data.cell.styles.fillColor = [240, 253, 250];
              data.cell.styles.fontStyle = 'bold';
            } else if (isCredit) {
              data.cell.styles.textColor = [5, 150, 105];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [225, 29, 72];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      }
    },
    didDrawPage: function (data) {
      const doc = data.doc;
      const str = 'Generated by RupeeMelt Core Engine V5.3';
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Muted slate color
      doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
    }
  });

  // --- Financial Summary Engine ---
  let totalCashbacks = 0;
  let totalOnlineExpenses = 0;
  let totalOfflineExpenses = 0;
  let grandTotalExpenses = 0;
  let totalInflow = 0;
  const expensesByCategory: Record<string, number> = {};

  transactions.forEach((t: any) => {
    const isTransfer = isInternalTransfer(t);
    if (isTransfer) {
      // Internal transfers are neutral asset reallocations, not external revenue or expense
      return;
    }

    const amount = Number(t.amount !== undefined ? t.amount : (t.amount_paisa / 100)) || 0;
    const isCredit = t.type === 'credit' || t.type === 'inflow' || t.transaction_direction === 'inflow';
    if (isCredit) {
      totalInflow += amount;
      if (t.category === 'Cashback') totalCashbacks += amount;
    } else {
      grandTotalExpenses += amount;
      if (t.payment_method === 'online') totalOnlineExpenses += amount;
      if (t.payment_method === 'offline') totalOfflineExpenses += amount;
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + amount;
    }
  });

  const grandTotalMoneyLeft = totalInflow - grandTotalExpenses;

  const summaryData = [
    ['Total Cashbacks Received', `${totalCashbacks.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    ...Object.keys(expensesByCategory).map(cat => [`Expense Category: ${cat}`, `${expensesByCategory[cat].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]),
    ['Total Online Expenses', `${totalOnlineExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    ['Total Cash (Offline) Expenses', `${totalOfflineExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    ['Grand Total Expenses', `${grandTotalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    ['Grand Total Money Left', `${grandTotalMoneyLeft.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]
  ];

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 15,
    head: [['Financial Summary Metrics', 'Amount (INR)']],
    body: summaryData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // #0f172a Dark slate theme
      textColor: [56, 189, 248] // #38bdf8 Cyan text
    },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      fontStyle: 'bold',
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 }
    },
    columnStyles: {
      1: { halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: function (data) {
      const doc = data.doc;
      const str = 'Generated by RupeeMelt Core Engine V5.3';
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
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
