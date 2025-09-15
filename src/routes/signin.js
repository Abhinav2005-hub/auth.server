const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const redisClient = require("../config/redis");  // import redis client

const prisma = new PrismaClient();
const signinRouter = express.Router();

// For browser GET request (Signin form)
signinRouter.get("/", (req, res) => {
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

// Actual signin POST
signinRouter.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Email and password are required");
    }

    // Find user by email in Prisma
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).send("Invalid credentials");
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Invalid credentials");
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1h" }
    );

    // Save token in Redis (expire in 1 hour = 3600 sec)
    await redisClient.setEx(`token:${user.id}`, 3600, token);

    res.json({
      message: "Signin successful",
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).send("Signin failed");
  }
});

// logout
signinRouter.post("/logout", async (req, res) => {
    try {
      const { userId } = req.body; // frontend should send userId OR extract from JWT
      if (!userId) return res.status(400).json({ error: "User ID required for logout" });
  
      await redisClient.del(`token:${userId}`);
      res.json({ message: "Logged out successfully" });
    } catch (err) {
      console.error("Logout error:", err);
      res.status(500).json({ error: "Logout failed" });
    }
  });

module.exports = signinRouter;
