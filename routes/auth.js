const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const protect = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ message: 'This email is already registered' });
    }
    const user = await User.create({ name, email, password });
    res.status(201).json({ token: signToken(user._id), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Incorrect email or password' });
    }

    // Save login details in MongoDB
    user.lastLogin = new Date();
    user.loginCount += 1;
    user.loginHistory.push({
      at: new Date(),
      ip: (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim(),
      device: req.headers['user-agent'],
    });
    user.loginHistory = user.loginHistory.slice(-10); // keep the last 10
    await user.save();

    res.json({ token: signToken(user._id), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me  (protected)
router.get('/me', protect, (req, res) => res.json({ user: req.user }));

// PUT /api/auth/me  (protected) - update name
router.put('/me', protect, async (req, res) => {
  try {
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }
    req.user.name = req.body.name;
    await req.user.save();
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
