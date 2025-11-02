const jwt = require('jsonwebtoken');
const User = require('../models/User');



module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token! Login first.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ error: 'Invalid token.' });

    next();
  } catch (err) {
    res.status(401).json({ error: 'Token expired/invalid.' });
  }
};