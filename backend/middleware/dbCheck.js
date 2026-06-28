const { connectToDatabase } = require('../config/db');

module.exports = async (req, res, next) => {
  // Allow health endpoint to pass without checking (since the health route itself queries Mongoose state)
  if (req.path === '/api/health') {
    return next();
  }

  try {
    // Explicitly await the database connection check before passing control downstream
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection error in middleware:', error.message);
    res.status(503).json({
      message: 'Database connection is offline',
      error: error.message
    });
  }
};
