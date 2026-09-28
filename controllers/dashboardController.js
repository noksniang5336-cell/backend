const Beneficiaire = require("../models/Beneficiaire");
const Adhesion = require("../models/Adhesion");
const Paiement = require("../models/Paiement");

// =====================================================
// GET /api/dashboard/stats
// Statistiques réelles depuis MongoDB
// =====================================================
const getDashboardStats = async (req, res) => {
  try {
    const maintenant = new Date();

    // =====================================================
    // DATES
    // =====================================================

    const debutMois = new Date(
      maintenant.getFullYear(),
      maintenant.getMonth(),
      1
    );

    const finMois = new Date(
      maintenant.getFullYear(),
      maintenant.getMonth() + 1,
      1
    );

    const dans30Jours = new Date(maintenant);
    dans30Jours.setDate(dans30Jours.getDate() + 30);

    // =====================================================
    // BÉNÉFICIAIRES
    // =====================================================

    const totalBeneficiaires =
      await Beneficiaire.countDocuments();

    // Bénéficiaires ayant au moins une adhésion active
    const beneficiairesActifsIds =
      await Adhesion.distinct("beneficiaire", {
        statut: "Actif",
      });

    const beneficiairesActifs =
      beneficiairesActifsIds.length;

    // Hommes
    const hommes = await Beneficiaire.countDocuments({
      sexe: "Homme",
    });

    // Femmes
    const femmes = await Beneficiaire.countDocuments({
      sexe: "Femme",
    });

    // Sexe non renseigné
    const sexeNonRenseigne =
      await Beneficiaire.countDocuments({
        $or: [
          { sexe: { $exists: false } },
          { sexe: null },
          { sexe: "" },
        ],
      });

    // =====================================================
    // ADHÉSIONS
    // =====================================================

    // Adhésions créées ce mois
    const adhesionsMois =
      await Adhesion.countDocuments({
        createdAt: {
          $gte: debutMois,
          $lt: finMois,
        },
      });

    // Adhésions actives
    const adhesionsActives =
      await Adhesion.countDocuments({
        statut: "Actif",
      });

    // Adhésions expirées
    const adhesionsExpirees =
      await Adhesion.countDocuments({
        statut: "Expiré",
      });

    // Adhésions suspendues
    const adhesionsSuspendues =
      await Adhesion.countDocuments({
        statut: "Suspendu",
      });

    // =====================================================
    // TYPE D'ADHÉSION
    // =====================================================

    // IMPORTANT :
    // Si ton modèle utilise "type", garder "type".
    // Si ton modèle utilise "typeAdhesion", remplacer ici.

    const nouvellesAdhesions =
      await Adhesion.countDocuments({
        type: "Nouvelle",
      });

    const renouvellements =
      await Adhesion.countDocuments({
        type: "Renouvellement",
      });

    // =====================================================
    // MONTANT TOTAL DES ADHÉSIONS
    // =====================================================

    const montantAdhesionsResult =
      await Adhesion.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$montant",
            },
          },
        },
      ]);

    const montantAdhesions =
      montantAdhesionsResult.length > 0
        ? montantAdhesionsResult[0].total
        : 0;

    // =====================================================
    // ADHÉSIONS BIENTÔT EXPIRÉES
    // =====================================================

    const adhesionsBientotExpirees =
      await Adhesion.countDocuments({
        statut: "Actif",
        dateFin: {
          $gte: maintenant,
          $lte: dans30Jours,
        },
      });

    // =====================================================
    // PROCHAINE ÉCHÉANCE
    // =====================================================

    const prochaineEcheance =
      await Adhesion.findOne({
        statut: "Actif",
        dateFin: {
          $gte: maintenant,
        },
      })
        .sort({ dateFin: 1 })
        .populate(
          "beneficiaire",
          "prenom nom"
        );

    // =====================================================
    // PAIEMENTS
    // =====================================================

    const totalPaiements =
      await Paiement.countDocuments();

    const paiementsPayes =
      await Paiement.countDocuments({
        statut: "Payé",
      });

    const paiementsAttente =
      await Paiement.countDocuments({
        statut: "En attente",
      });

    const paiementsRetard =
      await Paiement.countDocuments({
        statut: "En retard",
      });

    const paiementsAnnules =
      await Paiement.countDocuments({
        statut: "Annulé",
      });

    // =====================================================
    // PAIEMENTS DU MOIS
    // =====================================================

    const paiementsMois =
      await Paiement.countDocuments({
        datePaiement: {
          $gte: debutMois,
          $lt: finMois,
        },
      });

    // =====================================================
    // MONTANT TOTAL DES PAIEMENTS
    // =====================================================

    const montantPaiementsResult =
      await Paiement.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: "$montant",
            },
          },
        },
      ]);

    const montantPaiements =
      montantPaiementsResult.length > 0
        ? montantPaiementsResult[0].total
        : 0;

    // =====================================================
    // MONTANT DES PAIEMENTS DU MOIS
    // =====================================================

    const montantPaiementsMoisResult =
      await Paiement.aggregate([
        {
          $match: {
            statut: "Payé",
            datePaiement: {
              $gte: debutMois,
              $lt: finMois,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$montant",
            },
          },
        },
      ]);

    const montantPaiementsMois =
      montantPaiementsMoisResult.length > 0
        ? montantPaiementsMoisResult[0].total
        : 0;

    // =====================================================
    // BÉNÉFICIAIRES PAR COMMUNE
    // =====================================================

    const beneficiairesParCommune =
      await Beneficiaire.aggregate([
        {
          $match: {
            commune: {
              $exists: true,
              $ne: null,
            },
          },
        },

        {
          $group: {
            _id: "$commune",
            total: {
              $sum: 1,
            },
          },
        },

        {
          $lookup: {
            from: "communes",
            localField: "_id",
            foreignField: "_id",
            as: "communeInfo",
          },
        },

        {
          $unwind: {
            path: "$communeInfo",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            _id: 0,
            nom: {
              $ifNull: [
                "$communeInfo.nom",
                "Commune inconnue",
              ],
            },
            total: 1,
          },
        },

        {
          $sort: {
            total: -1,
          },
        },

        {
          $limit: 10,
        },
      ]);

    // =====================================================
    // RÉPONSE
    // =====================================================

    res.status(200).json({
      success: true,

      data: {
        // Bénéficiaires
        totalBeneficiaires,
        beneficiairesActifs,

        // Sexe
        hommes,
        femmes,
        sexeNonRenseigne,

        // Adhésions
        adhesionsMois,
        adhesionsActives,
        adhesionsExpirees,
        adhesionsSuspendues,
        nouvellesAdhesions,
        renouvellements,
        montantAdhesions,
        adhesionsBientotExpirees,

        // Paiements
        totalPaiements,
        paiementsPayes,
        paiementsAttente,
        paiementsRetard,
        paiementsAnnules,
        paiementsMois,
        montantPaiements,
        montantPaiementsMois,

        // Communes
        beneficiairesParCommune,

        // Prochaine échéance
        prochaineEcheance: prochaineEcheance
          ? {
              dateFin:
                prochaineEcheance.dateFin,

              numeroAdhesion:
                prochaineEcheance.numeroAdhesion,

              beneficiaire:
                prochaineEcheance.beneficiaire
                  ? `${prochaineEcheance.beneficiaire.prenom} ${prochaineEcheance.beneficiaire.nom}`
                  : "Bénéficiaire inconnu",
            }
          : null,
      },
    });
  } catch (error) {
    console.error(
      "❌ Erreur statistiques Dashboard :",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};