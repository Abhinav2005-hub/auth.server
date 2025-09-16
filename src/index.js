const express = require("express");
const errorHandler = require("./middleware/errorHandler");
const redisClient = require("./config/redis"); // import Redis client
const authMiddleware = require("./middleware/auth"); // JWT auth middleware

const app = express();

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use("/signup", require("./routes/signup"));
app.use("/signin", require("./routes/signin"));
app.use("/profile", require("./routes/profile"));

// This is for testing authMiddleware without controllers
app.get("/Welcome", authMiddleware, (req, res) => {
  res.json({ message: `Welcome user ${req.userID}` });
});

// Test Redis
app.get("/", async (req, res) => {
  try{
    await redisClient.set("welcome", "Hello Abhinav 🚀");
    const value = await redisClient.get("welcome");
    res.send(value);
  } catch (err){
    console.error("Redis error:", err);
    res.status(500).json({berror: "Redis error" });
  }
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
