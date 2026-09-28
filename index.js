
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");

// ===============================
// IMPORT DES ROUTES
// ===============================
const authRoutes = require("./routes/authRoutes");
const beneficiaireRoute = require("./routes/beneficiaireRoute");
const adhesionRoutes = require("./routes/adhesionRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const communeRoutes = require("./routes/communeRoutes");
const paiementRoutes = require("./routes/paiementRoutes");
const rapportRoutes = require("./routes/rapportRoutes");

// ===============================
// APPLICATION EXPRESS
// ===============================
const app = express();

// ===============================
// CONNEXION MONGODB
// ===============================
connectDB();

// ===============================
// MIDDLEWARES
// ===============================
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

// ===============================
// ROUTES API
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/beneficiaires", beneficiaireRoute);
app.use("/api/adhesions", adhesionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/communes", communeRoutes);
app.use("/api/paiements", paiementRoutes);
app.use("/api/rapports", rapportRoutes);

// ===============================
// ROUTE PRINCIPALE
// ===============================
app.get("/", (req, res) => {
  res.json({
    message: "API CMU fonctionne correctement",
  });
});

// ===============================
// SERVEUR
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur le port ${PORT}`);
});
