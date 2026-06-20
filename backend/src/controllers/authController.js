const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'odooposhackathonsecretkey';
const SALT_ROUNDS = 10;

// ─── POST /auth/signup ────────────────────────────────────────────────────────
const signup = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Input validation
  if (!name || !name.trim())
    return res.status(400).json({ error: 'Name is required.' });

  if (!email || !email.trim())
    return res.status(400).json({ error: 'Email is required.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim()))
    return res.status(400).json({ error: 'Please provide a valid email address.' });

  if (!password || password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });

  const validRoles = ['ADMIN', 'EMPLOYEE', 'CUSTOMER', 'KITCHEN_EMPLOYEE'];
  if (!role || !validRoles.includes(role.toUpperCase()))
    return res.status(400).json({ error: 'Role must be ADMIN, EMPLOYEE, CUSTOMER, or KITCHEN_EMPLOYEE.' });

  try {
    // Check for duplicate email (case-insensitive)
    const existing = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'An account with this email already exists.' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Insert into users table
    const inserted = await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name.trim(), email.trim().toLowerCase(), hashedPassword, role.toUpperCase()]
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: inserted.rows[0],
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /auth/login ─────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !email.trim())
    return res.status(400).json({ error: 'Email is required.' });
  if (!password)
    return res.status(400).json({ error: 'Password is required.' });

  try {
    // Lookup user by email (case-insensitive)
    const result = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Invalid email or password.' });

    const user = result.rows[0];

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: 'Invalid email or password.' });

    // Sign JWT
    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /auth/me ─────────────────────────────────────────────────────────────
// Verifies JWT and returns current user profile (used for session restore).
const getMe = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'User account not found.' });

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, getMe };
