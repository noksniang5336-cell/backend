
const mongoose = require("mongoose");
const Paiement = require("../models/Paiement");
const Beneficiaire = require("../models/Beneficiaire");

// ===============================
// CRÉER UN PAIEMENT
// ===============================
const createPaiement = async (req, res) => {
  try {
    console.log("📥 Données paiement reçues :", req.body);

    const {
      beneficiaire,
      montant,
      datePaiement,
      moyen,
      statut,
      observation,
    } = req.body;

    // Vérifier le bénéficiaire
    if (!beneficiaire) {
      return res.status(400).json({
        success: false,
        message: "Le bénéficiaire est obligatoire",
      });
    }

    // Vérifier que l'ID est un ObjectId MongoDB valide
    if (!mongoose.Types.ObjectId.isValid(beneficiaire)) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant du bénéficiaire est invalide",
      });
    }

    // Vérifier que le bénéficiaire existe
    const beneficiaireExiste = await Beneficiaire.findById(beneficiaire);

    if (!beneficiaireExiste) {
      return res.status(404).json({
        success: false,
        message: "Le bénéficiaire sélectionné n'existe pas",
      });
    }

    // Vérifier le montant
    if (montant === undefined || montant === null || montant === "") {
      return res.status(400).json({
        success: false,
        message: "Le montant est obligatoire",
      });
    }

    const montantNumber = Number(montant);

    if (Number.isNaN(montantNumber)) {
      return res.status(400).json({
        success: false,
        message: "Le montant doit être un nombre",
      });
    }

    if (montantNumber < 0) {
      return res.status(400).json({
        success: false,
        message: "Le montant ne peut pas être négatif",
      });
    }

    // Vérifier le moyen de paiement
    const moyensAutorises = [
      "Espèces",
      "Wave",
      "Orange Money",
      "Free Money",
      "Virement",
      "Chèque",
    ];

    if (!moyensAutorises.includes(moyen)) {
      return res.status(400).json({
        success: false,
        message: `Moyen de paiement invalide : ${moyen}`,
      });
    }

    // Vérifier le statut
    const statutsAutorises = [
      "Payé",
      "En attente",
      "En retard",
      "Annulé",
    ];

    if (statut && !statutsAutorises.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: `Statut de paiement invalide : ${statut}`,
      });
    }

    // Créer le paiement
    const paiement = await Paiement.create({
      beneficiaire,
      montant: montantNumber,
      datePaiement: datePaiement || new Date(),
      moyen,
      statut: statut || "Payé",
      observation: observation || "",
    });

    console.log("✅ Paiement créé :", paiement);

    // Récupérer le paiement avec les informations du bénéficiaire
    const paiementComplet = await Paiement.findById(paiement._id).populate(
      "beneficiaire",
      "numeroCMU prenom nom"
    );

    res.status(201).json({
      success: true,
      message: "Paiement créé avec succès",
      paiement: paiementComplet,
    });
  } catch (error) {
    console.error("❌ ERREUR CRÉATION PAIEMENT :", error);
    console.error("❌ NOM ERREUR :", error.name);
    console.error("❌ MESSAGE :", error.message);
    console.error("❌ STACK :", error.stack);

    // Erreur de validation Mongoose
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation des données",
        error: error.message,
      });
    }

    // Erreur ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Identifiant MongoDB invalide",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur lors de la création du paiement",
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
      success: true,
      paiements,
    });
  } catch (error) {
    console.error("❌ Erreur récupération paiements :", error);

    res.status(500).json({
      success: false,
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
        success: false,
        message: "Paiement introuvable",
      });
    }

    res.status(200).json({
      success: true,
      paiement,
    });
  } catch (error) {
    console.error("❌ Erreur récupération paiement :", error);

    res.status(500).json({
      success: false,
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
    ).populate("beneficiaire", "numeroCMU prenom nom");

    if (!paiement) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable",
      });
    }

    res.status(200).json({
      success: true,
      message: "Paiement modifié avec succès",
      paiement,
    });
  } catch (error) {
    console.error("❌ Erreur modification paiement :", error);

    res.status(500).json({
      success: false,
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
        success: false,
        message: "Paiement introuvable",
      });
    }

    res.status(200).json({
      success: true,
      message: "Paiement supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur suppression paiement :", error);

    res.status(500).json({
      success: false,
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
