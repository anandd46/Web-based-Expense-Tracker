const Income = require('../models/Income');

// @desc    Get all income records for logged in user (with optional sorting/date range)
// @route   GET /api/income
// @access  Private
const getIncomes = async (req, res, next) => {
  try {
    const query = { userId: req.user.id };

    if (req.query.search) {
      query.$or = [
        { source: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        const end = new Date(req.query.endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const incomes = await Income.find(query).sort({ date: -1 });
    const totalAmount = incomes.reduce((acc, curr) => acc + curr.amount, 0);

    res.json({
      success: true,
      count: incomes.length,
      totalAmount,
      data: incomes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single income details
// @route   GET /api/income/:id
// @access  Private
const getIncomeById = async (req, res, next) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, userId: req.user.id });

    if (!income) {
      return res.status(404).json({ success: false, message: 'Income record not found' });
    }

    res.json({
      success: true,
      data: income,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new income record
// @route   POST /api/income
// @access  Private
const addIncome = async (req, res, next) => {
  try {
    const { source, amount, date, description } = req.body;

    const income = await Income.create({
      userId: req.user.id,
      source,
      amount,
      date: date || undefined,
      description,
    });

    res.status(201).json({
      success: true,
      data: income,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an income record
// @route   PUT /api/income/:id
// @access  Private
const updateIncome = async (req, res, next) => {
  try {
    let income = await Income.findOne({ _id: req.params.id, userId: req.user.id });

    if (!income) {
      return res.status(404).json({ success: false, message: 'Income record not found or unauthorized' });
    }

    income = await Income.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: income,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an income record
// @route   DELETE /api/income/:id
// @access  Private
const deleteIncome = async (req, res, next) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, userId: req.user.id });

    if (!income) {
      return res.status(404).json({ success: false, message: 'Income record not found or unauthorized' });
    }

    await Income.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Income record deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getIncomes,
  getIncomeById,
  addIncome,
  updateIncome,
  deleteIncome,
};
