const User = require("#models/User.js");
const { filteredUser } = require("#models/utils/UserUtils.js");
const { log } = require("#common/Logger.js");

/**
 * Gets the profile information for the currently authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const filtered = filteredUser(user);
    return res.status(200).json(filtered);
  } catch (err) {
    log(err.message, "ERROR", "routes GET /users/profile");
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getProfile };
