
const Beneficiaire = require("../models/Beneficiaire");
const Adhesion = require("../models/Adhesion");
const Paiement = require("../models/Paiement");

// =====================================================
// GET /api/dashboard/stats
// Statistiques du tableau de bord CMU
// =====================================================

const getDashboardStats = async (req, res) => {
  try {
    const maintenant = new Date();

    // =====================================================
    // DATES DU MOIS COURANT
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

    const [
      totalBeneficiaires,
      hommes,
      femmes,
      sexeNonRenseigne,
    ] = await Promise.all([
      Beneficiaire.countDocuments(),

      Beneficiaire.countDocuments({
        sexe: "Homme",
      }),

      Beneficiaire.countDocuments({
        sexe: "Femme",
      }),

      Beneficiaire.countDocuments({
        $or: [
          { sexe: { $exists: false } },
          { sexe: null },
          { sexe: "" },
        ],
      }),
    ]);

    // Bénéficiaires ayant au moins une adhésion active
    const beneficiairesActifsIds =
      await Adhesion.distinct("beneficiaire", {
        statut: "Actif",
        dateFin: { $gte: maintenant },
      });

    const beneficiairesActifs =
      beneficiairesActifsIds.length;

    // =====================================================
    // ADHÉSIONS
    // =====================================================

    // Adhésions créées pendant le mois courant.
    // createdAt est fourni par timestamps: true dans le modèle.
    const adhesionsMois = await Adhesion.countDocuments({
      createdAt: {
        $gte: debutMois,
        $lt: finMois,
      },
    });

    // Adhésions actuellement actives et non expirées
    const adhesionsActives = await Adhesion.countDocuments({
      statut: "Actif",
      dateFin: { $gte: maintenant },
    });

    const adhesionsExpirees = await Adhesion.countDocuments({
      statut: "Expiré",
    });

    const adhesionsSuspendues = await Adhesion.countDocuments({
      statut: "Suspendu",
    });

    const nouvellesAdhesions = await Adhesion.countDocuments({
      typeAdhesion: "Nouvelle",
    });

    const renouvellements = await Adhesion.countDocuments({
      typeAdhesion: "Renouvellement",
    });

    // Montant total des adhésions enregistrées
    const montantAdhesionsResult = await Adhesion.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$montant" },
        },
      },
    ]);

    const montantAdhesions =
      montantAdhesionsResult[0]?.total ?? 0;

    // Adhésions actives qui expirent dans les 30 jours
    const adhesionsBientotExpirees =
      await Adhesion.countDocuments({
        statut: "Actif",
        dateFin: {
          $gte: maintenant,
          $lte: dans30Jours,
        },
      });

    // Prochaine échéance d'adhésion
    const prochaineEcheance = await Adhesion.findOne({
      statut: "Actif",
      dateFin: { $gte: maintenant },
    })
      .sort({ dateFin: 1 })
      .populate("beneficiaire", "prenom nom");

    // =====================================================
    // PAIEMENTS
    // =====================================================

    const [
      totalPaiements,
      paiementsPayes,
      paiementsAttente,
      paiementsRetard,
      paiementsAnnules,
    ] = await Promise.all([
      Paiement.countDocuments(),

      Paiement.countDocuments({
        statut: "Payé",
      }),

      Paiement.countDocuments({
        statut: "En attente",
      }),

      // Paiements ayant le statut exact "En retard"
      Paiement.countDocuments({
        statut: "En retard",
      }),

      Paiement.countDocuments({
        statut: "Annulé",
      }),
    ]);

    // Nombre de paiements encaissés pendant le mois
    const paiementsMois = await Paiement.countDocuments({
      statut: "Payé",
      datePaiement: {
        $gte: debutMois,
        $lt: finMois,
      },
    });

    // Montant total de tous les paiements payés
    const montantPaiementsResult = await Paiement.aggregate([
      {
        $match: {
          statut: "Payé",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$montant" },
        },
      },
    ]);

    const montantPaiements =
      montantPaiementsResult[0]?.total ?? 0;

    // Montant réellement encaissé pendant le mois courant
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
            total: { $sum: "$montant" },
          },
        },
      ]);

    const montantPaiementsMois =
      montantPaiementsMoisResult[0]?.total ?? 0;

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
            total: { $sum: 1 },
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
    // CONSTRUCTION DE LA RÉPONSE
    // =====================================================

    const statistiques = {
      // Bénéficiaires
      totalBeneficiaires,
      beneficiairesActifs,
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
            dateFin: prochaineEcheance.dateFin,
            numeroAdhesion:
              prochaineEcheance.numeroAdhesion,
            beneficiaire: prochaineEcheance.beneficiaire
              ? `${prochaineEcheance.beneficiaire.prenom} ${prochaineEcheance.beneficiaire.nom}`
              : "Bénéficiaire inconnu",
          }
        : null,
    };

    // =====================================================
    // JOURNAL DES STATISTIQUES
    // =====================================================

    console.log("===== STATISTIQUES DASHBOARD CMU =====");
    console.log("Total bénéficiaires :", totalBeneficiaires);
    console.log("Bénéficiaires actifs :", beneficiairesActifs);
    console.log("Adhésions créées ce mois :", adhesionsMois);
    console.log("Adhésions actives :", adhesionsActives);
    console.log("Paiements encaissés ce mois :", paiementsMois);
    console.log("Montant encaissé ce mois :", montantPaiementsMois);
    console.log("Paiements en retard :", paiementsRetard);
    console.log("======================================");

    // =====================================================
    // ENVOI AU FRONTEND REACT
    // =====================================================

    return res.status(200).json({
      success: true,
      data: statistiques,
    });
  } catch (error) {
    console.error(
      "Erreur statistiques Dashboard :",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Erreur lors de la récupération des statistiques.",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
};
