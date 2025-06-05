const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    if(conn)
    console.log(`MongoDB Connected`);
  } catch (error) {
    console.error('Database connection error:', error.message);
  }
};

module.exports = connectDB;