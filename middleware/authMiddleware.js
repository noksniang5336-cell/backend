const jwt = require("jsonwebtoken");

const protegerRoute = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Token manquant.",
      });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token invalide.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();
  } catch (error) {
    console.error(
      "❌ Erreur JWT :",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Token invalide ou expiré.",
    });
  }
};

module.exports = {
  protegerRoute,
};