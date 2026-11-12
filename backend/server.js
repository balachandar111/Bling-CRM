require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start listening
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Initial MongoDB connection error:", err.message);
    // Still listen so the server doesn't crash on startup
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (database connection pending)`);
    });
  });
