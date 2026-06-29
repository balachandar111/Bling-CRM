require("dotenv").config();

const express =
require("express");

const cors =
require("cors");

const mongoose =
require("mongoose");

const connectDB =
require("./config/db");


// ================= EXPRESS =================

const app = express();


// ================= MIDDLEWARE =================

app.use(cors({
  origin: "*",
  credentials: true,
}));

app.use(express.json());

app.use(express.urlencoded({
  extended: true,
}));


// ================= DATABASE =================

connectDB();


// ================= ROUTES =================

const authRoutes =
require("./routes/authRoutes");

const userRoutes =
require("./routes/userRoutes");

const customerRoutes =
require("./routes/customerRoutes");

const employeeRoutes =
require("./routes/employeeRoutes");

const attendanceRoutes =
require("./routes/attendanceRoutes");


// AUTH

app.use(
  "/api/auth",
  authRoutes
);


// USERS

app.use(
  "/api/users",
  userRoutes
);


// CUSTOMERS

app.use(
  "/api/customers",
  customerRoutes
);


// EMPLOYEES

app.use(
  "/api/employees",
  employeeRoutes
);


// ATTENDANCE

app.use(
  "/api/attendance",
  attendanceRoutes
);


// UPLOADS

app.use(
  "/uploads",
  express.static("uploads")
);


// TEST ROUTE

app.get("/", (req, res) => {

  res.send(
    "Backend Running"
  );

});


// ================= PORT =================

const PORT =
process.env.PORT || 5000;


// ================= SERVER =================

app.listen(PORT, () => {

  console.log(
    `Server running on ${PORT}`
  );

});