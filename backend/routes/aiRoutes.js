const express = require('express');
const router = express.Router();
const {
  predictCategory,
  getSpendingAnalysis,
  predictBudget,
  getSuggestions,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/predict-category', protect, predictCategory);
router.get('/spending-analysis', protect, getSpendingAnalysis);
router.get('/predict-budget', protect, predictBudget);
router.get('/suggestions', protect, getSuggestions);

module.exports = router;
