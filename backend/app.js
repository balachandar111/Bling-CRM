require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// ================= CORS =================
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// ================= BODY =================
app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  })
);

// ================= DB CONNECTION MIDDLEWARE =================
// Ensures MongoDB is connected on cold starts in serverless environments
app.use(async (req, res, next) => {
  // Allow health checks to bypass or report DB status gracefully
  if (req.path === "/" || req.path === "/api/health") {
    return next();
  }
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// ================= ROUTES =================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/employees", require("./routes/employeeRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));
app.use("/api/reimbursements", require("./routes/reimbursementRoutes"));
app.use("/api/payslips", require("./routes/payslipRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use("/api/project-progress", require("./routes/projectProgressRoutes"));
app.use("/api/marketing", require("./routes/marketingRoutes"));

// ================= STATIC UPLOADS =================
app.use("/uploads", express.static("uploads"));

// ================= TEST & HEALTH CHECK =================
app.get("/", (req, res) => {
  res.send("Bling CRM Backend Running");
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Bling CRM API is operational",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await connectDB();
    res.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
      error: err.message,
    });
  }
});

module.exports = app;
