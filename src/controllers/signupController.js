const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const redisClient = require("../config/redis");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

// Generate 4-digit OTP
function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Signup: Save user in temporary table + send OTP
async function signup(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY);

    // Save in temporary signup table
    await prisma.signup.upsert({
      where: { email },
      update: { name, password: hashedPassword, otp, otpExpiresAt },
      create: { name, email, password: hashedPassword, otp, otpExpiresAt },
    });

    console.log(`OTP for ${email}: ${otp}`); // For testing, replace with email/SMS

    res.status(201).json({ message: "Signup initiated. Please verify OTP." });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
}

// Verify OTP: Move user to main table + generate JWT
async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

    const signupRow = await prisma.signup.findUnique({ where: { email } });
    if (!signupRow) return res.status(400).json({ error: "No signup request found" });

    if (new Date() > signupRow.otpExpiresAt) {
      await prisma.signup.delete({ where: { email } });
      return res.status(400).json({ error: "OTP expired. Please signup again." });
    }

    if (signupRow.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

    // Move user to main User table
    const newUser = await prisma.user.create({
      data: {
        name: signupRow.name,
        email: signupRow.email,
        password: signupRow.password,
      },
    });

    await prisma.signup.delete({ where: { email } });

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

