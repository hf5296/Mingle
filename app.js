require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected! DB: mingle'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

app.get('/api/health', (req, res) => {
  res.json({ message: 'Mingle API Alive! 🚀' });
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const postRoutes = require('./routes/posts');
app.use('/api/posts', postRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found 😢' });
});

app.listen(3000, () => {
  console.log(`🚀 Mingle Server running on http://localhost:3000`);
  console.log(`📡 Health: http://localhost:3000/api/health`);
});