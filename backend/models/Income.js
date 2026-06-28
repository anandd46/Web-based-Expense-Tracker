const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  source: {
    type: String,
    required: [true, 'Please add an income source'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Please add a positive amount'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  date: {
    type: Date,
    required: [true, 'Please select a date'],
    default: Date.now,
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description cannot be more than 300 characters'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Income', IncomeSchema);
