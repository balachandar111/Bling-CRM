const express = require("express");
const router = express.Router();
const { register, login,logout,getMe, updateUser } = require("../controllers/authController");
const protect = require("../middlewares/authMiddleware");
const superAdmin =
require("../middlewares/superAdmin");
router.post("/register", register);
router.post("/login",login);



router.get("/me", protect, getMe);
router.put("/update", protect, updateUser);
router.post("/logout", protect, logout);

module.exports = router;



