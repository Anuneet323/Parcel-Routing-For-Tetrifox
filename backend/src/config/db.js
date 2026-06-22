const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
  const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/routingsystem';
  
  try {
    const conn = await mongoose.connect(dbUri);
    
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`, { error: error.stack });
    // In production, we might want to shut down, in local we might try again or exit
    process.exit(1);
  }
};

module.exports = connectDB;
