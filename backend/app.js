const express =
require("express");

const cors =
require("cors");

require("dotenv").config();

const app = express();


// ================= CORS =================

app.use(cors({
  origin: "*",
  credentials: true,
}));


// ================= BODY =================

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

app.use(
  "/api/attendance",
  require("./routes/attendanceRoutes")
);

app.use(
  "/api/tasks",
  require("./routes/taskRoutes")
);


// ================= TEST =================

app.get("/", (req, res) => {

  res.send(
    "Backend Running"
  );

});

module.exports = app;