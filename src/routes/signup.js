const express = require("express");
const { signup, verifyOtp } = require("../controllers/signupController"); // your current controller
const signupRouter = express.Router();

// POST /signup → generates OTP and saves in temp table
signupRouter.post("/", signup);

// POST /signup/verify-otp → verify OTP and create user in main User table
signupRouter.post("/verify-otp", verifyOtp);

// GET /signup → simple HTML form for testing in browser
signupRouter.get("/", (req, res) => {
  res.send(`
    <h1>Signup Page</h1>
    <form action="/signup" method="POST">
      <input type="text" name="name" placeholder="Enter name" required /><br><br>
      <input type="email" name="email" placeholder="Enter email" required /><br><br>
      <input type="password" name="password" placeholder="Enter password" required /><br><br>
      <button type="submit">Signup</button>
    </form>

    <hr>

    <h3>Verify OTP</h3>
    <form action="/signup/verify-otp" method="POST">
      <input type="text" name="otp" placeholder="Enter OTP" required />
      <br><br>
      <button type="submit">Verify OTP</button>
    </form>
  `);
});

module.exports = signupRouter;

