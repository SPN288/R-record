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

// Database status variable
let dbConnected = false;

// MongoDB connection
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('================================================================');
  console.error('FATAL ERROR: MONGODB_URI is not defined in the environment!');
  console.error('Please configure your MongoDB Atlas connection string in .env');
  console.error('================================================================');
} else {
  mongoose.connect(mongoURI)
    .then(() => {
      dbConnected = true;
      console.log('Successfully connected to MongoDB Atlas.');
    })
    .catch(err => {
      dbConnected = false;
      console.error('MongoDB Atlas connection error:', err.message);
    });
}

// Monitor mongoose connection status events dynamically
mongoose.connection.on('connected', () => { dbConnected = true; });
mongoose.connection.on('disconnected', () => { dbConnected = false; });
mongoose.connection.on('error', () => { dbConnected = false; });

// Middleware to check database connection status
app.use((req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }
  if (!dbConnected) {
    return res.status(503).json({ message: 'Database connection is offline' });
  }
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: dbConnected ? 'connected' : 'disconnected' });
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

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
