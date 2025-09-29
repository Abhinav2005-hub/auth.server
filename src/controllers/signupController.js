const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const redisClient = require("../config/redis");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// OTP settings
const OTP_EXPIRY = 5 * 60; // 5 minutes in seconds

// Generate 4-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// SIGNUP
async function signup(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY * 1000);

    // Save in temporary signup table
    await prisma.signup.upsert({
      where: { email },
      update: { name, password: hashedPassword, otp, otpExpiresAt },
      create: { name, email, password: hashedPassword, otp, otpExpiresAt },
    });

    console.log(`OTP for ${email}: ${otp}`); // replace with email/SMS in real app

    res.status(201).json({ message: "Signup initiated. Please verify OTP." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
}

// VERIFY OTP
async function verifyOtp(req, res) {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ error: "OTP is required" });
    }

    // Find signup row by OTP
    const signupRow = await prisma.signup.findFirst({
      where: { otp },
    });

    if (!signupRow) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Check expiry
    if (signupRow.otpExpiresAt < new Date()) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // Move user to main User table
    const newUser = await prisma.user.create({
      data: {
        name: signupRow.name,
        email: signupRow.email,
        password: signupRow.password,
      },
    });

    // Cleanup: delete signup row
    await prisma.signup.delete({ where: { email: signupRow.email } });

    // Generate JWT & save in Redis
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: "1h" });
    await redisClient.setEx(`token:${newUser.id}`, 3600, token);

    res.status(201).json({
      message: "User verified & created successfully",
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      token,
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).json({ error: "Verification failed" });
  }
}

module.exports = { signup, verifyOtp };
