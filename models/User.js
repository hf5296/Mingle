const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// Compare password only for local users
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.oauthProvider !== 'local') {
    throw new Error('OAuth users cannot use password authentication');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);