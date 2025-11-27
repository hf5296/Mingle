/**
 * @fileoverview Post routes for the Mingle API.
 * Handles CRUD operations for posts, including likes, dislikes, comments, and browsing.
 * Implements Phase C Actions 1-6 with RESTful API endpoints.
 *
 * @description Provides complete post management through:
 * - POST creation with expiration and topic classification
 * - Multi-topic browsing with live/expired status filtering
 * - Interactive features: like, dislike, commenting
 * - Analytics: most active posts per topic, expired post history
 * - Real-time expiration tracking and time-left calculations
 *
 * @requires express - Web framework for HTTP request handling
 * @requires express-validator - Input validation middleware
 * @requires ../models/Post - Mongoose Post schema
 * @requires ../middleware/auth - JWT authentication middleware
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

/**
 * Express Router instance for post-related endpoints
 * @type {import('express').Router}
 */
const router = express.Router();

/**
 * Input validation middleware for post creation
 * @description Validates post data including title, body, topics, and expiration time
 * @returns {Array} Express-validator middleware chain including error handler
 *
 * @validation_rules
 * - title: 1-100 characters required
 * - body: 1-1000 characters required
 * - topics: Optional array, each value must be from ['Politics', 'Health', 'Sport', 'Tech']
 * - expirationMinutes: Optional integer 1-1440 (default: 1440 = 24 hours)
 */
const postValidation = [
  body('title').isLength({ min: 1, max: 100 }).withMessage('Title 1-100 chars'),
  body('body').isLength({ min: 1, max: 1000 }).withMessage('Body 1-1000 chars'),
  body('topics').isArray().optional({ nullable: true }).withMessage('Topics as array'),
  body('topics.*').isIn(['Politics', 'Health', 'Sport', 'Tech']).withMessage('Valid topic'),
  body('expirationMinutes').isInt({ min: 1, max: 1440 }).optional().withMessage('Expiration 1-1440 min'),
  /**
   * Express-validator error handler
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @param {import('express').NextFunction} next - Express next middleware function
   * @returns {void} Returns JSON error array or continues to next middleware
   */
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }
    next();
  },
];

/**
 * POST /api/posts - Create new post (Action 2: Only authorized users post)
 * @description Allows authenticated users to create posts with expiration times and topics
 * @action Implements Phase C Action 1 & 2: User posts and post content requirements
 * @auth Required: Bearer token in Authorization header
 * @body_param {string} title - Post title (1-100 characters)
 * @body_param {string} body - Post content (1-1000 characters)
 * @body_param {string[]} [topics] - Array of topic categories ['Politics', 'Health', 'Sport', 'Tech']
 * @body_param {number} [expirationMinutes] - Post lifetime in minutes (1-1440, default: 1440)
 * @response_201 {Object} Successfully created post with ID and metadata
 * @response_400 {Object} Validation error with specific field errors
 * @response_401 {Object} Authentication required
 * @response_500 {Object} Server error during post creation
 *
 * @example POST /api/posts
 * {
 *   "title": "Mingle is awesome!",
 *   "body": "This platform enables great discussions...",
 *   "topics": ["Tech"],
 *   "expirationMinutes": 30
 * }
 *
 * @returns {Promise<void>} JSON response with created post data
 */
