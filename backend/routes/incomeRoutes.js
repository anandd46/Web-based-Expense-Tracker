const express = require('express');
const router = express.Router();
const {
  getIncomes,
  getIncomeById,
  addIncome,
  updateIncome,
  deleteIncome,
} = require('../controllers/incomeController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getIncomes)
  .post(protect, addIncome);

router.route('/:id')
  .get(protect, getIncomeById)
  .put(protect, updateIncome)
  .delete(protect, deleteIncome);

module.exports = router;
