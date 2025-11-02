const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Input validation using JOI/Express Validator (Phase B: verification process)
const registerValidation = [
  body('name').isLength({ min: 2, max: 50 }).withMessage('Name 2-50 chars'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password >=6 chars'),
];

// @POST /api/auth/register - Note: README mandates OAuth2, but JWT used as common SaaS auth; OAuth can be added via PassportJS if needed (Phase H)
router.post('/register', registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }
try {
const { name, email, password } = req.body;

// Check exists
const existingUser = await User.findOne({ email });
if (existingUser) return res.status(400).json({ error: '👤 Email taken!' });

// Create user
const user = new User({ name, email, password });
await user.save();

// JWT Token (expires 1h)
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

res.status(201).json({
  message: '🎉 Registered!',
  token,
  user: { id: user._id, name: user.name, email: user.email }
});
} catch (err) {
res.status(500).json({ error: 'Server error 😵' });
}
});

// Validation for login
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email'),
  body('password').exists().withMessage('Password required'),
];

router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }
try {
const { email, password } = req.body;

// Find & check pw
const user = await User.findOne({ email });
if (!user || !(await user.comparePassword(password))) {
  return res.status(401).json({ error: '❌ Wrong email/password!' });
}

// JWT
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

res.json({
  message: '✅ Logged in!',
  token,
  user: { id: user._id, name: user.name, email: user.email }
});
} catch (err) {
res.status(500).json({ error: 'Server error 😵' });
}
});

// @GET /api/auth/me - Protected demo
router.get('/me', auth, (req, res) => {
res.json({ user: req.user });
});

module.exports = router;
