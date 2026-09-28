
const express = require("express");

const {
  createCommune,
  getCommunes,
  getCommuneById,
  updateCommune,
  deleteCommune,
} = require("../controllers/communeController");

// Import correct du middleware
const { protegerRoute } = require("../middleware/authMiddleware");

const router = express.Router();

// ===============================
// COMMUNES
// ===============================

// Récupérer toutes les communes
router.get("/", protegerRoute, getCommunes);

// Récupérer une commune par son ID
router.get("/:id", protegerRoute, getCommuneById);

// Créer une commune
router.post("/", protegerRoute, createCommune);

// Modifier une commune
router.put("/:id", protegerRoute, updateCommune);

// Supprimer une commune
router.delete("/:id", protegerRoute, deleteCommune);

module.exports = router;
