const express = require('express');
const router = express.Router();
const { signup, login, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected — requires valid JWT (used for auto session restore)
router.get('/me', authenticate, getMe);

module.exports = router;
