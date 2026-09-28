
const express = require("express");
const router = express.Router();

const {
  creerBeneficiaire,
  obtenirBeneficiaires,
  obtenirBeneficiaireParId,
  modifierBeneficiaire,
  supprimerBeneficiaire,
} = require("../controllers/beneficiaireController");

// ===============================
// BÉNÉFICIAIRES
// ===============================

// Ajouter un bénéficiaire
router.post("/", creerBeneficiaire);

// Récupérer tous les bénéficiaires
router.get("/", obtenirBeneficiaires);

// Récupérer un bénéficiaire par son ID
router.get("/:id", obtenirBeneficiaireParId);

// Modifier un bénéficiaire
router.put("/:id", modifierBeneficiaire);

// Supprimer un bénéficiaire
router.delete("/:id", supprimerBeneficiaire);

module.exports = router;
