require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Allow the frontend(s) listed in CLIENT_URL
const allowed = (process.env.CLIENT_URL || '').split(',').map((u) => u.trim().replace(/\/$/, ''));
app.use(cors({ origin: allowed }));
app.use(express.json());

// Connect to MongoDB Atlas (re-used between serverless calls on Vercel)
async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGO_URI);
}
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('MongoDB error:', err.message);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

app.get('/', (req, res) => res.json({ message: 'MERN Auth API is running' }));
app.use('/api/auth', require('./routes/auth'));

// Local development only. On Vercel the exported app is used instead.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
