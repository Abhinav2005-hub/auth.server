const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
// const JWT_SECRET = "abhinav@123"; // move to .env
const signupRouter = express.Router();

require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
console.log(JWT_SECRET, '-------');
// Browser test route
signupRouter.get("/", (req, res) => {
  res.send(`
    <h1>Signup Page</h1>
    <form action="/signup" method="POST">
      <input type="text" name="name" placeholder="Enter name" required />
      <br><br>
      <input type="email" name="email" placeholder="Enter email" required />
      <br><br>
      <input type="password" name="password" placeholder="Enter password" required />
      <br><br>
      <button type="submit">Signup</button>
    </form>
  `);
});

// Signup POST
signupRouter.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Generate token
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Signup successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Signup failed" });
  }
});

module.exports = signupRouter;
