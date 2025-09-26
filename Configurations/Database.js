const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn; // reuse existing connection

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URL, {
        connectTimeoutMS: 35000,
        socketTimeoutMS: 50000,
        serverSelectionTimeoutMS: 25000,
        bufferCommands: true, // optional, Mongoose default is true
      })
      .then((mongoose) => {
        // console.log('✅ MongoDB connected');
        return mongoose;
      })
      .catch((err) => {
        // console.error('MongoDB connection error:', err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
