const express = require("express");

const {
  login,
  register,
} = require("../controllers/authController");

const router = express.Router();

// ===============================
// CONNEXION
// POST /api/auth/login
// ===============================
router.post("/login", login);

// ===============================
// INSCRIPTION
// POST /api/auth/register
// ===============================
router.post("/register", register);

module.exports = router;