const User = require("#models/User.js");
const { filteredUser } = require("#models/utils/UserUtils.js");
const { log } = require("#common/Logger.js");
const { isMongoId } = require("#common/Validator.js");

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID format
    if (!isMongoId(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const filtered = filteredUser(user);
    return res.status(200).json(filtered);
  } catch (err) {
    log(err.message, "ERROR", "routes GET /users/:userId");
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getUserById };
