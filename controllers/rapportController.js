const Beneficiaire = require("../models/Beneficiaire");
const Adhesion = require("../models/Adhesion");
const Paiement = require("../models/Paiement");

const getRapport = async (req, res) => {
  try {
    const {
      type = "beneficiaires",
      periode = "mois",
    } = req.query;

    const maintenant = new Date();
    let debut = new Date();

    // ===============================
    // PÉRIODE
    // ===============================
    if (periode === "jour") {
      debut.setHours(0, 0, 0, 0);
    } else if (periode === "semaine") {
      debut.setDate(maintenant.getDate() - 7);
    } else if (periode === "mois") {
      debut.setMonth(maintenant.getMonth() - 1);
    } else if (periode === "annee") {
      debut.setFullYear(maintenant.getFullYear() - 1);
    }

    // ===============================
    // BÉNÉFICIAIRES
    // ===============================
    if (type === "beneficiaires") {
      const total = await Beneficiaire.countDocuments();

      const actifs = await Adhesion.countDocuments({
        statut: "Actif",
      });

      const expires = await Adhesion.countDocuments({
        statut: "Expiré",
      });

      const suspendus = await Adhesion.countDocuments({
        statut: "Suspendu",
      });

      return res.status(200).json({
        success: true,
        data: {
          titre: "Rapport des bénéficiaires",
          total,
          actif: actifs,
          expire: expires,
          suspendu: suspendus,
        },
      });
    }

    // ===============================
    // ADHÉSIONS
    // ===============================
    if (type === "adhesions") {
      const total = await Adhesion.countDocuments({
        dateDebut: {
          $gte: debut,
        },
      });

      const actifs = await Adhesion.countDocuments({
        dateDebut: {
          $gte: debut,
        },
        statut: "Actif",
      });

      const expires = await Adhesion.countDocuments({
        dateDebut: {
          $gte: debut,
        },
        statut: "Expiré",
      });

      const suspendus = await Adhesion.countDocuments({
        dateDebut: {
          $gte: debut,
        },
        statut: "Suspendu",
      });

      return res.status(200).json({
        success: true,
        data: {
          titre: "Rapport des adhésions",
          total,
          actif: actifs,
          expire: expires,
          suspendu: suspendus,
        },
      });
    }

    // ===============================
    // PAIEMENTS
    // ===============================
    if (type === "paiements") {
      const paiements = await Paiement.find({
        createdAt: {
          $gte: debut,
        },
      });

      const total = paiements.reduce(
        (somme, paiement) =>
          somme + Number(paiement.montant || 0),
        0
      );

      const payes = paiements
        .filter((p) => p.statut === "Payé")
        .reduce(
          (somme, paiement) =>
            somme + Number(paiement.montant || 0),
          0
        );

      const attente = paiements
        .filter((p) => p.statut === "En attente")
        .reduce(
          (somme, paiement) =>
            somme + Number(paiement.montant || 0),
          0
        );

      const annules = paiements
        .filter((p) => p.statut === "Annulé")
        .reduce(
          (somme, paiement) =>
            somme + Number(paiement.montant || 0),
          0
        );

      return res.status(200).json({
        success: true,
        data: {
          titre: "Rapport des paiements",
          total,
          actif: payes,
          expire: attente,
          suspendu: annules,
        },
      });
    }

    return res.status(400).json({
      success: false,
      message: "Type de rapport invalide",
    });
  } catch (error) {
    console.error("Erreur rapport :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la génération du rapport",
      error: error.message,
    });
  }
};

module.exports = {
  getRapport,
};