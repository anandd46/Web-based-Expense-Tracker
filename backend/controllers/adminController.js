const User = require('../models/User');
const Expense = require('../models/Expense');
const Income = require('../models/Income');

// @desc    Get all users (Admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system statistics (Admin only)
// @route   GET /api/admin/stats
// @access  Private/Admin
const getSystemStats = async (req, res, next) => {
  try {
    const userCount = await User.countDocuments({});
    const adminCount = await User.countDocuments({ role: 'admin' });
    const standardUserCount = userCount - adminCount;

    const totalExpenseCount = await Expense.countDocuments({});
    const totalIncomeCount = await Income.countDocuments({});

    // Aggregate overall financial data in the system
    const totalExpensesAgg = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalIncomeAgg = await Income.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalSystemExpenses = totalExpensesAgg[0] ? totalExpensesAgg[0].total : 0;
    const totalSystemIncome = totalIncomeAgg[0] ? totalIncomeAgg[0].total : 0;

    // Category distribution overall
    const categoryDistribution = await Expense.aggregate([
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: userCount,
          admins: adminCount,
          regular: standardUserCount,
        },
        transactions: {
          expensesCount: totalExpenseCount,
          incomeCount: totalIncomeCount,
          totalExpenses: totalSystemExpenses,
          totalIncome: totalSystemIncome,
          averageExpense: totalExpenseCount > 0 ? (totalSystemExpenses / totalExpenseCount) : 0,
        },
        categoryDistribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user (Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting self
    if (user._id.toString() === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete own administrator account' });
    }

    // Delete user's expenses and income data
    await Expense.deleteMany({ userId: user._id });
    await Income.deleteMany({ userId: user._id });
    
    // Delete user
    await User.deleteOne({ _id: user._id });

    res.json({
      success: true,
      message: 'User and all associated data deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getSystemStats,
  deleteUser,
};
