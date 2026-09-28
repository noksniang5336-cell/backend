const mongoose = require("mongoose");
const Beneficiaire = require("../models/Beneficiaire");

/* =========================================================
   CRÉER UN BÉNÉFICIAIRE
========================================================= */

const creerBeneficiaire = async (req, res) => {
  try {
    const {
      numeroCMU,
      prenom,
      nom,
      sexe,
      dateNaissance,
      telephone,
      adresse,
      region,
      departement,
      commune,
    } = req.body;

    // Vérification des champs obligatoires
    if (!numeroCMU || !prenom || !nom) {
      return res.status(400).json({
        message:
          "Le numéro CMU, le prénom et le nom sont obligatoires.",
      });
    }

    // Vérifier si le numéro CMU existe déjà
    const existe = await Beneficiaire.findOne({
      numeroCMU: numeroCMU.trim(),
    });

    if (existe) {
      return res.status(409).json({
        message: "Ce numéro CMU existe déjà.",
      });
    }

    // Vérification de la commune
    if (commune && !mongoose.Types.ObjectId.isValid(commune)) {
      return res.status(400).json({
        message: "L'identifiant de la commune est invalide.",
      });
    }

    const beneficiaire = await Beneficiaire.create({
      numeroCMU: numeroCMU.trim(),
      prenom: prenom.trim(),
      nom: nom.trim(),
      sexe,
      dateNaissance: dateNaissance || null,
      telephone: telephone?.trim() || "",
      adresse: adresse?.trim() || "",
      region: region?.trim() || "",
      departement: departement?.trim() || "",
      commune: commune || null,
    });

    // Récupérer également les informations de la commune
    const resultat = await Beneficiaire.findById(
      beneficiaire._id
    ).populate("commune");

    return res.status(201).json({
      message: "Bénéficiaire créé avec succès.",
      beneficiaire: resultat,
    });
  } catch (error) {
    console.error(
      "Erreur création bénéficiaire :",
      error
    );

    // Numéro CMU unique
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ce numéro CMU existe déjà.",
      });
    }

    return res.status(500).json({
      message:
        error.message ||
        "Erreur lors de la création du bénéficiaire.",
    });
  }
};

/* =========================================================
   OBTENIR TOUS LES BÉNÉFICIAIRES
========================================================= */

const obtenirBeneficiaires = async (req, res) => {
  try {
    const beneficiaires = await Beneficiaire.find()
      .populate("commune")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      beneficiaires,
    });
  } catch (error) {
    console.error(
      "Erreur récupération bénéficiaires :",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Erreur lors de la récupération des bénéficiaires.",
    });
  }
};

/* =========================================================
   OBTENIR UN BÉNÉFICIAIRE PAR ID
========================================================= */

const obtenirBeneficiaireParId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Identifiant du bénéficiaire invalide.",
      });
    }

    const beneficiaire = await Beneficiaire.findById(id)
      .populate("commune");

    if (!beneficiaire) {
      return res.status(404).json({
        message: "Bénéficiaire introuvable.",
      });
    }

    return res.status(200).json({
      beneficiaire,
    });
  } catch (error) {
    console.error(
      "Erreur récupération bénéficiaire :",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Erreur lors de la récupération du bénéficiaire.",
    });
  }
};

/* =========================================================
   MODIFIER UN BÉNÉFICIAIRE
========================================================= */

const modifierBeneficiaire = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Identifiant du bénéficiaire invalide.",
      });
    }

    const {
      numeroCMU,
      prenom,
      nom,
      sexe,
      dateNaissance,
      telephone,
      adresse,
      region,
      departement,
      commune,
    } = req.body;

    if (!numeroCMU || !prenom || !nom) {
      return res.status(400).json({
        message:
          "Le numéro CMU, le prénom et le nom sont obligatoires.",
      });
    }

    if (commune && !mongoose.Types.ObjectId.isValid(commune)) {
      return res.status(400).json({
        message: "L'identifiant de la commune est invalide.",
      });
    }

    // Vérifier que le numéro CMU n'appartient pas
    // à un autre bénéficiaire
    const numeroExiste = await Beneficiaire.findOne({
      numeroCMU: numeroCMU.trim(),
      _id: {
        $ne: id,
      },
    });

    if (numeroExiste) {
      return res.status(409).json({
        message:
          "Ce numéro CMU est déjà utilisé par un autre bénéficiaire.",
      });
    }

    const beneficiaire =
      await Beneficiaire.findByIdAndUpdate(
        id,
        {
          numeroCMU: numeroCMU.trim(),
          prenom: prenom.trim(),
          nom: nom.trim(),
          sexe,
          dateNaissance: dateNaissance || null,
          telephone: telephone?.trim() || "",
          adresse: adresse?.trim() || "",
          region: region?.trim() || "",
          departement: departement?.trim() || "",
          commune: commune || null,
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate("commune");

    if (!beneficiaire) {
      return res.status(404).json({
        message: "Bénéficiaire introuvable.",
      });
    }

    return res.status(200).json({
      message:
        "Bénéficiaire modifié avec succès.",
      beneficiaire,
    });
  } catch (error) {
    console.error(
      "Erreur modification bénéficiaire :",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Ce numéro CMU existe déjà.",
      });
    }

    return res.status(500).json({
      message:
        error.message ||
        "Erreur lors de la modification du bénéficiaire.",
    });
  }
};

/* =========================================================
   SUPPRIMER UN BÉNÉFICIAIRE
========================================================= */

const supprimerBeneficiaire = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Identifiant du bénéficiaire invalide.",
      });
    }

    const beneficiaire =
      await Beneficiaire.findByIdAndDelete(id);

    if (!beneficiaire) {
      return res.status(404).json({
        message: "Bénéficiaire introuvable.",
      });
    }

    return res.status(200).json({
      message:
        "Bénéficiaire supprimé avec succès.",
    });
  } catch (error) {
    console.error(
      "Erreur suppression bénéficiaire :",
      error
    );

    return res.status(500).json({
      message:
        error.message ||
        "Erreur lors de la suppression du bénéficiaire.",
    });
  }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  creerBeneficiaire,
  obtenirBeneficiaires,
  obtenirBeneficiaireParId,
  modifierBeneficiaire,
  supprimerBeneficiaire,
};