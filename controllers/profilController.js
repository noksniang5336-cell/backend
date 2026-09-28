const User = require("../models/User");

// Récupérer le profil
exports.getProfil = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable",
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// Modifier le profil
exports.updateProfil = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "Utilisateur introuvable",
      });
    }

    user.prenom = req.body.prenom;
    user.nom = req.body.nom;
    user.email = req.body.email;
    user.telephone = req.body.telephone;
    user.fonction = req.body.fonction;
    user.structure = req.body.structure;
    user.commune = req.body.commune;
    user.matricule = req.body.matricule;

    await user.save();

    res.json({
      message: "Profil mis à jour",
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};