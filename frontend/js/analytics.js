/* ==========================================================================
   SmartExpense Pro - Data Analytics & Charts
   ========================================================================== */

let pieChart, barChart, lineChart, doughnutChart;

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;
  await renderAnalytics();
});

async function renderAnalytics() {
  try {
    const [expensesRes, incomesRes] = await Promise.all([
      api.get('/expenses'),
      api.get('/income')
    ]);

    const expenses = expensesRes.data || [];
    const incomes = incomesRes.data || [];

    // Helper: Reset canvas to clear previous instances
    const destroyCharts = () => {
      if (pieChart) pieChart.destroy();
      if (barChart) barChart.destroy();
      if (lineChart) lineChart.destroy();
      if (doughnutChart) doughnutChart.destroy();
    };
    destroyCharts();

    // -------------------------------------------------------------
    // Chart 1: Pie Chart (Category-wise spending)
    // -------------------------------------------------------------
    const categories = ['Food', 'Travel', 'Shopping', 'Education', 'Bills', 'Medical', 'Entertainment', 'Investment', 'Other'];
    const categoryColors = {
      Food: '#f59e0b',
      Travel: '#3b82f6',
      Shopping: '#ec4899',
      Education: '#8b5cf6',
      Bills: '#ef4444',
      Medical: '#10b981',
      Entertainment: '#06b6d4',
      Investment: '#0ea5e9',
      Other: '#71717a'
    };

    const categorySums = {};
    categories.forEach(c => categorySums[c] = 0);
    expenses.forEach(e => {
      if (categorySums[e.category] !== undefined) {
        categorySums[e.category] += e.amount;
      } else {
        categorySums['Other'] += e.amount;
      }
    });

    const pieCtx = document.getElementById('pieChart')?.getContext('2d');
    if (pieCtx) {
      pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
          labels: categories.filter(c => categorySums[c] > 0),
          datasets: [{
            data: categories.filter(c => categorySums[c] > 0).map(c => categorySums[c]),
            backgroundColor: categories.filter(c => categorySums[c] > 0).map(c => categoryColors[c]),
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: 'var(--text-secondary)' }
            }
          }
        }
      });
    }

    // -------------------------------------------------------------
    // Chart 2: Bar Chart (Monthly Income vs Expense)
    // -------------------------------------------------------------
    // Group records by month (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push({
        year: d.getFullYear(),
        month: d.getMonth(),
        label: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`,
        income: 0,
        expense: 0
      });
    }

    // Populate months data
    expenses.forEach(exp => {
      const expDate = new Date(exp.date);
      const mIdx = last6Months.findIndex(m => m.year === expDate.getFullYear() && m.month === expDate.getMonth());
      if (mIdx !== -1) {
        last6Months[mIdx].expense += exp.amount;
      }
    });

    incomes.forEach(inc => {
      const incDate = new Date(inc.date);
      const mIdx = last6Months.findIndex(m => m.year === incDate.getFullYear() && m.month === incDate.getMonth());
      if (mIdx !== -1) {
        last6Months[mIdx].income += inc.amount;
      }
    });

    const barCtx = document.getElementById('barChart')?.getContext('2d');
    if (barCtx) {
      barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: last6Months.map(m => m.label),
          datasets: [
            {
              label: 'Income',
              data: last6Months.map(m => m.income),
              backgroundColor: 'rgba(16, 185, 129, 0.75)',
              borderColor: 'var(--success)',
              borderWidth: 1,
              borderRadius: 6
            },
            {
              label: 'Expense',
              data: last6Months.map(m => m.expense),
              backgroundColor: 'rgba(239, 68, 68, 0.75)',
              borderColor: 'var(--danger)',
              borderWidth: 1,
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--text-secondary)' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--text-secondary)' } }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: 'var(--text-secondary)' }
            }
          }
        }
      });
    }

    // -------------------------------------------------------------
    // Chart 3: Line Chart (Savings Growth Trajectory)
    // -------------------------------------------------------------
    let cumulativeSavings = 0;
    const savingsGrowth = last6Months.map(m => {
      const monthlySavings = m.income - m.expense;
      cumulativeSavings += monthlySavings;
      return cumulativeSavings;
    });

    const lineCtx = document.getElementById('lineChart')?.getContext('2d');
    if (lineCtx) {
      lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: last6Months.map(m => m.label),
          datasets: [{
            label: 'Cumulative Net Worth (Savings)',
            data: savingsGrowth,
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointBackgroundColor: '#06b6d4'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--text-secondary)' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--text-secondary)' } }
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: 'var(--text-secondary)' }
            }
          }
        }
      });
    }

    // -------------------------------------------------------------
    // Chart 4: Doughnut Chart (Budget Allocation Tracker)
    // -------------------------------------------------------------
    const currentMonthExpenses = last6Months[5] ? last6Months[5].expense : 0;
    const currentMonthIncome = last6Months[5] ? last6Months[5].income : 0;
    const currentBudgetTarget = currentMonthIncome > 0 ? (currentMonthIncome * 0.7) : 3000;
    const budgetRemaining = Math.max(currentBudgetTarget - currentMonthExpenses, 0);

    const doughnutCtx = document.getElementById('doughnutChart')?.getContext('2d');
    if (doughnutCtx) {
      doughnutChart = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
          labels: ['Spent', 'Remaining'],
          datasets: [{
            data: [currentMonthExpenses, budgetRemaining],
            backgroundColor: ['rgba(239, 68, 68, 0.75)', 'rgba(59, 130, 246, 0.75)'],
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: 'var(--text-secondary)' }
            }
          }
        }
      });
    }

  } catch (error) {
    showToast('Failed to compile analytics charts data', 'error');
    console.error(error);
  }
}
