const Expense = require('../models/Expense');

// @desc    Get all expenses for logged in user (with search, filter, sorting)
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
  try {
    const query = { userId: req.user.id };

    // Search filter (searches title or notes)
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { notes: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    // Category filter
    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }

    // Payment Method filter
    if (req.query.paymentMethod && req.query.paymentMethod !== 'All') {
      query.paymentMethod = req.query.paymentMethod;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        // Extend to end of that day (23:59:59)
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    // Run query sorted by date descending (newest first)
    const expenses = await Expense.find(query).sort({ date: -1 });

    // Calculate sum of these filtered expenses
    const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    res.json({
      success: true,
      count: expenses.length,
      totalAmount,
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense details
// @route   GET /api/expenses/:id
// @access  Private
const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new expense
// @route   POST /api/expenses
// @access  Private
const addExpense = async (req, res, next) => {
  try {
    const { title, amount, category, date, paymentMethod, notes } = req.body;

    const expense = await Expense.create({
      userId: req.user.id,
      title,
      amount,
      category,
      date: date || undefined,
      paymentMethod,
      notes,
    });

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
const updateExpense = async (req, res, next) => {
  try {
    let expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found or unauthorized' });
    }

    expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found or unauthorized' });
    }

    await Expense.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  addExpense,
  updateExpense,
  deleteExpense,
};
