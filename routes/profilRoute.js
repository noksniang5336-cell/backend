const express = require("express");

const router = express.Router();

const {
  getProfil,
  updateProfil,
} = require("../controllers/profilController");

// Import direct du middleware JWT
const protegerRoute = require("../middleware/authMiddleware");

// ===============================
// PROFIL UTILISATEUR
// ===============================

// Récupérer le profil
router.get("/", protegerRoute, getProfil);

// Modifier le profil
router.put("/", protegerRoute, updateProfil);

module.exports = router;