router.post('/', auth, postValidation, async (req, res) => {
  try {
    /**
     * Extract validated post parameters from request body
     * @type {Object} Request body containing post details
     */
    const { title, body, topics, expirationMinutes } = req.body;

    /** Calculate post expiration timestamp (default 24 hours) */
    const expiresAt = new Date(Date.now() + (expirationMinutes || 1440) * 60 * 1000);

    /** Create new post document with validated data */
    const post = new Post({
      title: title.trim(),
      body: body.trim(),
      topics: topics || [],
      expiresAt,
      owner: req.user._id
    });

    await post.save();

    res.status(201).json({
      message: 'Post created!',
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

/**
 * GET /api/posts - Browse posts by topic and status (Action 3: Browse messages per topic)
 * @description Retrieves paginated list of posts with optional topic filtering and live/expired status
 * @action Implements Phase C Action 3: Authorized users browse messages per topic
 * @auth Required: Bearer token in Authorization header
 * @query_param {string} [topic] - Filter by topic ('Politics', 'Health', 'Sport', 'Tech')
 * @query_param {string} [status] - Filter by status ('live' or 'expired', default: 'live')
 * @query_param {number} [page] - Page number for pagination (default: 1)
 * @query_param {number} [limit] - Posts per page (default: 10)
 * @response_200 {Object} Paginated posts with metadata
 * @response_401 {Object} Authentication required
 *
 * @example GET /api/posts?topic=Tech&status=live&page=1&limit=10
 * Response:
 * {
 *   "meta": {
 *     "totalPosts": 25,
 *     "totalPages": 3,
 *     "currentPage": 1,
 *     "postsPerPage": 10
 *   },
 *   "posts": [...]
 * }
 */
router.get('/', auth, async (req, res) => {
  try {
    const { topic, status } = req.query;
    
    // Pagination Defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const now = new Date();
    let filter = {};

    // 1. Build Filter
    if (topic) {
      filter.topics = { $in: [topic] };
    }

    if (status === 'expired') {
       // Explicitly expired OR time has passed
       filter.$or = [
         { status: 'Expired' },
         { expiresAt: { $lte: now } }
       ];
    } else {
      // Default to Live: Must be Live AND in the future
      filter.status = 'Live';
      filter.expiresAt = { $gt: now };
    }

    // 2. Get Total Count (Efficiently)
    // We need this so the frontend knows how many pages exist
    const totalPosts = await Post.countDocuments(filter);

    // 3. Fetch Paginated Data
    const posts = await Post.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)   // Skip X previous posts
      .limit(limit); // Only take Y posts

    // 4. Return Data + Metadata
    res.json({
      meta: {
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        currentPage: page,
        postsPerPage: limit
      },
      posts: posts.map(p => {
        // Calculate status strictly for display (don't save to DB)
        const isActuallyExpired = p.status === 'Expired' || p.expiresAt <= now;
        
        return {
          id: p._id,
          title: p.title,
          body: p.body,
          topics: p.topics,
          owner: p.owner.name,
          status: isActuallyExpired ? 'Expired' : 'Live', 
          expiresAt: p.expiresAt,
          likes: p.likes.length,
          dislikes: p.dislikes.length,
          comments: p.comments.length,
          createdAt: p.createdAt
        };
      })
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/posts/:id - Retrieve individual post with full details
 * @description Fetches complete post data including owner info, comments, and interaction counts
 * @auth Required: Bearer token in Authorization header
 * @param {string} :id - MongoDB ObjectId of the post to retrieve
 * @response_200 {Object} Complete post data with populated user details
 * @response_404 {Object} Post not found by provided ID
 * @response_401 {Object} Authentication required
 * @response_500 {Object} Server error during data retrieval
 *
 * @example GET /api/posts/507f1f77bcf86cd799439011
 * Response includes owner name, all comments with user names, like/dislike counts
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('comments.user', 'name');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Calculate status for response without modifying DB
    const now = new Date();
    const isActuallyExpired = post.status === 'Expired' || post.expiresAt <= now;

    res.json({
      id: post._id,
      title: post.title,
      body: post.body,
      topics: post.topics,
      owner: post.owner.name,
      status: isActuallyExpired ? 'Expired' : 'Live',
      expiresAt: post.expiresAt,
      likes: post.likes.length,
      dislikes: post.dislikes.length,
      comments: post.comments.map(c => ({
        user: c.user.name,
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
    res.json({ message: 'Post liked', likes: post.likes.length, timeLeft });
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
    res.json({ message: 'Post disliked', dislikes: post.dislikes.length, timeLeft });
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
      message: 'Comment added',
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

    const now = new Date();

    /**
     * Aggregation Pipeline for "Most Active Post"
     * @description Utilizes MongoDB aggregation to calculate activity scores server-side
     * rather than fetching all posts to memory.
     * 
     * Pipeline stages:
     * 1. $match: Filter for Topic + Live status
     * 2. $addFields: Calculate score (likes.length + dislikes.length)
     * 3. $sort: Order by calculated score descending
     * 4. $limit: Fetch only the top result
     * 5. $lookup: Join with Users collection for owner details
     */
    const pipeline = [
      // 1. Filter: Must match topic, be Live, AND not expired
      { 
        $match: { 
          topics: topic, 
          status: 'Live',
          expiresAt: { $gt: now } 
        } 
      },
      // 2. Add computed field for activity score (likes + dislikes count)
      { 
        $addFields: {
          activityScore: { $add: [{ $size: "$likes" }, { $size: "$dislikes" }] }
        }
      },
      // 3. Sort by activity score descending
      { $sort: { activityScore: -1 } },
      // 4. Limit to 1 result (Efficiency)
      { $limit: 1 },
      // 5. Lookup owner details (Join with Users table)
      {
        $lookup: {
          from: 'users',       // MongoDB collection name is lowercase plural
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerDetails'
        }
      },
      // 6. Unwind owner array (lookup returns an array)
      { $unwind: '$ownerDetails' }
    ];

    const posts = await Post.aggregate(pipeline);
    const topPost = posts[0];

    // Handle case where no posts exist
    if (!topPost) {
        return res.status(404).json({ message: 'No active posts found for this topic' });
    }

    res.json({
      topic,
      topPost: {
        id: topPost._id,
        title: topPost.title,
        body: topPost.body,
        topics: topPost.topics,
        owner: topPost.ownerDetails.name, // From lookup
        status: topPost.status,
        expiresAt: topPost.expiresAt,
        likes: topPost.likes.length,
        dislikes: topPost.dislikes.length,
        activityScore: topPost.activityScore,
        createdAt: topPost.createdAt
      }
    });
  } catch (err) {
    console.error(err); // Helpful for debugging aggregation errors
    res.status(500).json({ error: 'Server error' });
  }
});

// @GET /api/posts/browse/expired - Action 6: Browse expired posts history
router.get('/browse/expired', auth, async (req, res) => {
  try {
    const { topic } = req.query;
    
    // Pagination Defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const now = new Date();
    
    // Filter: Explicitly 'Expired' status OR expiration date has passed
    let filter = {
      $or: [
        { status: 'Expired' },
        { expiresAt: { $lte: now } }
      ]
    };

    if (topic) {
      filter.topics = { $in: [topic] };
    }

    // 1. Get Count
    const totalPosts = await Post.countDocuments(filter);

    // 2. Fetch Data
    const posts = await Post.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      meta: {
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        currentPage: page,
        postsPerPage: limit
      },
      posts: posts.map(p => ({
        id: p._id,
        title: p.title,
        body: p.body,
        topics: p.topics,
        owner: p.owner.name,
        status: 'Expired',
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
