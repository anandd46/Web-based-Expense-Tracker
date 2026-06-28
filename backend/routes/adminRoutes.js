const express = require('express');
const router = express.Router();
const { getUsers, getSystemStats, deleteUser } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/users', protect, adminOnly, getUsers);
router.get('/stats', protect, adminOnly, getSystemStats);
router.delete('/users/:id', protect, adminOnly, deleteUser);

module.exports = router;
