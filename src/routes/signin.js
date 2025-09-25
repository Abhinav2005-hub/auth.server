const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redisClient = require("../config/redis");

require("dotenv").config();

const prisma = new PrismaClient();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// GET: Signin form for browser testing
router.get("/", (req, res) => {
  res.send(`
    <h1>Signin Page</h1>
    <form action="/signin" method="POST">
      <input type="email" name="email" placeholder="Enter email" required />
      <br><br>
      <input type="password" name="password" placeholder="Enter password" required />
      <br><br>
      <button type="submit">Signin</button>
    </form>
  `);
});

// POST: Signin with email/password
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user in main User table
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Incorrect password" });

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

    // Save JWT in Redis for session management
    await redisClient.setEx(`token:${user.id}`, 3600, token);

    res.json({
      message: "Login successful",
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

