const User = require("../models/userModel.js");
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
  try {
    const token = req.query.token;
    const secret = req.query.secret;

    if (!token || !secret || secret !== process.env.SECRET_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid Token" });
    }

    const user = await User.findOne({ _id: decodedToken.userId });
    if (!user) {
      return res.status(404).json({ error: "Token not Found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server Error" });
  }
};
