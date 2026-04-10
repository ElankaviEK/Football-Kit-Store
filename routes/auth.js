const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const db = require('../config/database');
const { auditLog } = require('../middleware/logger');

// ── Security: Rate limit login attempts ──────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    auditLog('LOGIN_RATE_LIMITED', null, req.ip, req.body.email);
    res.status(429).render('auth/login', {
      title: 'Login',
      errors: [{ msg: 'Too many failed login attempts. Please wait 15 minutes.' }],
      old: {}
    });
  }
});

// ── GET /auth/login ──────────────────────────────────────────────────────────
router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/login', { title: 'Login', errors: [], old: {} });
});

// ── POST /auth/login ─────────────────────────────────────────────────────────
router.post('/login', loginLimiter, [
  body('email')
    .trim()
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('auth/login', {
      title: 'Login',
      errors: errors.array(),
      old: { email: req.body.email }
    });
  }

  const { email, password } = req.body;

  try {
    // Parameterised query - SQL injection prevention
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    // Use bcrypt.compare even if user not found (timing attack prevention)
    const dummyHash = '$2b$12$invalidhashfortimingattackprevention000000000000000000';
    const match = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummyHash);

    if (!user || !match) {
      auditLog('LOGIN_FAILED', null, req.ip, email);
      return res.status(401).render('auth/login', {
        title: 'Login',
        errors: [{ msg: 'Invalid email or password.' }],
        old: { email }
      });
    }

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) throw err;
      req.session.userId = user.id;
      req.session.userName = user.name;
      req.session.role = user.role;

      auditLog('LOGIN_SUCCESS', user.id, req.ip, user.email);

      const returnTo = req.session.returnTo || (user.role === 'admin' ? '/admin' : '/');
      delete req.session.returnTo;
      res.redirect(returnTo);
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).render('error', { title: 'Error', message: 'An error occurred. Please try again.', user: null });
  }
});

// ── GET /auth/register ───────────────────────────────────────────────────────
router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/');
  res.render('auth/register', { title: 'Register', errors: [], old: {} });
});

// ── POST /auth/register ──────────────────────────────────────────────────────
router.post('/register', [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters.')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens and apostrophes.'),
  body('email')
    .trim()
    .isEmail().withMessage('Please enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain at least one special character (!@#$%^&*).'),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match.')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('auth/register', {
      title: 'Register',
      errors: errors.array(),
      old: { name: req.body.name, email: req.body.email }
    });
  }

  const { name, email, password } = req.body;

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).render('auth/register', {
        title: 'Register',
        errors: [{ msg: 'An account with this email already exists.' }],
        old: { name, email }
      });
    }

    // Hash password with bcrypt cost factor 12
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = db.prepare(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)'
    ).run(name, email, hashedPassword, 'customer');

    auditLog('REGISTER', result.lastInsertRowid, req.ip, email);

    req.session.regenerate((err) => {
      if (err) throw err;
      req.session.userId = result.lastInsertRowid;
      req.session.userName = name;
      req.session.role = 'customer';
      res.redirect('/');
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).render('error', { title: 'Error', message: 'Registration failed. Please try again.', user: null });
  }
});

// ── POST /auth/logout ────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  auditLog('LOGOUT', req.session.userId, req.ip, '');
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.clearCookie('connect.sid');
    res.redirect('/auth/login');
  });
});

module.exports = router;
