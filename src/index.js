const express = require("express");
const errorHandler = require("./middleware/errorHandler");
const redisClient = require("./config/redis"); // import Redis client

const app = express();

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use("/signup", require("./routes/signup"));
app.use("/signin", require("./routes/signin"));
app.use("/profile", require("./routes/profile"));

// Test Redis
app.get("/", async (req, res) => {
  await redisClient.set("welcome", "Hello Abhinav 🚀");
  const value = await redisClient.get("welcome");
  res.send(value);
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
