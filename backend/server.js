const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: '*', // For local testing. In production, specify frontend origin.
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Database connection middleware for serverless operational routes
app.use(require('./middleware/dbCheck'));

// Health check route querying active Mongoose connection state
app.get('/api/health', (req, res) => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  const readyState = mongoose.connection.readyState;
  
  res.json({ 
    status: 'OK', 
    database: states[readyState] || 'unknown',
    readyState: readyState
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/renters', require('./routes/renters'));

app.get('/', (req, res) => {
  res.send('Rent Management System API is running.');
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
