
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

    // Adhésions créées pendant le mois courant
    const adhesionsMois =
      await Adhesion.countDocuments({
        createdAt: {
          $gte: debutMois,
          $lt: finMois,
        },
      });

    const adhesionsActives =
      await Adhesion.countDocuments({
        statut: "Actif",
        dateFin: { $gte: maintenant },
      });

    const adhesionsExpirees =
      await Adhesion.countDocuments({
        statut: "Expiré",
      });

    const adhesionsSuspendues =
      await Adhesion.countDocuments({
        statut: "Suspendu",
      });

    const nouvellesAdhesions =
      await Adhesion.countDocuments({
        typeAdhesion: "Nouvelle",
      });

    const renouvellements =
      await Adhesion.countDocuments({
        typeAdhesion: "Renouvellement",
      });

    // Montant total des adhésions
    const montantAdhesionsResult =
      await Adhesion.aggregate([
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

    // Prochaine échéance
    const prochaineEcheance =
      await Adhesion.findOne({
        statut: "Actif",
        dateFin: { $gte: maintenant },
      })
        .sort({ dateFin: 1 })
        .populate("beneficiaire", "prenom nom");

    // =====================================================
    // PAIEMENTS : STATISTIQUES GÉNÉRALES
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

      Paiement.countDocuments({
        statut: "En retard",
      }),

      Paiement.countDocuments({
        statut: "Annulé",
      }),
    ]);

    // =====================================================
    // PAIEMENTS DU MOIS
    // =====================================================

    const filtrePaiementsMois = {
      statut: "Payé",
      datePaiement: {
        $gte: debutMois,
        $lt: finMois,
      },
    };

    // Nombre de paiements payés pendant le mois
    const paiementsMois =
      await Paiement.countDocuments(
        filtrePaiementsMois
      );

    // =====================================================
    // MONTANT ENCAISSÉ DU MOIS
    // =====================================================

    // Récupérer les paiements concernés pour vérifier
    // les montants et les dates réellement enregistrés.
    const paiementsDuMois =
      await Paiement.find(
        filtrePaiementsMois
      ).select("montant datePaiement statut");

    const montantPaiementsMois =
      paiementsDuMois.reduce(
        (total, paiement) =>
          total + Number(paiement.montant || 0),
        0
      );

    // =====================================================
    // MONTANT TOTAL DE TOUS LES PAIEMENTS PAYÉS
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
            total: { $sum: "$montant" },
          },
        },
      ]);

    const montantPaiements =
      montantPaiementsResult[0]?.total ?? 0;

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
    // OBJET DES STATISTIQUES
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
            beneficiaire:
              prochaineEcheance.beneficiaire
                ? `${prochaineEcheance.beneficiaire.prenom} ${prochaineEcheance.beneficiaire.nom}`
                : "Bénéficiaire inconnu",
          }
        : null,
    };

    // =====================================================
    // DEBUG : VÉRIFICATION DES CALCULS
    // =====================================================

    console.log("===== DASHBOARD CMU =====");
    console.log("Début du mois :", debutMois);
    console.log("Fin du mois :", finMois);
    console.log("Total bénéficiaires :", totalBeneficiaires);
    console.log("Adhésions du mois :", adhesionsMois);
    console.log("Total paiements :", totalPaiements);
    console.log("Paiements payés :", paiementsPayes);
    console.log("Paiements payés du mois :", paiementsMois);
    console.log(
      "Paiements trouvés ce mois :",
      paiementsDuMois
    );
    console.log(
      "Montant encaissé ce mois :",
      montantPaiementsMois
    );
    console.log("Paiements en retard :", paiementsRetard);
    console.log("=========================");

    // =====================================================
    // RÉPONSE AU FRONTEND
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
