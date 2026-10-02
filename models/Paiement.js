const mongoose = require("mongoose");

const paiementSchema = new mongoose.Schema(
  {
    beneficiaire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beneficiaire",
      required: [true, "Le bénéficiaire est obligatoire"],
    },

    montant: {
      type: Number,
      required: [true, "Le montant est obligatoire"],
      min: [0, "Le montant ne peut pas être négatif"],
    },

    datePaiement: {
      type: Date,
      required: [true, "La date du paiement est obligatoire"],
      default: Date.now,
    },

    moyen: {
      type: String,
      required: [true, "Le moyen de paiement est obligatoire"],
      enum: {
        values: [
          "Espèces",
          "Wave",
          "Orange Money",
          "Free Money",
          "Virement",
          "Chèque",
        ],
        message: "Le moyen de paiement sélectionné est invalide",
      },
      trim: true,
    },

    statut: {
      type: String,
      enum: {
        values: [
          "Payé",
          "En attente",
          "En retard",
          "Annulé",
        ],
        message: "Le statut du paiement est invalide",
      },
      default: "Payé",
      trim: true,
    },

    observation: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Paiement", paiementSchema);