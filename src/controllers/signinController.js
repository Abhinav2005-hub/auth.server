const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const redisClient = require("../config/redis");

const prisma = new PrismaClient ();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

//Signin Controller
async function signin(req, res) {
    try {
        const { email, password } = req.body;

        // check if email & password provided
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        // find user in main table
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // compare hashed password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(401).json({ error: "Invalid password" });
        }

        // generate new JWT
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

        // store token in redis for for session tracking
        await redisClient.setEx(`token:${user.id}`, 3600, token);

        //send response
        res.status(200).json ({
            message: "Signin successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
            token,
        });
    } catch (err) {
        console.error("Login error: ", err);
        res.status(500).json({ error: "Signin failed" });
    }
}

module.exports = { signin };