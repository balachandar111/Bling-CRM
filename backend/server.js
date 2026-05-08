require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes =
  require("./routes/authRoutes");

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

// CUSTOMER ROUTES
app.use(
  "/api/customers",
  customerRoutes
);


// ================= SERVER =================

app.listen(process.env.PORT, () => {

  console.log(
    `Server running on port ${process.env.PORT}`
  );

});