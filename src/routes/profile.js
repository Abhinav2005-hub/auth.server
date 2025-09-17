const express = require("express");
const authMiddleware = require("../middleware/auth");
const { getProfile } = require("../controllers/profile");
const { PrismaClient } = require("@prisma/client");
const client = require("../config/redis"); // make sure this exists

const prisma = new PrismaClient();
const profileRouter = express.Router();

// GET: /profile/
profileRouter.get("/", authMiddleware, getProfile);

// GET: /profile/users
profileRouter.get("/users", async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 5;

    const skip = (page - 1) * limit;
    const cacheKey = `users:page=${page}:limit=${limit}`;

    const cachedData = await client.get(cacheKey);
    if (cachedData) {
      console.log("Serving from Redis cache");
      return res.json(JSON.parse(cachedData));
    }

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: { id: true, name: true, email: true },
    });

    const totalUsers = await prisma.user.count();
    const totalPages = Math.ceil(totalUsers / limit);

    const response = { page, limit, totalUsers, totalPages, users };

    await client.set(cacheKey, JSON.stringify(response), { EX: 60 });
    console.log("Stored in Redis cache");

    res.json(response);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Post: /profile/logout
profileRouter.post("/logout", authMiddleware, async (req, res) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(400).json({ error: "Token missing" });
        }

        //Delete JWT from redis
        await client.del(`jwt:${req.userId}`);

        res.json({ message: "Logged out successfully" });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = profileRouter;
