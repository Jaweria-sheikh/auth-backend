const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protects routes: requires "Authorization: Bearer <token>"
module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Please log in to continue' });
  }
  try {
    const { id } = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ message: 'Account no longer exists' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Session expired, please log in again' });
  }
};
