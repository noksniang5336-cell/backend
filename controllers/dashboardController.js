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
      1,
      0,
      0,
      0,
      0
    );

    const finMois = new Date(
      maintenant.getFullYear(),
      maintenant.getMonth() + 1,
      1,
      0,
      0,
      0,
      0
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
        dateFin: {
          $gte: maintenant,
        },
      });

    const beneficiairesActifs =
      beneficiairesActifsIds.length;

    // Hommes
    const hommes =
      await Beneficiaire.countDocuments({
        sexe: "Homme",
      });

    // Femmes
    const femmes =
      await Beneficiaire.countDocuments({
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

    // Adhésions commencées ce mois
    const adhesionsMois =
      await Adhesion.countDocuments({
        dateDebut: {
          $gte: debutMois,
          $lt: finMois,
        },
      });

    // Adhésions actuellement actives
    const adhesionsActives =
      await Adhesion.countDocuments({
        statut: "Actif",
        dateFin: {
          $gte: maintenant,
        },
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
    // TYPES D'ADHÉSION
    // =====================================================

    const nouvellesAdhesions =
      await Adhesion.countDocuments({
        typeAdhesion: "Nouvelle",
      });

    const renouvellements =
      await Adhesion.countDocuments({
        typeAdhesion: "Renouvellement",
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
        .sort({
          dateFin: 1,
        })
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
    // PAIEMENTS PAYÉS DU MOIS
    // =====================================================

    const paiementsMois =
      await Paiement.countDocuments({
        statut: "Payé",
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
          $match: {
            statut: "Payé",
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

    const statistiques = {
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
    };

    // =====================================================
    // DEBUG
    // =====================================================

    console.log(
      "📊 STATISTIQUES DASHBOARD"
    );

    console.log(
      "👥 Total bénéficiaires :",
      totalBeneficiaires
    );

    console.log(
      "✅ Bénéficiaires actifs :",
      beneficiairesActifs
    );

    console.log(
      "📄 Adhésions totales :",
      await Adhesion.countDocuments()
    );

    console.log(
      "🟢 Adhésions actives :",
      adhesionsActives
    );

    console.log(
      "📅 Adhésions ce mois :",
      adhesionsMois
    );

    console.log(
      "💰 Paiements ce mois :",
      paiementsMois
    );

    console.log(
      "💵 Montant ce mois :",
      montantPaiementsMois
    );

    console.log(
      "⚠️ Paiements en retard :",
      paiementsRetard
    );

    console.log(
      "=============================="
    );

    // =====================================================
    // ENVOI
    // =====================================================

    return res.status(200).json({
      success: true,
      data: statistiques,
    });

  } catch (error) {
    console.error(
      "❌ Erreur statistiques Dashboard :",
      error
    );

    return res.status(500).json({
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
