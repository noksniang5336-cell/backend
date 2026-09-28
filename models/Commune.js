
const mongoose = require("mongoose");

const communeSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de la commune est obligatoire"],
      unique: true,
      trim: true,
    },

    region: {
      type: String,
      required: [true, "La région est obligatoire"],
      trim: true,
    },

    departement: {
      type: String,
      required: [true, "Le département est obligatoire"],
      trim: true,
    },

    code: {
      type: String,
      trim: true,
      default: "",
    },

    statut: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Commune", communeSchema);

