const express = require("express");

const {
  login,
  register,
  getProfil,
} = require("../controllers/authController");

const { protegerRoute } = require("../middleware/authMiddleware");

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

// ===============================
// PROFIL
// GET /api/auth/profil
// ===============================
router.get("/profil", protegerRoute, getProfil);

module.exports = router;