const mongoose = require("mongoose");

const beneficiaireSchema = new mongoose.Schema(
  {
    numeroCMU: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },

    prenom: {
      type: String,
      required: true,
      trim: true,
    },

    nom: {
      type: String,
      required: true,
      trim: true,
    },

    sexe: {
      type: String,
      enum: ["Homme", "Femme"],
      required: true,
    },

    dateNaissance: {
      type: Date,
    },

    telephone: {
      type: String,
      trim: true,
    },

    adresse: {
      type: String,
      trim: true,
    },

    region: {
      type: String,
      trim: true,
    },

    departement: {
      type: String,
      trim: true,
    },

    commune: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commune",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Beneficiaire ||
  mongoose.model("Beneficiaire", beneficiaireSchema);
