/**
 * @fileoverview JWT Authentication Middleware for Mingle API.
 * Validates Bearer tokens and attaches user data to requests.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT Authentication Middleware
 * @description Validates JWT tokens from Authorization header and attaches user to request
 * @async
 * @function
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @throws {401} No token provided, invalid token, or user not found
 * @returns Calls next() if authentication succeeds
 *
 * @example
 * ```js
 * router.get('/protected', auth, (req, res) => {
 *   // req.user is now available
 * });
 * ```
 */
module.exports = async (req, res, next) => {
  try {
    /**
     * Extract Bearer token from Authorization header
     * @type {string|null}
     */
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token! Login first.' });

    /**
     * Verify JWT token and decode payload
     * @type {Object} decoded - JWT payload with user ID and scopes
     */
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    /**
     * Fetch user from database and attach to request
     * @type {Object} req.user - Mongoose user document (without sensitive fields)
     */
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ error: 'Invalid token.' });

    next();
  } catch (err) {
    res.status(401).json({ error: 'Token expired/invalid.' });
  }
};