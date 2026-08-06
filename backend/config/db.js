const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/smartexpense';

    console.log(
      'MongoDB URI:',
      connStr.replace(/\/\/(.*?):(.*?)@/, '//$1:*****@')
    );

    mongoose.set('strictQuery', false);

    const conn = await mongoose.connect(connStr);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;