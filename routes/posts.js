const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation for post creation
const postValidation = [
  body('title').isLength({ min: 1, max: 100 }).withMessage('Title 1-100 chars'),
  body('body').isLength({ min: 1, max: 1000 }).withMessage('Body 1-1000 chars'),
  body('topics').isArray().optional({ nullable: true }).withMessage('Topics as array'),
  body('topics.*').isIn(['Politics', 'Health', 'Sport', 'Tech']).withMessage('Valid topic'),
  body('expirationMinutes').isInt({ min: 1, max: 1440 }).optional().withMessage('Expiration 1-1440 min'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    next();
  },
];

// @POST /api/posts - Action 2: Only authorized users post (Phase C, Action 1 & 2)
router.post('/', auth, postValidation, async (req, res) => {
  try {
    const { title, body, topics, expirationMinutes } = req.body;

    const expiresAt = new Date(Date.now() + (expirationMinutes || 1440) * 60 * 1000);

    const post = new Post({
      title: title.trim(),
      body: body.trim(),
      topics: topics || [],
      expiresAt,
      owner: req.user._id
    });

    await post.save();

    res.status(201).json({
      message: 'Post created! (Action 2)',
      post: {
        id: post._id,
        title: post.title,
        body: post.body,
        topics: post.topics,
        expiresAt: post.expiresAt,
        owner: post.owner,
        status: post.status
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @GET /api/posts?topic=Tech&status=live - Action 3: Browse messages per topic (default live)
router.get('/', auth, async (req, res) => {
  try {
    const { topic, status } = req.query;

    let filter = {};

    if (topic) {
      filter.topics = { $in: [topic] }; // Fix: Match if topic in array (allows multiple topics per post)
    }

    if (status === 'expired') {
      filter.status = 'Expired';
    } else {
      filter.status = { $ne: 'Expired' }; // Default to non-expired
    }

    let posts = await Post.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    posts = posts.map(post => {
      if (post.isExpired() && post.status === 'Live') {
        post.status = 'Expired';
        post.save();
      }
      return post;
    });

    res.json({
      count: posts.length,
      posts: posts.map(p => ({
        id: p._id,
        title: p.title,
        body: p.body,
        topics: p.topics,
        owner: p.owner.name, // As per Data: owner name
        status: p.status,
        expiresAt: p.expiresAt,
        likes: p.likes.length,
        dislikes: p.dislikes.length,
        comments: p.comments.length,
        createdAt: p.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('comments.user', 'name');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.isExpired() && post.status === 'Live') {
      post.status = 'Expired';
      await post.save();
    }

    res.json({
      id: post._id,
      title: post.title,
      body: post.body,
      topics: post.topics,
      owner: post.owner.name,
      status: post.status,
      expiresAt: post.expiresAt,
      likes: post.likes.length,
      dislikes: post.dislikes.length,
      comments: post.comments.map(c => ({
        user: c.user.name, // Data: user info (name)
        text: c.text,
        timestamp: c.timestamp
      })),
      createdAt: post.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.isExpired()) {
      post.status = 'Expired';
      await post.save();
      return res.status(400).json({ error: 'Cannot like expired post' });
    }

    if (post.owner.toString() === req.user._id.toString()) {
        return res.status(403).json({ error: 'You cannot like your own post' });
    }

    const likeIndex = post.likes.findIndex(
      like => like.user.toString() === req.user._id.toString()
    );

    const dislikeIndex = post.dislikes.findIndex(
      dislike => dislike.user.toString() === req.user._id.toString()
    );

    if (dislikeIndex !== -1) {
      post.dislikes.splice(dislikeIndex, 1);
    }

    if (likeIndex !== -1) {
      post.likes.splice(likeIndex, 1);
      await post.save();
      return res.json({ message: 'Like removed', likes: post.likes.length });
    }

    post.likes.push({ user: req.user._id });
    await post.save();

    const timeLeft = Math.max(0, Math.floor((post.expiresAt - Date.now()) / (1000 * 60))); // Minutes left for expiry (per Data)
    res.json({ message: 'Post liked (Action 4)', likes: post.likes.length, timeLeft });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @POST /api/posts/:id/dislike - Action 4: Dislike (includes time left)
router.post('/:id/dislike', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.isExpired()) {
      post.status = 'Expired';
      await post.save();
      return res.status(400).json({ error: 'Cannot dislike expired post' });
    }

    if (post.owner.toString() === req.user._id.toString()) {
        return res.status(403).json({ error: 'You cannot dislike your own post' });
    }

    const dislikeIndex = post.dislikes.findIndex(
      dislike => dislike.user.toString() === req.user._id.toString()
    );

    const likeIndex = post.likes.findIndex(
      like => like.user.toString() === req.user._id.toString()
    );

    if (likeIndex !== -1) {
      post.likes.splice(likeIndex, 1);
    }

    if (dislikeIndex !== -1) {
      post.dislikes.splice(dislikeIndex, 1);
      await post.save();
      return res.json({ message: 'Dislike removed', dislikes: post.dislikes.length });
    }

    post.dislikes.push({ user: req.user._id });
    await post.save();

    const timeLeft = Math.max(0, Math.floor((post.expiresAt - Date.now()) / (1000 * 60)));
    res.json({ message: 'Post disliked (Action 4)', dislikes: post.dislikes.length, timeLeft });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @POST /api/posts/:id/comments - Action 4: Comment (includes time left)
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text required' });
    }

    if (text.length > 500) {
      return res.status(400).json({ error: 'Comment too long (max 500 chars)' });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.isExpired()) {
      post.status = 'Expired';
      await post.save();
      return res.status(400).json({ error: 'Cannot comment on expired post' });
    }

    post.comments.push({
      user: req.user._id,
      text: text.trim()
    });

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate('comments.user', 'name');

    const timeLeft = Math.max(0, Math.floor((post.expiresAt - Date.now()) / (1000 * 60)));
    res.status(201).json({
      message: 'Comment added (Action 4)',
      comments: populatedPost.comments.map(c => ({
        user: c.user.name, // Name per Data
        text: c.text,
        timestamp: c.timestamp,
        timeLeft // Time left for expiry
      })),
      totalComments: populatedPost.comments.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @GET /api/posts/browse/active - Action 5: Most active post per topic (highest likes+dislikes)
router.get('/browse/active', auth, async (req, res) => {
  try {
    const { topic } = req.query;

    if (!topic) {
      return res.status(400).json({ error: 'Topic required for active browse (?topic=Tech)' });
    }

    let filter = { status: 'Live', topics: { $in: [topic] } };

    let posts = await Post.find(filter)
      .populate('owner', 'name email');

    posts = posts.map(post => {
      if (post.isExpired()) {
        post.status = 'Expired';
        post.save();
        return null;
      }
      return { ...post._doc, activityScore: post.likes.length + post.dislikes.length };
    }).filter(p => p !== null);

    posts.sort((a, b) => b.activityScore - a.activityScore);

    const topPost = posts[0]; // Most active (highest likes+dislikes)

    res.json({
      topic,
      topPost: topPost ? {
        id: topPost._id,
        title: topPost.title,
        body: topPost.body,
        topics: topPost.topics,
        owner: topPost.owner.name,
        status: topPost.status,
        expiresAt: topPost.expiresAt,
        likes: topPost.likes.length,
        dislikes: topPost.dislikes.length,
        activityScore: topPost.activityScore,
        createdAt: topPost.createdAt
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @GET /api/posts/browse/expired - Action 6: Browse expired posts history
router.get('/browse/expired', auth, async (req, res) => {
  try {
    let posts = await Post.find()
      .populate('owner', 'name email');

    posts = posts.map(post => {
      if (post.isExpired() && post.status === 'Live') {
        post.status = 'Expired';
        post.save();
      }
      return post;
    });

    const expiredPosts = posts.filter(p => p.status === 'Expired');

    res.json({
      count: expiredPosts.length,
      posts: expiredPosts.map(p => ({
        id: p._id,
        title: p.title,
        body: p.body,
        topics: p.topics,
        owner: p.owner,
        status: p.status,
        expiresAt: p.expiresAt,
        likes: p.likes.length,
        dislikes: p.dislikes.length,
        comments: p.comments.length,
        createdAt: p.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
