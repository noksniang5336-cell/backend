
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// =====================================================
// INSCRIPTION
// POST /api/auth/register
// =====================================================

exports.register = async (req, res) => {
  try {
    console.log("📥 Données reçues :", req.body);

    const {
      prenom,
      nom,
      email,
      password,
      telephone,
      commune,
      structure_sanitaire,
      fonction,
      matricule,
    } = req.body;

    // Vérification des champs obligatoires
    if (
      !prenom ||
      !nom ||
      !email ||
      !password ||
      !telephone ||
      !commune ||
      !structure_sanitaire ||
      !fonction
    ) {
      return res.status(400).json({
        success: false,
        message: "Veuillez remplir tous les champs obligatoires.",
      });
    }

    // Vérification de la longueur du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 6 caractères.",
      });
    }

    // Normalisation de l'email
    const emailNormalise = email.trim().toLowerCase();

    // Vérifier si l'email existe déjà
    const utilisateurExiste = await User.findOne({
      email: emailNormalise,
    });

    if (utilisateurExiste) {
      return res.status(400).json({
        success: false,
        message: "Cette adresse email est déjà utilisée.",
      });
    }

    // Vérifier si le matricule existe déjà
    if (matricule && matricule.trim() !== "") {
      const matriculeExiste = await User.findOne({
        matricule: matricule.trim(),
      });

      if (matriculeExiste) {
        return res.status(400).json({
          success: false,
          message: "Ce matricule est déjà utilisé.",
        });
      }
    }

    // Hashage du mot de passe
    const motDePasseHash = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    const nouvelUtilisateur = await User.create({
      prenom: prenom.trim(),
      nom: nom.trim(),
      email: emailNormalise,
      telephone: telephone.trim(),
      commune: commune.trim(),
      structure_sanitaire: structure_sanitaire.trim(),
      fonction: fonction.trim(),
      matricule: matricule ? matricule.trim() : "",
      password: motDePasseHash,
    });

    console.log(
      "✅ Utilisateur créé avec succès :",
      nouvelUtilisateur._id
    );

    return res.status(201).json({
      success: true,
      message: "Inscription réussie.",
      user: {
        id: nouvelUtilisateur._id,
        prenom: nouvelUtilisateur.prenom,
        nom: nouvelUtilisateur.nom,
        email: nouvelUtilisateur.email,
        telephone: nouvelUtilisateur.telephone,
        commune: nouvelUtilisateur.commune,
        structure_sanitaire: nouvelUtilisateur.structure_sanitaire,
        fonction: nouvelUtilisateur.fonction,
        matricule: nouvelUtilisateur.matricule,
      },
    });
  } catch (error) {
    console.error("❌ Erreur inscription :", error);

    // Erreur de doublon MongoDB
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Cet email ou ce matricule existe déjà.",
      });
    }

    // Erreur de validation Mongoose
    if (error.name === "ValidationError") {
      const erreurs = Object.values(error.errors).map(
        (erreur) => erreur.message
      );

      return res.status(400).json({
        success: false,
        message: "Erreur de validation.",
        erreurs,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
      erreur: error.message,
    });
  }
};

// =====================================================
// CONNEXION
// POST /api/auth/login
// =====================================================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Tentative de connexion :", email);

    // Vérification des champs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Veuillez renseigner l'email et le mot de passe.",
      });
    }

    // Recherche de l'utilisateur
    const utilisateur = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!utilisateur) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect.",
      });
    }

    // Vérification du mot de passe
    const motDePasseCorrect = await bcrypt.compare(
      password,
      utilisateur.password
    );

    if (!motDePasseCorrect) {
      return res.status(401).json({
        success: false,
        message: "Email ou mot de passe incorrect.",
      });
    }

    // Vérification de JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET n'est pas défini dans .env");

      return res.status(500).json({
        success: false,
        message: "Configuration JWT manquante sur le serveur.",
      });
    }

    // Création du token JWT
    const token = jwt.sign(
      {
        id: utilisateur._id,
        email: utilisateur.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    console.log("✅ Connexion réussie :", utilisateur.email);

    return res.status(200).json({
      success: true,
      message: "Connexion réussie.",
      token,
      user: {
        id: utilisateur._id,
        prenom: utilisateur.prenom,
        nom: utilisateur.nom,
        email: utilisateur.email,
        telephone: utilisateur.telephone,
        commune: utilisateur.commune,
        structure_sanitaire: utilisateur.structure_sanitaire,
        fonction: utilisateur.fonction,
        matricule: utilisateur.matricule,
      },
    });
  } catch (error) {
    console.error("❌ Erreur connexion :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur.",
      erreur: error.message,
    });
  }
};

