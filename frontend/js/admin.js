/* ==========================================================================
   SmartExpense Pro - Administration Operations
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;
  
  // Verify administrator role before fetching admin specific views
  const user = JSON.parse(localStorage.getItem('smartexpense_user'));
  if (!user || user.role !== 'admin') {
    showToast('Unauthorized access. Redirecting...', 'error');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 2000);
    return;
  }

  loadAdminDashboard();
});

async function loadAdminDashboard() {
  await loadSystemStats();
  await loadUserList();
}

async function loadSystemStats() {
  try {
    const response = await api.get('/admin/stats');
    const stats = response.data;

    // Update Overall Stats Cards in DOM
    document.getElementById('sys-total-users').textContent = stats.users.total;
    document.getElementById('sys-admins').textContent = stats.users.admins;
    document.getElementById('sys-regular-users').textContent = stats.users.regular;
    
    document.getElementById('sys-total-expenses').textContent = `₹${stats.transactions.totalExpenses.toFixed(2)}`;
    document.getElementById('sys-total-income').textContent = `₹${stats.transactions.totalIncome.toFixed(2)}`;
    document.getElementById('sys-avg-expense').textContent = `₹${stats.transactions.averageExpense.toFixed(2)}`;

    // Populate category overall platform distribution
    const distBody = document.getElementById('sys-distribution-tbody');
    if (distBody) {
      distBody.innerHTML = '';
      const dist = stats.categoryDistribution || [];
      
      if (dist.length === 0) {
        distBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-secondary);">No ledger records in system.</td></tr>`;
      } else {
        dist.forEach(item => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><strong>${escapeHTML(item._id)}</strong></td>
            <td>${item.count}</td>
            <td>₹${item.total.toFixed(2)}</td>
          `;
          distBody.appendChild(row);
        });
      }
    }
  } catch (error) {
    showToast('Failed to retrieve system analytics', 'error');
    console.error(error);
  }
}

async function loadUserList() {
  const tbody = document.getElementById('users-list-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Loading users registry...</td></tr>`;

  try {
    const response = await api.get('/admin/users');
    const users = response.data || [];

    tbody.innerHTML = '';

    if (users.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No users registered.</td></tr>`;
      return;
    }

    users.forEach(u => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${escapeHTML(u.name)}</strong></td>
        <td>${escapeHTML(u.email)}</td>
        <td><span class="badge ${u.role === 'admin' ? 'food' : 'other'}">${u.role.toUpperCase()}</span></td>
        <td>${new Date(u.createdAt).toLocaleDateString()}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn delete" onclick="deleteRegisteredUser('${u._id}', '${escapeHTML(u.name)}')" title="Delete User">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    showToast('Failed to load users list', 'error');
    console.error(error);
  }
}

// Delete user account globally
async function deleteRegisteredUser(id, name) {
  if (!confirm(`CAUTION: Are you sure you want to delete user "${name}"?\nThis will permanently delete this user, all their expense data, and all their income records from the database.`)) {
    return;
  }

  try {
    await api.delete(`/admin/users/${id}`);
    showToast(`User "${name}" deleted successfully`, 'success');
    loadAdminDashboard();
  } catch (error) {
    showToast(error.message || 'Failed to delete user account', 'error');
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
