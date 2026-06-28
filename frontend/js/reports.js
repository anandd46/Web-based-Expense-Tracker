/* ==========================================================================
   SmartExpense Pro - Reports & Exports (CSV and PDF Generation)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;

  const generateReportBtn = document.getElementById('generate-report-btn');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const exportPdfBtn = document.getElementById('export-pdf-btn');

  if (generateReportBtn) {
    generateReportBtn.addEventListener('click', loadReportSummary);
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportToCSV);
  }

  if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', exportToPDF);
  }

  // Load initial report summary on load
  loadReportSummary();
});

// Holds globally fetched report details for export
let reportData = {
  expenses: [],
  income: [],
  totals: {
    income: 0,
    expenses: 0,
    balance: 0
  }
};

async function loadReportSummary() {
  const tableBody = document.getElementById('report-summary-tbody');
  const loaderText = document.getElementById('report-loading-text');

  if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Retrieving data...</td></tr>`;
  if (loaderText) loaderText.style.display = 'block';

  // Get selected dates
  const startDate = document.getElementById('report-start-date')?.value || '';
  const endDate = document.getElementById('report-end-date')?.value || '';

  let dateQuery = '';
  if (startDate || endDate) {
    dateQuery = `?startDate=${startDate}&endDate=${endDate}`;
  }

  try {
    const [expensesRes, incomeRes] = await Promise.all([
      api.get(`/expenses${dateQuery}`),
      api.get(`/income${dateQuery}`)
    ]);

    reportData.expenses = expensesRes.data || [];
    reportData.income = incomeRes.data || [];
    
    reportData.totals.expenses = responseSum(reportData.expenses);
    reportData.totals.income = responseSum(reportData.income);
    reportData.totals.balance = reportData.totals.income - reportData.totals.expenses;

    // Render numbers in UI
    document.getElementById('report-total-income').textContent = `₹${reportData.totals.income.toFixed(2)}`;
    document.getElementById('report-total-expenses').textContent = `₹${reportData.totals.expenses.toFixed(2)}`;
    document.getElementById('report-net-savings').textContent = `₹${(reportData.totals.balance > 0 ? reportData.totals.balance : 0).toFixed(2)}`;

    if (loaderText) loaderText.style.display = 'none';

    // Populate overall aggregated transaction list in report table
    if (tableBody) {
      tableBody.innerHTML = '';
      
      // Combine and sort transactions chronologically
      const allTransactions = [
        ...reportData.income.map(i => ({ ...i, type: 'Income', category: 'Income', title: i.source, key: 'source' })),
        ...reportData.expenses.map(e => ({ ...e, type: 'Expense', key: 'title' }))
      ];

      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      if (allTransactions.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No records found for the selected time range.</td></tr>`;
        return;
      }

      allTransactions.forEach(t => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><strong>${escapeHTML(t.type === 'Income' ? t.source : t.title)}</strong></td>
          <td><span class="badge ${t.type === 'Income' ? 'investment' : 'bills'}">${t.type}</span></td>
          <td><span class="badge ${t.category.toLowerCase()}">${t.category}</span></td>
          <td style="color: ${t.type === 'Income' ? 'var(--success)' : 'var(--danger)'}">
            ${t.type === 'Income' ? '+' : '-'}₹${t.amount.toFixed(2)}
          </td>
          <td>${new Date(t.date).toLocaleDateString()}</td>
        `;
        tableBody.appendChild(row);
      });
    }

  } catch (error) {
    showToast('Failed to generate report summary', 'error');
    console.error(error);
  }
}

// Export to CSV Function
function exportToCSV() {
  if (reportData.expenses.length === 0 && reportData.income.length === 0) {
    return showToast('No transaction records available to export', 'error');
  }

  const rows = [
    ['Transaction Type', 'Title/Source', 'Category', 'Amount (₹)', 'Date', 'Details/Notes']
  ];

  // Map income
  reportData.income.forEach(inc => {
    rows.push([
      'Income',
      inc.source,
      'Income',
      inc.amount,
      new Date(inc.date).toISOString().split('T')[0],
      inc.description || ''
    ]);
  });

  // Map expenses
  reportData.expenses.forEach(exp => {
    rows.push([
      'Expense',
      exp.title,
      exp.category,
      exp.amount,
      new Date(exp.date).toISOString().split('T')[0],
      exp.notes || ''
    ]);
  });

  // Convert array to CSV string
  const csvContent = "data:text/csv;charset=utf-8," 
    + rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  
  // Naming the file dynamically based on range
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute("download", `SmartExpense_Pro_Report_${dateStr}.csv`);
  document.body.appendChild(link); // Required for FF
  
  link.click();
  document.body.removeChild(link);
  showToast('CSV Report downloaded successfully', 'success');
}

// Export to PDF Function using jsPDF
function exportToPDF() {
  if (reportData.expenses.length === 0 && reportData.income.length === 0) {
    return showToast('No transaction records available to export', 'error');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  const user = JSON.parse(localStorage.getItem('smartexpense_user')) || { name: 'User', email: '' };

  // Theme header band
  doc.setFillColor(9, 9, 11); // Dark background
  doc.rect(0, 0, 210, 45, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('SmartExpense Pro', 15, 20);

  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.setTextColor(161, 161, 170);
  doc.text('AI Powered Personal Finance Management System', 15, 28);
  
  // Date generated
  const genDate = new Date().toLocaleString();
  doc.text(`Generated: ${genDate}`, 15, 36);

  // User details block
  doc.setTextColor(9, 9, 11);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('ACCOUNT SUMMARY', 15, 55);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Account Holder: ${user.name}`, 15, 62);
  doc.text(`Email Address: ${user.email}`, 15, 68);

  // Summary financial grid
  doc.setFillColor(241, 245, 249);
  doc.rect(15, 75, 180, 20, 'F');
  
  doc.setFont('Helvetica', 'bold');
  doc.text('Total Income', 25, 82);
  doc.text('Total Expenses', 85, 82);
  doc.text('Net Balance', 145, 82);

  doc.setFont('Helvetica', 'normal');
  doc.text(`Rs. ${reportData.totals.income.toFixed(2)}`, 25, 90);
  doc.text(`Rs. ${reportData.totals.expenses.toFixed(2)}`, 85, 90);
  doc.text(`Rs. ${reportData.totals.balance.toFixed(2)}`, 145, 90);

  // Transaction Ledger Table
  doc.setFont('Helvetica', 'bold');
  doc.text('TRANSACTION LEDGER', 15, 110);

  // Prepare data for autoTable grid
  const tableData = [];
  
  const allSorted = [
    ...reportData.income.map(i => ({ type: 'INCOME', title: i.source, cat: 'Income', amt: `+Rs. ${i.amount.toFixed(2)}`, date: new Date(i.date).toLocaleDateString() })),
    ...reportData.expenses.map(e => ({ type: 'EXPENSE', title: e.title, cat: e.category, amt: `-Rs. ${e.amount.toFixed(2)}`, date: new Date(e.date).toLocaleDateString() }))
  ];
  allSorted.sort((a, b) => new Date(b.date) - new Date(a.date));

  allSorted.forEach(t => {
    tableData.push([t.date, t.type, t.title, t.cat, t.amt]);
  });

  // Render Table
  doc.autoTable({
    startY: 115,
    head: [['Date', 'Type', 'Title/Source', 'Category', 'Amount']],
    body: tableData,
    headStyles: { fillColor: [59, 130, 246] }, // primary theme color
    theme: 'grid',
    styles: { fontSize: 9 },
    columnStyles: {
      4: { halign: 'right' }
    }
  });

  // Save the PDF
  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`SmartExpense_Statement_${dateStr}.pdf`);
  showToast('PDF Statement downloaded successfully', 'success');
}

// Utility sum helper
function responseSum(arr) {
  return arr.reduce((acc, c) => acc + c.amount, 0);
}

// Escape HTML utility
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
