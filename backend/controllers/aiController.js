const Expense = require('../models/Expense');
const Income = require('../models/Income');

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:5001';

// Helper to make POST request to Python microservice
const callPythonAI = async (endpoint, payload) => {
  try {
    const response = await fetch(`${PYTHON_AI_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`AI service returned status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`AI Microservice Communication Error on ${endpoint}:`, error.message);
    throw new Error('AI service is temporarily unavailable. Check if the Python AI service is running.');
  }
};

// @desc    Predict expense category based on title/description text
// @route   POST /api/ai/predict-category
// @access  Private
const predictCategory = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Please provide text for classification' });
    }

    const result = await callPythonAI('/predict-category', { text });
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Perform spending analysis comparing current and previous month
// @route   GET /api/ai/spending-analysis
// @access  Private
const getSpendingAnalysis = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get current and previous month date boundaries
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Fetch expenses for current month
    const currentExpenses = await Expense.find({
      userId,
      date: { $gte: currentMonthStart, $lte: now },
    });

    // Fetch expenses for previous month
    const previousExpenses = await Expense.find({
      userId,
      date: { $gte: previousMonthStart, $lte: previousMonthEnd },
    });

    // Format data into structure expected by Python
    const formatExpenses = (expensesList) => {
      const summary = {};
      expensesList.forEach(e => {
        summary[e.category] = (summary[e.category] || 0) + e.amount;
      });
      return summary;
    };

    const payload = {
      current_month: formatExpenses(currentExpenses),
      previous_month: formatExpenses(previousExpenses),
    };

    const result = await callPythonAI('/spending-analysis', payload);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Predict next month's spending based on historical database records
// @route   GET /api/ai/predict-budget
// @access  Private
const predictBudget = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Retrieve monthly aggregates for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const history = await Expense.aggregate([
      {
        $match: {
          userId: new require('mongoose').Types.ObjectId(userId),
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Format list of historical totals: e.g. [1200, 1500, 1340, 1600]
    const monthlyTotals = history.map(item => item.total);

    // Fallback if there is not enough history
    if (monthlyTotals.length < 2) {
      // Just take the sum of current month or default 0
      const currentExpenses = await Expense.find({
        userId,
        date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      });
      const totalCur = currentExpenses.reduce((acc, c) => acc + c.amount, 0);
      monthlyTotals.push(totalCur || 500); // Default placeholder seed if empty
    }

    const result = await callPythonAI('/budget-prediction', { history: monthlyTotals });
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get smart personalized suggestions based on balance sheets
// @route   GET /api/ai/suggestions
// @access  Private
const getSuggestions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch income for this month
    const currentIncome = await Income.find({
      userId,
      date: { $gte: currentMonthStart }
    });
    const totalIncome = currentIncome.reduce((acc, c) => acc + c.amount, 0);

    // Fetch expenses for this month
    const currentExpenses = await Expense.find({
      userId,
      date: { $gte: currentMonthStart }
    });
    const totalExpenses = currentExpenses.reduce((acc, c) => acc + c.amount, 0);

    // Breakdown category-wise
    const categories = {};
    currentExpenses.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + e.amount;
    });

    const payload = {
      income: totalIncome,
      total_expenses: totalExpenses,
      categories: categories,
      savings_goal: totalIncome * 0.2, // standard 20% savings rule
    };

    const result = await callPythonAI('/suggestions', payload);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  predictCategory,
  getSpendingAnalysis,
  predictBudget,
  getSuggestions,
};
