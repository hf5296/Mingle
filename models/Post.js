const mongoose = require('mongoose');

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

// Add indexes for performance (Phase G: proper database models)
postSchema.index({ 'topics': 1 });
postSchema.index({ 'status': 1 });
postSchema.index({ 'expiresAt': 1 });
postSchema.index({ 'createdAt': -1 });

// TTL index for auto-expiry (optional for Phase H: expiration handling)
postSchema.index({ 'expiresAt': 1 }, { expireAfterSeconds: 0 });

postSchema.methods.isExpired = function() {
  return Date.now() > this.expiresAt;
};

module.exports = mongoose.model('Post', postSchema);
