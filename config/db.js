const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const connexion = await mongoose.connect(process.env.URL_BD);

    console.log("=================================");
    console.log("✅ MongoDB connecté");
    console.log("🌐 Serveur :", connexion.connection.host);
    console.log("📁 Base :", connexion.connection.name);
    console.log("=================================");
  } catch (error) {
    console.error("❌ Erreur MongoDB :", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;