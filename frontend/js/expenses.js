/* ==========================================================================
   SmartExpense Pro - Expense Management JS Operations
   ========================================================================== */

let currentExpenseId = null; // Tracks if we are editing an expense

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;

  // Initial fetch of expenses list
  loadExpenses();

  // Setup form submission for Add/Edit
  const expenseForm = document.getElementById('expense-form');
  if (expenseForm) {
    expenseForm.addEventListener('submit', handleExpenseSubmit);
  }

  // Setup Search and Filter triggers
  const searchInput = document.getElementById('search-input');
  const categoryFilter = document.getElementById('category-filter');
  const paymentFilter = document.getElementById('payment-filter');
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  const applyFiltersBtn = document.getElementById('apply-filters-btn');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', loadExpenses);
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (categoryFilter) categoryFilter.value = 'All';
      if (paymentFilter) paymentFilter.value = 'All';
      if (startDateInput) startDateInput.value = '';
      if (endDateInput) endDateInput.value = '';
      loadExpenses();
    });
  }

  // Setup AI Category prediction on button click
  const aiAutofillBtn = document.getElementById('ai-autofill-btn');
  if (aiAutofillBtn) {
    aiAutofillBtn.addEventListener('click', triggerAICategoryPrediction);
  }

  // Modal setup
  const openModalBtn = document.getElementById('open-expense-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modal = document.getElementById('expense-modal');

  if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', () => {
      currentExpenseId = null;
      document.getElementById('modal-title').textContent = 'Add Expense';
      if (expenseForm) expenseForm.reset();
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('expense-date').value = today;
      modal.classList.add('active');
    });
  }

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }
});

// Load and Render Expenses
async function loadExpenses() {
  const tbody = document.getElementById('expenses-tbody');
  const totalAmountEl = document.getElementById('expenses-total-amount');

  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Loading expenses...</td></tr>`;
  }

  // Build query string based on UI filters
  const search = document.getElementById('search-input')?.value.trim() || '';
  const category = document.getElementById('category-filter')?.value || 'All';
  const paymentMethod = document.getElementById('payment-filter')?.value || 'All';
  const startDate = document.getElementById('start-date')?.value || '';
  const endDate = document.getElementById('end-date')?.value || '';

  let queryString = `?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}&paymentMethod=${encodeURIComponent(paymentMethod)}`;
  if (startDate) queryString += `&startDate=${startDate}`;
  if (endDate) queryString += `&endDate=${endDate}`;

  try {
    const response = await api.get(`/expenses${queryString}`);
    const expenses = response.data || [];
    
    if (totalAmountEl) {
      totalAmountEl.textContent = `₹${response.totalAmount.toFixed(2)}`;
    }

    if (!tbody) return;
    tbody.innerHTML = '';

    if (expenses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">No matching expenses found.</td></tr>`;
      return;
    }

    expenses.forEach((exp) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${escapeHTML(exp.title)}</strong></td>
        <td><span class="badge ${exp.category.toLowerCase()}">${exp.category}</span></td>
        <td>₹${exp.amount.toFixed(2)}</td>
        <td>${new Date(exp.date).toLocaleDateString()}</td>
        <td>${escapeHTML(exp.paymentMethod)}</td>
        <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHTML(exp.notes || '-')}</span></td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" onclick="openEditModal('${exp._id}')" title="Edit">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="action-btn delete" onclick="deleteExpense('${exp._id}')" title="Delete">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    showToast('Failed to load expenses list', 'error');
    console.error(error);
  }
}

// Handle Form Submission (Add/Edit)
async function handleExpenseSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('expense-title').value.trim();
  const amount = parseFloat(document.getElementById('expense-amount').value);
  const category = document.getElementById('expense-category').value;
  const date = document.getElementById('expense-date').value;
  const paymentMethod = document.getElementById('expense-payment').value;
  const notes = document.getElementById('expense-notes').value.trim();

  if (!title || isNaN(amount) || amount <= 0 || !category || !paymentMethod) {
    return showToast('Please enter all required valid parameters', 'error');
  }

  const payload = { title, amount, category, date, paymentMethod, notes };

  try {
    if (currentExpenseId) {
      // Update
      await api.put(`/expenses/${currentExpenseId}`, payload);
      showToast('Expense updated successfully', 'success');
    } else {
      // Create
      await api.post('/expenses', payload);
      showToast('Expense added successfully', 'success');
    }

    // Hide Modal & reload
    document.getElementById('expense-modal').classList.remove('active');
    loadExpenses();
  } catch (error) {
    showToast(error.message || 'Operation failed', 'error');
  }
}

// Open Edit modal populated with existing record data
async function openEditModal(id) {
  try {
    const response = await api.get(`/expenses/${id}`);
    const exp = response.data;
    
    currentExpenseId = id;
    document.getElementById('modal-title').textContent = 'Edit Expense';
    
    document.getElementById('expense-title').value = exp.title;
    document.getElementById('expense-amount').value = exp.amount;
    document.getElementById('expense-category').value = exp.category;
    document.getElementById('expense-date').value = exp.date.split('T')[0];
    document.getElementById('expense-payment').value = exp.paymentMethod;
    document.getElementById('expense-notes').value = exp.notes || '';

    // Show modal
    document.getElementById('expense-modal').classList.add('active');
  } catch (error) {
    showToast('Failed to retrieve expense data', 'error');
  }
}

// Delete expense
async function deleteExpense(id) {
  if (!confirm('Are you sure you want to delete this expense record?')) return;

  try {
    await api.delete(`/expenses/${id}`);
    showToast('Expense deleted successfully', 'success');
    loadExpenses();
  } catch (error) {
    showToast('Failed to delete expense', 'error');
  }
}

// AI Category Autofill
async function triggerAICategoryPrediction() {
  const titleField = document.getElementById('expense-title');
  const amountField = document.getElementById('expense-amount');
  const catSelect = document.getElementById('expense-category');

  const textVal = titleField.value.trim();
  const amtVal = amountField.value.trim();

  if (!textVal) {
    return showToast('Please enter an expense title first (e.g., "McDonalds")', 'info');
  }

  // Construct text for classifier: e.g. "McDonalds 450"
  const textInput = textVal + (amtVal ? ` ${amtVal}` : '');

  try {
    showToast('AI predicting category...', 'info');
    const response = await api.post('/ai/predict-category', { text: textInput });
    
    if (response.success && response.data && response.data.category) {
      const pred = response.data.category;
      const conf = response.data.confidence;
      
      // Match selector values
      catSelect.value = pred;
      showToast(`AI suggested: "${pred}" (Confidence: ${Math.round(conf * 100)}%)`, 'success');
    }
  } catch (error) {
    showToast('AI classification failed. Check Flask service status.', 'error');
  }
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
