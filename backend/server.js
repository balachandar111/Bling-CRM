require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const { initTaskScheduler } = require("./utils/taskScheduler");

const PORT = process.env.PORT || 5000;

// When run directly (e.g. node server.js locally), listen on PORT
if (require.main === module) {
  connectDB()
    .then(() => {
      // Start 6:30 PM cron scheduler
      initTaskScheduler();

      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Initial MongoDB connection error:", err.message);
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (database connection pending)`);
      });
    });
}

// Export app instance for Vercel Express service integration
module.exports = app;
