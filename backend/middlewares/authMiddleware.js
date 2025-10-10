const User = require("../models/userModel.js");
const jwt = require("jsonwebtoken");

exports.sessionMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Invalid Token" });
    }

    const authToken = authHeader.split(" ")[1];

    let decodedToken;
    try {
      decodedToken = jwt.verify(authToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid Token" });
    }

    const user = await User.findOne({ _id: decodedToken.userId });

    if (!user) {
      return res.status(404).json({ error: "Token not Found" });
    } else {
      user.updatedAt = new Date();
      await user.save();
      req.user = user;
      next();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};

// Secret key middleware
exports.secretKeyMiddleware = (req, res, next) => {
  const secretKey = req.headers["x-header-secret-key"];

  if (!secretKey || secretKey !== process.env.SECRET_KEY) {
    return res.status(403).json({ error: "Forbidden", message: "Invalid or missing secret key" });
  }

  next(); // Continue to the next middleware if the key is valid
};
