const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const passport = require('../config/passport');

const router = express.Router();

// Input validation for local registration
const registerValidation = [
  body('name').isLength({ min: 2, max: 50 }).withMessage('Name 2-50 chars'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password >=6 chars'),
];

// @POST /api/auth/register - Local registration (fallback)
router.post('/register', registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  try {
    const { name, email, password } = req.body;

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: '👤 Email already registered!' });
    }

    // Create local user
    const user = new User({ 
      name, 
      email, 
      password,
      oauthProvider: 'local'
    });
    await user.save();

    // Generate JWT token (OAuth v2 Bearer Token)
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        scope: 'read write' // OAuth v2 scope
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: '🎉 Registered successfully!',
      token,
      token_type: 'Bearer', // OAuth v2 standard
      expires_in: 3600,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        provider: user.oauthProvider
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error 😵' });
  }
});

// Validation for local login
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email'),
  body('password').exists().withMessage('Password required'),
];

// @POST /api/auth/login - Local login (fallback)
router.post('/login', loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: '❌ Invalid credentials!' });
    }

    // Check if OAuth user trying to use password
    if (user.oauthProvider !== 'local') {
      return res.status(400).json({ 
        error: `Please login with ${user.oauthProvider}`,
        provider: user.oauthProvider
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: '❌ Invalid credentials!' });
    }

    // Generate JWT token (OAuth v2 Bearer Token)
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        scope: 'read write'
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({
      message: '✅ Logged in successfully!',
      token,
      token_type: 'Bearer',
      expires_in: 3600,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        provider: user.oauthProvider
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error 😵' });
  }
});

// ============ OAuth v2 Routes (Action 1) ============

// @GET /api/auth/google - Initiate Google OAuth v2 flow
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
  })
);

// @GET /api/auth/google/callback - Google OAuth v2 callback
router.get('/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/api/auth/failure'
  }),
  async (req, res) => {
    try {
      // Generate JWT token for OAuth user
      const token = jwt.sign(
        { 
          id: req.user._id,
          email: req.user.email,
          scope: 'read write'
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h' }
      );

      // In production, redirect to frontend with token
      // For now, return JSON response
      res.json({
        message: '🎉 Google OAuth v2 authentication successful!',
        token,
        token_type: 'Bearer',
        expires_in: 3600,
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          provider: req.user.oauthProvider,
          picture: req.user.profilePicture
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'OAuth authentication failed' });
    }
  }
);

// @GET /api/auth/failure - OAuth failure handler
router.get('/failure', (req, res) => {
  res.status(401).json({ 
    error: 'OAuth v2 authentication failed',
    message: 'Please try again or use local registration'
  });
});

// @POST /api/auth/token/refresh - OAuth v2 token refresh endpoint
router.post('/token/refresh', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new access token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        scope: 'read write'
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Token refreshed',
      token,
      token_type: 'Bearer',
      expires_in: 3600
    });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// @GET /api/auth/me - Get current user (protected)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -oauthAccessToken -oauthRefreshToken');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @POST /api/auth/revoke - OAuth v2 token revocation
router.post('/revoke', auth, async (req, res) => {
  try {
    // In production, you'd invalidate the token in a blacklist
    res.json({ 
      message: 'Token revoked successfully',
      note: 'Current token will expire in remaining TTL'
    });
  } catch (err) {
    res.status(500).json({ error: 'Token revocation failed' });
  }
});

module.exports = router;