const express = require("express");
const { PrismaClient } = require("@prisma/client");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount signup routes at /signup
app.use("/signup", require("./routes/signup"));
app.use("/profile", require("./routes/profile"));

app.get("/", (req, res) => {
  res.send("Hello, Abhinav 🚀 Your Node.js + Prisma server is working!");
});

app.use(errorHandler);

app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
