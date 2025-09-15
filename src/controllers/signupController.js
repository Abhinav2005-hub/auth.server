
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Handle signup
async function signup(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP(); 
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY);

    await prisma.User.upsert({
        where: { email },
        update: { name, password: hashedPassword },
        create: { name, email, password: hashedPassword },
      });

    console.log(`OTP for ${email}: ${otp}`);
    res.status(201).json({ message: "Signup created. OTP sent." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
}

// Handle OTP verification
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const signupRow = await prisma.signup.findUnique({ where: { email } }); 
    if (!signupRow) {
      return res.status(400).json({ error: "No signup request found" });
    }

    if (new Date() > signupRow.otpExpiresAt) {
      await prisma.signup.delete({ where: { id: signupRow.id } });
      return res.status(400).json({ error: "OTP expired. Please signup again." });
    }

    if (signupRow.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    const newUser = await prisma.user.create({
      data: {
        name: signupRow.name,
        email: signupRow.email,
        password: signupRow.password,
      },
    });

    await prisma.signup.delete({ where: { id: signupRow.id } });

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      message: "User verified & created",
      user: newUser,
      token,
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
}

module.exports = { signup, verifyOtp };
