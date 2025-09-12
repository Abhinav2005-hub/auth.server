
const getProfile = (req, res) => {
    const userId = req.userId; // comes from authMiddleware
    res.json({ message: `Welcome, user with ID: ${userId}` });
  };
  
  module.exports = { getProfile };