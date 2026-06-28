/* ==========================================================================
   SmartExpense Pro - Income Management JS Operations
   ========================================================================== */

let currentIncomeId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;

  loadIncomes();

  const incomeForm = document.getElementById('income-form');
  if (incomeForm) {
    incomeForm.addEventListener('submit', handleIncomeSubmit);
  }

  // Filters
  const searchInput = document.getElementById('search-input');
  const startDateInput = document.getElementById('start-date');
  const endDateInput = document.getElementById('end-date');
  const applyFiltersBtn = document.getElementById('apply-filters-btn');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', loadIncomes);
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (startDateInput) startDateInput.value = '';
      if (endDateInput) endDateInput.value = '';
      loadIncomes();
    });
  }

  // Modal setup
  const openModalBtn = document.getElementById('open-income-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const modal = document.getElementById('income-modal');

  if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', () => {
      currentIncomeId = null;
      document.getElementById('modal-title').textContent = 'Add Income';
      if (incomeForm) incomeForm.reset();
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('income-date').value = today;
      modal.classList.add('active');
    });
  }

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }
});

// Load Income Records
async function loadIncomes() {
  const tbody = document.getElementById('income-tbody');
  const totalAmountEl = document.getElementById('income-total-amount');

  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Loading income records...</td></tr>`;
  }

  const search = document.getElementById('search-input')?.value.trim() || '';
  const startDate = document.getElementById('start-date')?.value || '';
  const endDate = document.getElementById('end-date')?.value || '';

  let queryString = `?search=${encodeURIComponent(search)}`;
  if (startDate) queryString += `&startDate=${startDate}`;
  if (endDate) queryString += `&endDate=${endDate}`;

  try {
    const response = await api.get(`/income${queryString}`);
    const incomes = response.data || [];

    if (totalAmountEl) {
      totalAmountEl.textContent = `₹${response.totalAmount.toFixed(2)}`;
    }

    if (!tbody) return;
    tbody.innerHTML = '';

    if (incomes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No income records logged.</td></tr>`;
      return;
    }

    incomes.forEach((inc) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${escapeHTML(inc.source)}</strong></td>
        <td>₹${inc.amount.toFixed(2)}</td>
        <td>${new Date(inc.date).toLocaleDateString()}</td>
        <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHTML(inc.description || '-')}</span></td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" onclick="openEditModal('${inc._id}')" title="Edit">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="action-btn delete" onclick="deleteIncome('${inc._id}')" title="Delete">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    showToast('Failed to load income list', 'error');
    console.error(error);
  }
}

// Submit Handlers
async function handleIncomeSubmit(e) {
  e.preventDefault();

  const source = document.getElementById('income-source').value.trim();
  const amount = parseFloat(document.getElementById('income-amount').value);
  const date = document.getElementById('income-date').value;
  const description = document.getElementById('income-desc').value.trim();

  if (!source || isNaN(amount) || amount <= 0) {
    return showToast('Please enter all required valid parameters', 'error');
  }

  const payload = { source, amount, date, description };

  try {
    if (currentIncomeId) {
      await api.put(`/income/${currentIncomeId}`, payload);
      showToast('Income record updated', 'success');
    } else {
      await api.post('/income', payload);
      showToast('Income record added', 'success');
    }

    document.getElementById('income-modal').classList.remove('active');
    loadIncomes();
  } catch (error) {
    showToast(error.message || 'Operation failed', 'error');
  }
}

// Edit Modal
async function openEditModal(id) {
  try {
    const response = await api.get(`/income/${id}`);
    const inc = response.data;

    currentIncomeId = id;
    document.getElementById('modal-title').textContent = 'Edit Income';

    document.getElementById('income-source').value = inc.source;
    document.getElementById('income-amount').value = inc.amount;
    document.getElementById('income-date').value = inc.date.split('T')[0];
    document.getElementById('income-desc').value = inc.description || '';

    document.getElementById('income-modal').classList.add('active');
  } catch (error) {
    showToast('Failed to retrieve income data', 'error');
  }
}

// Delete
async function deleteIncome(id) {
  if (!confirm('Are you sure you want to delete this income record?')) return;

  try {
    await api.delete(`/income/${id}`);
    showToast('Income record deleted successfully', 'success');
    loadIncomes();
  } catch (error) {
    showToast('Failed to delete income record', 'error');
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
