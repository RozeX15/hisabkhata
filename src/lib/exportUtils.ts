import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Transaction, Wallet, Category } from '../types';

export function exportToCSV(transactions: Transaction[], filename: string = 'hishab_khata_transactions.csv') {
  const headers = ['Transaction ID', 'Date', 'Type', 'Amount', 'Currency', 'Category', 'Description', 'Notes'];
  const rows = transactions.map(t => [
    t.id,
    t.date,
    t.type.toUpperCase(),
    t.amount,
    t.currency,
    t.categoryId,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(
  transactions: Transaction[],
  wallets: Wallet[],
  filename: string = 'Hishab_Khata_Financial_Report.xlsx'
) {
  const wb = XLSX.utils.book_new();

  // Transactions Sheet
  const txData = transactions.map(t => ({
    'Transaction ID': t.id,
    'Date': t.date,
    'Type': t.type.toUpperCase(),
    'Amount': t.amount,
    'Currency': t.currency,
    'Category': t.categoryId,
    'Description': t.description,
    'Notes': t.note || '',
  }));
  const wsTx = XLSX.utils.json_to_sheet(txData);
  XLSX.utils.book_append_sheet(wb, wsTx, 'Transactions');

  // Wallets Sheet
  const walletData = wallets.map(w => ({
    'Wallet Name': w.name,
    'Type': w.type.toUpperCase(),
    'Balance': w.balance,
    'Currency': w.currency,
    'Account Number': w.accountNumber || 'N/A',
  }));
  const wsWallets = XLSX.utils.json_to_sheet(walletData);
  XLSX.utils.book_append_sheet(wb, wsWallets, 'Wallets & Accounts');

  XLSX.writeFile(wb, filename);
}

export function exportToPDF(
  transactions: Transaction[],
  summary: { totalIncome: number; totalExpense: number; netSavings: number; currency: string; userName: string },
  filename: string = 'Hishab_Khata_Statement.pdf'
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 118, 110); // Teal #0F766E
  doc.rect(0, 0, pageWidth, 35, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('HISHAB KHATA', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Global Smart Personal Finance Statement', 14, 26);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - 14, 26, { align: 'right' });

  // User & Summary Box
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Statement for: ${summary.userName}`, 14, 45);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 50, pageWidth - 28, 25, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL INCOME', 20, 58);
  doc.text('TOTAL EXPENSES', 80, 58);
  doc.text('NET CASHFLOW', 140, 58);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Green
  doc.text(`${summary.currency} ${summary.totalIncome.toLocaleString()}`, 20, 68);

  doc.setTextColor(239, 68, 68); // Red
  doc.text(`${summary.currency} ${summary.totalExpense.toLocaleString()}`, 80, 68);

  doc.setTextColor(15, 118, 110); // Teal
  doc.text(`${summary.currency} ${summary.netSavings.toLocaleString()}`, 140, 68);

  // Table Header
  let y = 88;
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Recent Transactions Ledger', 14, y);

  y += 6;
  doc.setFillColor(226, 232, 240);
  doc.rect(14, y, pageWidth - 28, 8, 'F');

  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('DATE', 18, y + 5.5);
  doc.text('TYPE', 45, y + 5.5);
  doc.text('DESCRIPTION', 75, y + 5.5);
  doc.text('AMOUNT', pageWidth - 20, y + 5.5, { align: 'right' });

  y += 8;
  doc.setFont('helvetica', 'normal');

  const rows = transactions.slice(0, 22);
  rows.forEach((t, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y, pageWidth - 28, 7, 'F');
    }

    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(t.date, 18, y + 5);

    const typeColor = t.type === 'income' ? [16, 185, 129] : t.type === 'expense' ? [239, 68, 68] : [59, 130, 246];
    doc.setTextColor(typeColor[0], typeColor[1], typeColor[2]);
    doc.text(t.type.toUpperCase(), 45, y + 5);

    doc.setTextColor(15, 23, 42);
    const desc = t.description.length > 35 ? t.description.substring(0, 32) + '...' : t.description;
    doc.text(desc, 75, y + 5);

    doc.setFont('helvetica', 'bold');
    const prefix = t.type === 'income' ? '+' : t.type === 'expense' ? '-' : '';
    doc.text(`${prefix}${summary.currency} ${t.amount.toLocaleString()}`, pageWidth - 20, y + 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 7;
  });

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Confidential Document • Generated by Hishab Khata SaaS (https://hishabkhata.com)', pageWidth / 2, 285, { align: 'center' });

  doc.save(filename);
}
