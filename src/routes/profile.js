
const express = require("express");
const authMiddleware = require("../middleware/auth");
const { getProfile } = require("../controllers/profile");

const profileRouter = express.Router();

profileRouter.get("/", authMiddleware, getProfile);

module.exports = profileRouter;