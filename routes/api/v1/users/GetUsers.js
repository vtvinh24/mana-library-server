const User = require("#models/User.js");
const { filteredUser } = require("#models/utils/UserUtils.js");
const { log } = require("#common/Logger.js");

/**
 * Get all users with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, email, role, membershipStatus, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    // Build filter object
    const filter = {};
    if (name) {
      filter.$or = [{ "profile.firstName": { $regex: name, $options: "i" } }, { "profile.lastName": { $regex: name, $options: "i" } }, { "identifier.username": { $regex: name, $options: "i" } }];
    }
    if (email) filter["auth.email"] = { $regex: email, $options: "i" };
    if (role) filter["auth.role"] = role;
    if (membershipStatus) filter["library.membershipStatus"] = membershipStatus;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Query users with filters, pagination, and sorting
    const users = await User.find(filter).sort(sort).skip(skip).limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Filter out sensitive data for each user
    const filteredUsers = users.map((user) => filteredUser(user));

    return res.status(200).json({
      data: filteredUsers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    log(err.message, "ERROR", "routes GET /users");
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getUsers };
