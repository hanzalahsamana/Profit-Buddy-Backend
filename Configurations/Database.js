const mongoose = require('mongoose');
const url = process.env.MONGO_URL;

mongoose
  .connect(url, {
    connectTimeoutMS: 35000,
    socketTimeoutMS: 50000,
    serverSelectionTimeoutMS: 25000,
  })
  .then(async () => {
    console.log('Mongo DB connected');
  })
  .catch((err) => {
    console.log('not connected', 'error:', err);
  });
