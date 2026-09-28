const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
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

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    telephone: {
      type: String,
      required: true,
      trim: true,
    },

    commune: {
      type: String,
      required: true,
      trim: true,
    },

    structure_sanitaire: {
      type: String,
      required: true,
      trim: true,
    },

    fonction: {
      type: String,
      required: true,
      trim: true,
    },

    matricule: {
      type: String,
      default: "",
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);