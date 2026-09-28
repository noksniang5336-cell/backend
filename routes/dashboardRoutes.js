const express = require("express");

const router = express.Router();

const {
  getDashboardStats,
} = require("../controllers/dashboardController");

const {
  protegerRoute,
} = require("../middleware/authMiddleware");

console.log(
  "getDashboardStats :",
  typeof getDashboardStats
);

console.log(
  "protegerRoute :",
  typeof protegerRoute
);

router.get(
  "/stats",
  protegerRoute,
  getDashboardStats
);

module.exports = router;