const express = require("express");
const authMiddleware = require("../middleware/auth");
const { getProfile } = require("../controllers/profile");
const { PrismaClient } = require("@prisma/client");

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

    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: { id: true, name: true, email: true }, 
    });

    const totalUsers = await prisma.user.count();
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({ page, limit, totalUsers, totalPages, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = profileRouter;
