const express = require("express");

const cors = require("cors");

require("dotenv").config();

const app = express();


// ================= MIDDLEWARE =================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
  extended: true,
}));


// ================= ROUTES =================

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

app.use(
  "/api/customers",
  require("./routes/customerRoutes")
);

app.use(
  "/api/users",
  require("./routes/userRoutes")
);

app.use(
  "/api/employees",
  require("./routes/employeeRoutes")
);


// ================= TEST ROUTE =================

app.get("/", (req, res) => {

  res.send("Backend Running");

});


module.exports = app;