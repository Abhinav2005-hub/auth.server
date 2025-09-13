const express = require("express");
// const { PrismaClient } = require("@prisma/client");
const errorHandler = require("./middleware/errorHandler");
const client = require("./db/redisClient");

const app = express();
// const prisma = new PrismaClient();

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// Mount signup routes at /signup
app.use("/signup", require("./routes/signup"));
app.use("/signin", require("./routes/signin"));
app.use("/profile", require("./routes/profile"));

app.get("/", async (req, res) => {
  await client.set("welcome", "Hello Abhinav 🚀");
  const value = await client.get("welcome");
  res.send(value);
});

app.use(errorHandler);

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
