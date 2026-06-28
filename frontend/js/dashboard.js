/* ==========================================================================
   SmartExpense Pro - Dashboard Operations
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;

  try {
    await loadDashboardData();
    await loadAIData();
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
});

async function loadDashboardData() {
  try {
    // 1. Fetch expenses and income parallelly
    const [expensesRes, incomeRes] = await Promise.all([
      api.get('/expenses'),
      api.get('/income')
    ]);

    const expenses = expensesRes.data || [];
    const incomes = incomeRes.data || [];

    // Calculate totals
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const currentBalance = totalIncome - totalExpenses;
    const savings = currentBalance > 0 ? currentBalance : 0;

    // Set Monthly Budget target (defaults to 70% of total income or $3000 as seed)
    const monthlyBudgetTarget = totalIncome > 0 ? Math.round(totalIncome * 0.7) : 3000;

    // Update Overall Stats Cards in DOM
    document.getElementById('total-income').textContent = `₹${totalIncome.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = `₹${totalExpenses.toFixed(2)}`;
    document.getElementById('current-balance').textContent = `₹${currentBalance.toFixed(2)}`;
    document.getElementById('savings').textContent = `₹${savings.toFixed(2)}`;
    document.getElementById('monthly-budget').textContent = `₹${monthlyBudgetTarget.toFixed(2)}`;

    // 2. Calculate Today's, Weekly, and Monthly spending cards
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let todaySpending = 0;
    let weeklySpending = 0;
    let monthlySpending = 0;
    const categoryTotals = {};

    expenses.forEach(exp => {
      const expDate = new Date(exp.date);
      
      // Accumulate cards
      if (expDate >= startOfToday) {
        todaySpending += exp.amount;
      }
      if (expDate >= startOfWeek) {
        weeklySpending += exp.amount;
      }
      if (expDate >= startOfMonth) {
        monthlySpending += exp.amount;
      }

      // Group for highest category
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    // Determine highest category
    let highestCat = 'N/A';
    let highestVal = 0;
    for (const [cat, val] of Object.entries(categoryTotals)) {
      if (val > highestVal) {
        highestVal = val;
        highestCat = cat;
      }
    }

    document.getElementById('today-spending').textContent = `₹${todaySpending.toFixed(2)}`;
    document.getElementById('weekly-spending').textContent = `₹${weeklySpending.toFixed(2)}`;
    document.getElementById('monthly-spending').textContent = `₹${monthlySpending.toFixed(2)}`;
    document.getElementById('highest-category').textContent = highestCat + (highestVal > 0 ? ` (₹${highestVal.toFixed(0)})` : '');

    // 3. Render recent transactions list (limit 5)
    const recentList = document.getElementById('recent-transactions-tbody');
    if (recentList) {
      recentList.innerHTML = '';
      const recentExpenses = expenses.slice(0, 5);

      if (recentExpenses.length === 0) {
        recentList.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">No recent expenses logged. Click "Add Expense" to start!</td></tr>`;
      } else {
        recentExpenses.forEach(exp => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td><strong>${escapeHTML(exp.title)}</strong></td>
            <td><span class="badge ${exp.category.toLowerCase()}">${exp.category}</span></td>
            <td>₹${exp.amount.toFixed(2)}</td>
            <td>${new Date(exp.date).toLocaleDateString()}</td>
            <td>${escapeHTML(exp.paymentMethod)}</td>
          `;
          recentList.appendChild(row);
        });
      }
    }

  } catch (error) {
    showToast('Failed to load dashboard metrics', 'error');
    console.error(error);
  }
}

async function loadAIData() {
  const suggestionsList = document.getElementById('ai-suggestions-list');
  const budgetPredictionDiv = document.getElementById('ai-budget-prediction');
  const spendingAnalysisDiv = document.getElementById('ai-spending-analysis');

  if (suggestionsList) suggestionsList.innerHTML = '<li>Analyzing your finances...</li>';
  if (budgetPredictionDiv) budgetPredictionDiv.innerHTML = 'Calculating trend lines...';
  if (spendingAnalysisDiv) spendingAnalysisDiv.innerHTML = 'Comparing months...';

  try {
    // 1. Load Suggestions
    try {
      const suggestRes = await api.get('/ai/suggestions');
      if (suggestionsList) {
        suggestionsList.innerHTML = '';
        const items = suggestRes.data.suggestions || [];
        if (items.length === 0) {
          suggestionsList.innerHTML = `<li class="ai-suggestion-item">Add more transactions to generate AI budgeting tips.</li>`;
        } else {
          items.forEach(tip => {
            const li = document.createElement('li');
            li.className = 'ai-suggestion-item';
            li.textContent = tip;
            suggestionsList.appendChild(li);
          });
        }
      }
    } catch (e) {
      if (suggestionsList) {
        suggestionsList.innerHTML = `<li class="ai-suggestion-item" style="color: var(--danger);">AI suggestions temporarily unavailable. Start Flask app.</li>`;
      }
    }

    // 2. Load Budget Prediction
    try {
      const budgetRes = await api.get('/ai/predict-budget');
      if (budgetPredictionDiv) {
        const amt = budgetRes.data.predicted_spending;
        const trend = budgetRes.data.trend;
        budgetPredictionDiv.innerHTML = `
          <strong>₹${amt.toFixed(2)}</strong> 
          <span style="font-size: 0.85rem; color: ${trend === 'upward' ? 'var(--danger)' : (trend === 'downward' ? 'var(--success)' : 'var(--text-secondary)')}">
            (${trend} trend)
          </span>
        `;
      }
    } catch (e) {
      if (budgetPredictionDiv) {
        budgetPredictionDiv.innerHTML = `<span style="color: var(--text-secondary); font-size: 0.9rem;">Forecast unavailable</span>`;
      }
    }

    // 3. Load Spending Analysis
    try {
      const analysisRes = await api.get('/ai/spending-analysis');
      if (spendingAnalysisDiv) {
        const text = analysisRes.data.analysis;
        const alert = analysisRes.data.alert;
        spendingAnalysisDiv.innerHTML = `
          <p style="font-size: 0.92rem; color: ${alert ? 'var(--danger)' : 'var(--text-secondary)'};">
            ${text}
          </p>
        `;
      }
    } catch (e) {
      if (spendingAnalysisDiv) {
        spendingAnalysisDiv.innerHTML = `<span style="color: var(--text-secondary); font-size: 0.9rem;">Analysis unavailable</span>`;
      }
    }

  } catch (error) {
    console.error('Error fetching AI data:', error.message);
  }
}

// Utility to escape HTML and prevent XSS on frontend
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