// =====================================================
// PROFIL
// GET /api/auth/profil
// =====================================================

exports.profil = async (req, res) => {
  try {
    // Vérifier que le middleware JWT a bien identifié l'utilisateur
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié.",
      });
    }

    // Rechercher l'utilisateur
    const utilisateur = await User.findById(req.user.id).select("-password");

    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: utilisateur._id,
        prenom: utilisateur.prenom,
        nom: utilisateur.nom,
        email: utilisateur.email,
        telephone: utilisateur.telephone,
        commune: utilisateur.commune,
        structure_sanitaire: utilisateur.structure_sanitaire,
        fonction: utilisateur.fonction,
        matricule: utilisateur.matricule,
        createdAt: utilisateur.createdAt,
        updatedAt: utilisateur.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Erreur récupération profil :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer le profil.",
      erreur: error.message,
    });
  }
};

// =====================================================
// MODIFICATION DU PROFIL
// PUT /api/auth/profil
// =====================================================

exports.updateProfil = async (req, res) => {
  try {
    // Vérification de l'authentification
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non authentifié.",
      });
    }

    const {
      prenom,
      nom,
      telephone,
      commune,
      structure_sanitaire,
      fonction,
      matricule,
    } = req.body;

    // Recherche de l'utilisateur
    const utilisateur = await User.findById(req.user.id);

    if (!utilisateur) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable.",
      });
    }

    // Mise à jour des champs
    if (prenom !== undefined) {
      utilisateur.prenom = prenom.trim();
    }

    if (nom !== undefined) {
      utilisateur.nom = nom.trim();
    }

    if (telephone !== undefined) {
      utilisateur.telephone = telephone.trim();
    }

    if (commune !== undefined) {
      utilisateur.commune = commune.trim();
    }

    if (structure_sanitaire !== undefined) {
      utilisateur.structure_sanitaire =
        structure_sanitaire.trim();
    }

    if (fonction !== undefined) {
      utilisateur.fonction = fonction.trim();
    }

    if (matricule !== undefined) {
      utilisateur.matricule = matricule.trim();
    }

    // Sauvegarder
    await utilisateur.save();

    return res.status(200).json({
      success: true,
      message: "Profil mis à jour avec succès.",
      user: {
        id: utilisateur._id,
        prenom: utilisateur.prenom,
        nom: utilisateur.nom,
        email: utilisateur.email,
        telephone: utilisateur.telephone,
        commune: utilisateur.commune,
        structure_sanitaire: utilisateur.structure_sanitaire,
        fonction: utilisateur.fonction,
        matricule: utilisateur.matricule,
        createdAt: utilisateur.createdAt,
        updatedAt: utilisateur.updatedAt,
      },
    });
  } catch (error) {
    console.error("❌ Erreur modification profil :", error);

    // Erreur de doublon
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Ce matricule est déjà utilisé.",
      });
    }

    // Erreur de validation
    if (error.name === "ValidationError") {
      const erreurs = Object.values(error.errors).map(
        (erreur) => erreur.message
      );

      return res.status(400).json({
        success: false,
        message: "Erreur de validation.",
        erreurs,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Impossible de modifier le profil.",
      erreur: error.message,
    });
  }
};


