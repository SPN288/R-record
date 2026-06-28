const mongoose = require('mongoose');

let cachedConnection = null;

const connectToDatabase = async () => {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    throw new Error('MONGODB_URI is not defined in the environment variables');
  }

  // If the database is already connected, return the connection directly (caching)
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // If a connection promise is already in progress, await it
  if (cachedConnection) {
    return cachedConnection;
  }

  console.log('Establishing a new MongoDB connection...');

  // Set bufferCommands to false to prevent Mongoose from buffering queries if the database goes down
  mongoose.set('bufferCommands', false);

  cachedConnection = mongoose.connect(mongoURI, {
    bufferCommands: false
  });

  try {
    await cachedConnection;
    console.log('Successfully connected to MongoDB Atlas.');
    return mongoose.connection;
  } catch (error) {
    cachedConnection = null; // Clear connection cache on failure
    console.error('Failed to establish MongoDB connection:', error.message);
    throw error;
  }
};

module.exports = { connectToDatabase };
