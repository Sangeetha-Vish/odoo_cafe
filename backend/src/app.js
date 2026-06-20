const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

// Base route for checking API status
app.get('/api/status', (req, res) => {
  res.json({ status: 'OK', message: 'Odoo POS API is running smoothly' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
