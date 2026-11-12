const mongoose = require("mongoose");

let cachedPromise = null;

const connectDB = async () => {
  // If already connected, reuse existing connection
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (!process.env.DB_URI) {
    throw new Error("DB_URI environment variable is not defined");
  }

  if (!cachedPromise) {
    cachedPromise = mongoose
      .connect(process.env.DB_URI, {
        serverSelectionTimeoutMS: 10000,
      })
      .then((conn) => {
        console.log("MongoDB Connected ✅");
        return conn;
      })
      .catch((error) => {
        cachedPromise = null;
        console.error("DB Error ❌", error.message);
        throw error;
      });
  }

  return cachedPromise;
};

module.exports = connectDB;
