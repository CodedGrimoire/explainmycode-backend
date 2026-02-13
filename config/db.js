const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGODB_URL) {
    throw new Error('MONGODB_URL is not defined in environment variables');
  }

  if (mongoose.connection.readyState === 1) return; // already connected
  if (mongoose.connection.readyState === 2) return; // connecting

  await mongoose.connect(process.env.MONGODB_URL);

  console.log('MongoDB connected');
};

module.exports = connectDB;
