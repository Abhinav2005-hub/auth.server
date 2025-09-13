
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getProfile = async (req, res) => {
  try {
    const userId = req.userId; // set by authMiddleware

    // find the user by their ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true } // select only safe fields
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getProfile };
