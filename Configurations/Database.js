const mongoose = require("mongoose");
const url = process.env.MONGO_URL;

mongoose
  .connect(url, {
    connectTimeoutMS: 30000,
    socketTimeoutMS: 45000,
  })
  .then(async () => {
    console.log("Mongo DB connected");
  })
  .catch((err) => {
    console.log("not connected", "error:", err);
  });
