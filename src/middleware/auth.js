const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "secret";

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Invalid token format" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check Redis for token
    const storedToken = await redisClient.get(`jwt:${decoded.userId}`);
    if (!storedToken || storedToken !== token) {
      return res.status(401).json({ error: "Session expired. Please login again." });
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = authMiddleware;
