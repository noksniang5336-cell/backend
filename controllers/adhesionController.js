const Adhesion = require("../models/Adhesion");
const Beneficiaire = require("../models/Beneficiaire");

// ======================================================
// CRÉER UNE ADHÉSION
// POST /api/adhesions
// ======================================================
const createAdhesion = async (req, res) => {
  try {
    const {
      beneficiaire,
      numeroAdhesion,
      dateDebut,
      dateFin,
      typeAdhesion,
      statut,
      montant,
      observation,
    } = req.body;

    // Vérification des champs obligatoires
    if (
      !beneficiaire ||
      !numeroAdhesion ||
      !dateDebut ||
      !dateFin
    ) {
      return res.status(400).json({
        message:
          "Bénéficiaire, numéro d'adhésion, date de début et date de fin sont obligatoires",
      });
    }

    // Vérifier le bénéficiaire
    const beneficiaireExiste = await Beneficiaire.findById(beneficiaire);

    if (!beneficiaireExiste) {
      return res.status(404).json({
        message: "Bénéficiaire introuvable",
      });
    }

    // Vérifier si le numéro d'adhésion existe déjà
    const adhesionExiste = await Adhesion.findOne({
      numeroAdhesion: numeroAdhesion.trim(),
    });

    if (adhesionExiste) {
      return res.status(409).json({
        message: "Ce numéro d'adhésion existe déjà",
      });
    }

    // Créer l'adhésion
    const adhesion = await Adhesion.create({
      beneficiaire,
      numeroAdhesion: numeroAdhesion.trim(),
      dateDebut,
      dateFin,
      typeAdhesion: typeAdhesion || "Nouvelle",
      statut: statut || "Actif",
      montant: Number(montant) || 0,
      observation: observation || "",
    });

    // Récupérer avec les informations du bénéficiaire
    const adhesionComplete = await Adhesion.findById(adhesion._id)
      .populate("beneficiaire");

    return res.status(201).json({
      message: "Adhésion créée avec succès",
      adhesion: adhesionComplete,
    });
  } catch (error) {
    console.error("Erreur createAdhesion :", error);

    // Erreur de validation Mongoose
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Erreur de validation",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    // Erreur numéro unique MongoDB
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ce numéro d'adhésion existe déjà",
      });
    }

    return res.status(500).json({
      message: "Erreur lors de la création de l'adhésion",
      error: error.message,
    });
  }
};

// ======================================================
// RÉCUPÉRER TOUTES LES ADHÉSIONS
// GET /api/adhesions
// ======================================================
const getAdhesions = async (req, res) => {
  try {
    const adhesions = await Adhesion.find()
      .populate("beneficiaire")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Liste des adhésions récupérée",
      adhesions,
    });
  } catch (error) {
    console.error("Erreur getAdhesions :", error);

    return res.status(500).json({
      message: "Erreur lors de la récupération des adhésions",
      error: error.message,
    });
  }
};

// ======================================================
// RÉCUPÉRER UNE ADHÉSION PAR ID
// GET /api/adhesions/:id
// ======================================================
const getAdhesionById = async (req, res) => {
  try {
    const adhesion = await Adhesion.findById(req.params.id)
      .populate("beneficiaire");

    if (!adhesion) {
      return res.status(404).json({
        message: "Adhésion introuvable",
      });
    }

    return res.status(200).json({
      adhesion,
    });
  } catch (error) {
    console.error("Erreur getAdhesionById :", error);

    return res.status(500).json({
      message: "Erreur lors de la récupération de l'adhésion",
      error: error.message,
    });
  }
};

// ======================================================
// MODIFIER UNE ADHÉSION
// PUT /api/adhesions/:id
// ======================================================
const updateAdhesion = async (req, res) => {
  try {
    const adhesion = await Adhesion.findById(req.params.id);

    if (!adhesion) {
      return res.status(404).json({
        message: "Adhésion introuvable",
      });
    }

    const adhesionModifiee = await Adhesion.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("beneficiaire");

    return res.status(200).json({
      message: "Adhésion modifiée avec succès",
      adhesion: adhesionModifiee,
    });
  } catch (error) {
    console.error("Erreur updateAdhesion :", error);

    return res.status(500).json({
      message: "Erreur lors de la modification de l'adhésion",
      error: error.message,
    });
  }
};

// ======================================================
// SUPPRIMER UNE ADHÉSION
// DELETE /api/adhesions/:id
// ======================================================
const deleteAdhesion = async (req, res) => {
  try {
    const adhesion = await Adhesion.findById(req.params.id);

    if (!adhesion) {
      return res.status(404).json({
        message: "Adhésion introuvable",
      });
    }

    await Adhesion.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      message: "Adhésion supprimée avec succès",
    });
  } catch (error) {
    console.error("Erreur deleteAdhesion :", error);

    return res.status(500).json({
      message: "Erreur lors de la suppression de l'adhésion",
      error: error.message,
    });
  }
};

module.exports = {
  createAdhesion,
  getAdhesions,
  getAdhesionById,
  updateAdhesion,
  deleteAdhesion,
};