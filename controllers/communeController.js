const Commune = require("../models/commune");
const Beneficiaire = require("../models/Beneficiaire");

// =====================================================
// CRÉER UNE COMMUNE
// =====================================================
const createCommune = async (req, res) => {
  try {
    const {
      nom,
      region,
      departement,
      code,
      statut,
      description,
    } = req.body;

    // Vérification des champs obligatoires
    if (!nom || !region || !departement) {
      return res.status(400).json({
        success: false,
        message:
          "Le nom, la région et le département sont obligatoires.",
      });
    }

    // Nettoyage
    const nomCommune = nom.trim();
    const regionCommune = region.trim();
    const departementCommune = departement.trim();

    // Vérifier si la commune existe déjà
    const communeExistante = await Commune.findOne({
      nom: {
        $regex: `^${nomCommune}$`,
        $options: "i",
      },
    });

    if (communeExistante) {
      return res.status(409).json({
        success: false,
        message: `La commune "${nomCommune}" existe déjà.`,
      });
    }

    // Création
    const commune = await Commune.create({
      nom: nomCommune,
      region: regionCommune,
      departement: departementCommune,
      code: code || "",
      statut: statut || "Active",
      description: description || "",
    });

    return res.status(201).json({
      success: true,
      message: "Commune créée avec succès.",
      commune,
    });
  } catch (error) {
    console.error("❌ Erreur création commune :", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Cette commune existe déjà.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création de la commune.",
      error: error.message,
    });
  }
};

// =====================================================
// RÉCUPÉRER TOUTES LES COMMUNES
// =====================================================
const getCommunes = async (req, res) => {
  try {
    const communes = await Commune.find()
      .sort({ nom: 1 })
      .lean();

    // Ajouter automatiquement le nombre de bénéficiaires
    const communesAvecBeneficiaires = await Promise.all(
      communes.map(async (commune) => {
        const nombreBeneficiaires =
          await Beneficiaire.countDocuments({
            commune: commune._id,
          });

        return {
          ...commune,
          beneficiaires: nombreBeneficiaires,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: communesAvecBeneficiaires.length,
      communes: communesAvecBeneficiaires,
    });
  } catch (error) {
    console.error(
      "❌ Erreur récupération communes :",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la récupération des communes.",
      error: error.message,
    });
  }
};

// =====================================================
// RÉCUPÉRER UNE COMMUNE PAR ID
// =====================================================
const getCommuneById = async (req, res) => {
  try {
    const commune = await Commune.findById(
      req.params.id
    ).lean();

    if (!commune) {
      return res.status(404).json({
        success: false,
        message: "Commune introuvable.",
      });
    }

    // Calcul automatique des bénéficiaires
    const nombreBeneficiaires =
      await Beneficiaire.countDocuments({
        commune: commune._id,
      });

    return res.status(200).json({
      success: true,
      commune: {
        ...commune,
        beneficiaires: nombreBeneficiaires,
      },
    });
  } catch (error) {
    console.error(
      "❌ Erreur récupération commune :",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Erreur serveur.",
      error: error.message,
    });
  }
};

// =====================================================
// MODIFIER UNE COMMUNE
// =====================================================
const updateCommune = async (req, res) => {
  try {
    const {
      nom,
      region,
      departement,
      code,
      statut,
      description,
    } = req.body;

    const commune = await Commune.findById(
      req.params.id
    );

    if (!commune) {
      return res.status(404).json({
        success: false,
        message: "Commune introuvable.",
      });
    }

    // Vérifier le nom
    if (nom) {
      const nomNettoye = nom.trim();

      const communeExistante =
        await Commune.findOne({
          nom: {
            $regex: `^${nomNettoye}$`,
            $options: "i",
          },
          _id: {
            $ne: req.params.id,
          },
        });

      if (communeExistante) {
        return res.status(409).json({
          success: false,
          message: `La commune "${nomNettoye}" existe déjà.`,
        });
      }

      commune.nom = nomNettoye;
    }

    // Région
    if (region !== undefined) {
      commune.region = region.trim();
    }

    // Département
    if (departement !== undefined) {
      commune.departement = departement.trim();
    }

    // Code
    if (code !== undefined) {
      commune.code = code.trim();
    }

    // Statut
    if (statut !== undefined) {
      commune.statut = statut;
    }

    // Description
    if (description !== undefined) {
      commune.description = description.trim();
    }

    await commune.save();

    // Calcul automatique
    const nombreBeneficiaires =
      await Beneficiaire.countDocuments({
        commune: commune._id,
      });

    return res.status(200).json({
      success: true,
      message: "Commune modifiée avec succès.",
      commune: {
        ...commune.toObject(),
        beneficiaires: nombreBeneficiaires,
      },
    });
  } catch (error) {
    console.error(
      "❌ Erreur modification commune :",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Une commune avec ce nom existe déjà.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la modification.",
      error: error.message,
    });
  }
};

// =====================================================
// SUPPRIMER UNE COMMUNE
// =====================================================
const deleteCommune = async (req, res) => {
  try {
    // Vérifier d'abord s'il existe des bénéficiaires
    // liés à cette commune
    const nombreBeneficiaires =
      await Beneficiaire.countDocuments({
        commune: req.params.id,
      });

    if (nombreBeneficiaires > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Impossible de supprimer cette commune car elle possède des bénéficiaires.",
        nombreBeneficiaires,
      });
    }

    const commune =
      await Commune.findByIdAndDelete(
        req.params.id
      );

    if (!commune) {
      return res.status(404).json({
        success: false,
        message: "Commune introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Commune supprimée avec succès.",
    });
  } catch (error) {
    console.error(
      "❌ Erreur suppression commune :",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la suppression.",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createCommune,
  getCommunes,
  getCommuneById,
  updateCommune,
  deleteCommune,
};