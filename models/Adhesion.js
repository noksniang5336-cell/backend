const mongoose = require("mongoose");

const adhesionSchema = new mongoose.Schema(
  {
    beneficiaire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Beneficiaire",
      required: [true, "Le bénéficiaire est obligatoire"],
    },

    numeroAdhesion: {
      type: String,
      required: [true, "Le numéro d'adhésion est obligatoire"],
      unique: true,
      trim: true,
    },

    dateDebut: {
      type: Date,
      required: [true, "La date de début est obligatoire"],
    },

    dateFin: {
      type: Date,
      required: [true, "La date de fin est obligatoire"],
    },

    typeAdhesion: {
      type: String,
      enum: ["Nouvelle", "Renouvellement"],
      default: "Nouvelle",
    },

    statut: {
      type: String,
      enum: ["Actif", "Expiré", "Suspendu"],
      default: "Actif",
    },

    montant: {
      type: Number,
      default: 0,
      min: 0,
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

module.exports = mongoose.model("Adhesion", adhesionSchema);