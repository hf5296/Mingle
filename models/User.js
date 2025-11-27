/**
 * @fileoverview User model schema for the Mingle API.
 * Defines authentication and profile data for both local and OAuth users.
 *
 * @description This model supports:
 * - Local authentication with bcrypt hashing
 * - OAuth 2.0 integration (Google, future GitHub)
 * - Email verification and profile pictures
 * - Secure token storage for OAuth providers
 *
 * @see {@link https://mongoosejs.com/|Mongoose Documentation}
 * @see {@link https://oauth.net/2/|OAuth 2.0 Specification}
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * @typedef {Object} UserDocument
 * @property {string} _id - The user's MongoDB ID
 * @property {string} name - Full name
 * @property {string} email - Email address
 * @property {string} oauthProvider - Authentication provider ('local', 'google', etc.)
 * @property {boolean} isEmailVerified - Verification status
 * @property {function} comparePassword - Method to verify password hash
 */

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, minlength: 6 }, // Optional for OAuth users
  
  // OAuth v2 fields
  oauthProvider: { 
    type: String, 
    enum: ['local', 'google', 'github'],
    default: 'local'
  },
  oauthId: { type: String }, // Provider's user ID
  oauthAccessToken: { type: String }, // For API calls to provider
  oauthRefreshToken: { type: String }, // For token refresh
  
  // Additional OAuth profile data
  profilePicture: { type: String },
  isEmailVerified: { type: Boolean, default: false }
}, { timestamps: true });

// Add compound index for OAuth lookups
userSchema.index({ 'email': 1 });
userSchema.index({ 'oauthProvider': 1, 'oauthId': 1 });

// Hash password only for local authentication
userSchema.pre('save', async function(next) {
  // Skip hashing if OAuth user or password not modified
  if (this.oauthProvider !== 'local' || !this.isModified('password')) {
    return next();
  }
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/**
 * Compare password for local users only
 * @description Compares a candidate password with the stored hash
 * @async
 * @method comparePassword
 * @memberof User.prototype
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} True if password matches
 * @throws {Error} If user is OAuth-only or comparison fails
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.oauthProvider !== 'local') {
    throw new Error('OAuth users cannot use password authentication');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);