/**
 * @fileoverview Main application file for the Mingle API.
 * Sets up Express server with OAuth2 authentication, MongoDB connection, and routes.
 *
 * @description This file configures the core Mingle application, including:
 * - Environment variables loading
 * - Express server setup
 * - Middleware configuration (body parsing, sessions)
 * - Passport initialization for OAuth2
 * - MongoDB connection
 * - Route definitions
 * - Error handling
 * - Server startup
 *
 * @see {@link https://expressjs.com/|Express.js Documentation}
 * @see {@link https://mongoosejs.com/|Mongoose ODM}
 * @see {@link https://oauth.net/2/|OAuth 2.0 Specification}
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('./config/passport');

/**
 * Express application instance
 * @type {import('express').Application}
 * @description Main Express app configured with middleware for the Mingle API
 */
const app = express();

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware (required for OAuth v2)
app.use(session({
  secret: process.env.SESSION_SECRET || 'mingle-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport for OAuth v2
app.use(passport.initialize());
app.use(passport.session());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected! DB: mingle'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    message: 'Mingle API Alive! 🚀',
    auth: 'OAuth v2 Enabled',
    providers: ['Google', 'Local']
  });
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const postRoutes = require('./routes/posts');
app.use('/api/posts', postRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found 😢' });
});

/**
 * Server startup configuration
 * @description Starts the Express server on configured port
 * @constant {number} PORT - Server port from environment or default 3000
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Mingle Server running on http://localhost:${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`🔐 OAuth v2: http://localhost:${PORT}/api/auth/google`);
});