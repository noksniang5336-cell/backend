const Paiement = require("../models/Paiement");

// ===============================
// CRÉER UN PAIEMENT
// ===============================
const createPaiement = async (req, res) => {
  try {
    const paiement = await Paiement.create(req.body);

    res.status(201).json({
      message: "Paiement créé avec succès",
      paiement,
    });
  } catch (error) {
    console.error("Erreur création paiement :", error);

    res.status(500).json({
      message: "Erreur lors de la création du paiement",
      error: error.message,
    });
  }
};

// ===============================
// RÉCUPÉRER TOUS LES PAIEMENTS
// ===============================
const getPaiements = async (req, res) => {
  try {
    const paiements = await Paiement.find()
      .populate("beneficiaire", "numeroCMU prenom nom")
      .sort({ createdAt: -1 });

    res.status(200).json({
      paiements,
    });
  } catch (error) {
    console.error("Erreur récupération paiements :", error);

    res.status(500).json({
      message: "Erreur lors de la récupération des paiements",
      error: error.message,
    });
  }
};

// ===============================
// RÉCUPÉRER UN PAIEMENT
// ===============================
const getPaiementById = async (req, res) => {
  try {
    const paiement = await Paiement.findById(req.params.id)
      .populate("beneficiaire", "numeroCMU prenom nom");

    if (!paiement) {
      return res.status(404).json({
        message: "Paiement introuvable",
      });
    }

    res.status(200).json({
      paiement,
    });
  } catch (error) {
    console.error("Erreur récupération paiement :", error);

    res.status(500).json({
      message: "Erreur lors de la récupération du paiement",
      error: error.message,
    });
  }
};

// ===============================
// MODIFIER UN PAIEMENT
// ===============================
const updatePaiement = async (req, res) => {
  try {
    const paiement = await Paiement.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!paiement) {
      return res.status(404).json({
        message: "Paiement introuvable",
      });
    }

    res.status(200).json({
      message: "Paiement modifié avec succès",
      paiement,
    });
  } catch (error) {
    console.error("Erreur modification paiement :", error);

    res.status(500).json({
      message: "Erreur lors de la modification du paiement",
      error: error.message,
    });
  }
};

// ===============================
// SUPPRIMER UN PAIEMENT
// ===============================
const deletePaiement = async (req, res) => {
  try {
    const paiement = await Paiement.findByIdAndDelete(req.params.id);

    if (!paiement) {
      return res.status(404).json({
        message: "Paiement introuvable",
      });
    }

    res.status(200).json({
      message: "Paiement supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression paiement :", error);

    res.status(500).json({
      message: "Erreur lors de la suppression du paiement",
      error: error.message,
    });
  }
};

module.exports = {
  createPaiement,
  getPaiements,
  getPaiementById,
  updatePaiement,
  deletePaiement,
};