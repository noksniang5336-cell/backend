const express = require("express");

const {
  getRapport,
} = require("../controllers/rapportController");

const {
  protegerRoute,
} = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/rapports
router.get("/", protegerRoute, getRapport);

module.exports = router;