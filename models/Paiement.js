const mongoose = require("mongoose");

const paiementSchema = new mongoose.Schema(
  {
    beneficiaire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beneficiaire",
      required: true,
    },

    montant: {
      type: Number,
      required: true,
      min: 0,
    },

    moyen: {
      type: String,
      enum: [
        "Espèces",
        "Wave",
        "Orange Money",
        "Free Money",
        "Virement",
        "Chèque",
      ],
      required: true,
    },

    statut: {
      type: String,
      enum: [
        "Payé",
        "En attente",
        "En retard",
        "Annulé",
      ],
      default: "Payé",
    },

    datePaiement: {
      type: Date,
      default: Date.now,
    },

    observation: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Paiement", paiementSchema);