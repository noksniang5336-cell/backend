const express = require("express");

const {
  createAdhesion,
  getAdhesions,
  getAdhesionById,
  updateAdhesion,
  deleteAdhesion,
} = require("../controllers/adhesionController");

const { protegerRoute } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protegerRoute, getAdhesions);
router.get("/:id", protegerRoute, getAdhesionById);
router.post("/", protegerRoute, createAdhesion);
router.put("/:id", protegerRoute, updateAdhesion);
router.delete("/:id", protegerRoute, deleteAdhesion);

module.exports = router;