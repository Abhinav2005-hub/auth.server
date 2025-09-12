const express = require("express");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Mount signup routes at /signup
app.use("/signup", require("./routes/signup"));

app.get("/", (req, res) => {
  res.send("Hello, Abhinav 🚀 Your Node.js + Prisma server is working!");
});

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
