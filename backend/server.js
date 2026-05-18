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
  "/api/customer",
  customerRoutes
);
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


require("dotenv").config();

const mongoose =
require("mongoose");


// ================= DATABASE =================

mongoose.connect(
  process.env.MONGO_URI
)
.then(() => {

  console.log(
    "MongoDB Connected ✅"
  );

})
.catch((err) => {

  console.log(err);

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