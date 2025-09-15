const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

async function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"]; // fixed

  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if token exists in Redis
    const storedToken = await redisClient.get(`token:${decoded.userId}`);
    if (!storedToken || storedToken !== token) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.userId = decoded.userId; // attach user ID to request
    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(403).json({ error: "Unauthorized" });
  }
}

module.exports = authMiddleware;
