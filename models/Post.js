const mongoose = require('mongoose');

/**
 * @typedef {Object} PostDocument
 * @property {string} title - Post title
 * @property {string} body - Post content
 * @property {string[]} topics - Array of topics
 * @property {Date} expiresAt - Expiration timestamp
 * @property {Object} owner - Reference to User ID
 * @property {string} status - 'Live' or 'Expired'
 * @property {Array} likes - Array of user likes
 * @property {Array} dislikes - Array of user dislikes
 * @property {Array} comments - Array of comments
 * @property {Function} isExpired - Method to check expiration
 */

const postSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true, 
    minlength: 1, 
    maxlength: 100 
  },
  body: { 
    type: String, 
    required: true, 
    minlength: 1, 
    maxlength: 1000 
  },
  topics: [{ 
    type: String, 
    enum: ['Politics', 'Health', 'Sport', 'Tech']
  }],
  expiresAt: { 
    type: Date, 
    required: true 
  },
  owner: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Live', 'Expired'], 
    default: 'Live' 
  },
  likes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  dislikes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true, maxlength: 500 },
    timestamp: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Database indexes for performance optimization (Phase G: proper database models)
/**
 * Index on topics for efficient filtering by topic
 */
postSchema.index({ 'topics': 1 });

/**
 * Index on status for live/expired queries
 */
postSchema.index({ 'status': 1 });

/**
 * Index on createdAt for sorting by recency
 */
postSchema.index({ 'createdAt': -1 });

/**
 * Check if post has expired
 * @description Compares current time with post's expiration timestamp
 * @method isExpired
 * @memberof Post.prototype
 * @returns {boolean} True if post has passed its expiration time
 */
postSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

module.exports = mongoose.model('Post', postSchema);
