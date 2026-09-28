const express = require("express");

const router = express.Router();

const {
  createAdhesion,
  getAdhesions,
  getAdhesionById,
  updateAdhesion,
  deleteAdhesion,
} = require("../controllers/adhesionController");

const { protegerRoute } = require("../middleware/authMiddleware");

// Vérification temporaire
console.log("createAdhesion :", typeof createAdhesion);
console.log("getAdhesions :", typeof getAdhesions);
console.log("getAdhesionById :", typeof getAdhesionById);
console.log("updateAdhesion :", typeof updateAdhesion);
console.log("deleteAdhesion :", typeof deleteAdhesion);
console.log("protegerRoute :", typeof protegerRoute);

// GET /api/adhesions
router.get("/", protegerRoute, getAdhesions);

// GET /api/adhesions/:id
router.get("/:id", protegerRoute, getAdhesionById);

// POST /api/adhesions
router.post("/", protegerRoute, createAdhesion);

// PUT /api/adhesions/:id
router.put("/:id", protegerRoute, updateAdhesion);

// DELETE /api/adhesions/:id
router.delete("/:id", protegerRoute, deleteAdhesion);

module.exports = router;