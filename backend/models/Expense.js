const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please add an expense title'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please add a positive amount'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  category: {
    type: String,
    required: [true, 'Please specify a category'],
    enum: [
      'Food',
      'Travel',
      'Shopping',
      'Education',
      'Bills',
      'Medical',
      'Entertainment',
      'Investment',
      'Other',
    ],
  },
  date: {
    type: Date,
    required: [true, 'Please select a date'],
    default: Date.now,
  },
  paymentMethod: {
    type: String,
    required: [true, 'Please specify a payment method'],
    enum: ['Cash', 'Card', 'UPI', 'Net Banking', 'Other'],
    default: 'UPI',
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes cannot be more than 300 characters'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Expense', ExpenseSchema);
