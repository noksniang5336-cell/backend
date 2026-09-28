const express = require("express");

const {
  createPaiement,
  getPaiements,
  getPaiementById,
  updatePaiement,
  deletePaiement,
} = require("../controllers/paiementController");

const { protegerRoute } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protegerRoute, getPaiements);

router.get("/:id", protegerRoute, getPaiementById);

router.post("/", protegerRoute, createPaiement);

router.put("/:id", protegerRoute, updatePaiement);

router.delete("/:id", protegerRoute, deletePaiement);

module.exports = router;