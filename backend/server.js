require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes =
  require("./routes/authRoutes");
  const userRoutes =
require("./routes/userRoutes");

const customerRoutes =
  require("./routes/customerRoutes");

const app = express();


// ================= MIDDLEWARES =================

app.use(cors());

app.use(express.json());


// ================= DATABASE =================

connectDB();


// ================= ROUTES =================

// AUTH ROUTES
app.use(
  "/api/auth",
  authRoutes
);
app.use(
  "/api/users",
  userRoutes
);

// CUSTOMER ROUTES
app.use(
  "/api/customers",
  customerRoutes
);
const employeeRoutes =
require("./routes/employeeRoutes");

app.use(
  "/api/employees",
  employeeRoutes
);
app.use(
  "/uploads",
  express.static("uploads")
);
// ================= SERVER =================

app.listen(process.env.PORT, () => {

  console.log(
    `Server running on port ${process.env.PORT}`
  );

});
